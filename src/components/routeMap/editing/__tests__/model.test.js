import { describe, it, expect } from 'vitest';
import {
    COMMAND,
    stopKey,
    moveEmployees,
    splitRoute,
    mergeRoutes,
    addEmployee,
    removeEmployee,
    applyToSequences,
    describeCommand,
    toServerStopNo,
} from '../model/commands';
import { validateCommand } from '../model/validators';
import { findRouteNearPoint, bestInsertionPosition } from '../map/geo';

const stop = (routeId, empId, stopNo, gender = 'M') => ({
    key: stopKey(routeId, empId),
    routeId,
    empId,
    empCode: empId,
    empName: `Emp ${empId}`,
    stopNo,
    gender,
});

const route = (routeId, stops, extra = {}) => ({ routeId, stops, isLocked: false, plannedGuard: false, ...extra });

const fixture = () => {
    const r1 = [stop('R1', 'a', 1), stop('R1', 'b', 2), stop('R1', 'c', 3)];
    const r2 = [stop('R2', 'x', 1), stop('R2', 'y', 2)];
    return {
        r1,
        r2,
        routesById: { R1: route('R1', r1), R2: route('R2', r2) },
        sequences: { R1: r1, R2: r2 },
    };
};

const ids = (stops) => stops.map((s) => s.empId);

describe('route-edit commands', () => {
    it('moves stops to another route at the given position and renumbers both routes', () => {
        const { r1, sequences } = fixture();
        const cmd = moveEmployees({ stops: [r1[0]], targetRouteId: 'R2', position: 2 });

        expect(cmd.type).toBe(COMMAND.MOVE);
        expect(cmd.affectedRouteIds).toEqual(['R1', 'R2']);

        const result = applyToSequences(cmd, sequences);
        expect(ids(result.R1)).toEqual(['b', 'c']);
        expect(ids(result.R2)).toEqual(['x', 'a', 'y']);
        expect(result.R2.map((s) => s.stopNo)).toEqual([1, 2, 3]);
        expect(result.R2[1].routeId).toBe('R2');
    });

    it('treats a move within the same route as a reorder', () => {
        const { r1, sequences } = fixture();
        const down = moveEmployees({ stops: [r1[0]], targetRouteId: 'R1', position: 3 });
        expect(down.type).toBe(COMMAND.REORDER);
        expect(ids(applyToSequences(down, sequences).R1)).toEqual(['b', 'c', 'a']);

        const up = moveEmployees({ stops: [r1[2]], targetRouteId: 'R1', position: 2 });
        expect(ids(applyToSequences(up, sequences).R1)).toEqual(['a', 'c', 'b']);
    });

    it('splits selected stops into `${routeId}S`', () => {
        const { r1, sequences } = fixture();
        const cmd = splitRoute({ routeId: 'R1', stops: [r1[1], r1[2]] });
        const result = applyToSequences(cmd, sequences);
        expect(cmd.newRouteId).toBe('R1S');
        expect(ids(result.R1)).toEqual(['a']);
        expect(ids(result.R1S)).toEqual(['b', 'c']);
    });

    it('merges every route into the first one', () => {
        const { sequences } = fixture();
        const result = applyToSequences(mergeRoutes({ routeIds: ['R2', 'R1'] }), sequences);
        expect(ids(result.R2)).toEqual(['x', 'y', 'a', 'b', 'c']);
        expect(result.R1).toEqual([]);
    });

    it('adds and removes employees', () => {
        const { r2, sequences } = fixture();
        const added = applyToSequences(
            addEmployee({ employee: { id: 'n', empName: 'New' }, routeId: 'R2', position: 1 }),
            sequences
        );
        expect(ids(added.R2)).toEqual(['n', 'x', 'y']);

        const removed = applyToSequences(removeEmployee({ stop: r2[0] }), sequences);
        expect(ids(removed.R2)).toEqual(['y']);
    });

    it('converts final positions to UpdateCutPaste slot numbers (current order, mover included)', () => {
        const { r1, r2 } = fixture();
        const slot = (stops, targetRouteId, position, targetStops) =>
            toServerStopNo(moveEmployees({ stops, targetRouteId, position }), targetStops);

        // Moving down within the route: stop 2 -> final 3 is "after current stop 3" = slot 4.
        expect(slot([r1[1]], 'R1', 3, r1)).toBe(4);
        expect(slot([r1[0]], 'R1', 2, r1)).toBe(3);
        // Moving up is the same number either way.
        expect(slot([r1[2]], 'R1', 2, r1)).toBe(2);
        expect(slot([r1[1]], 'R1', 1, r1)).toBe(1);
        // Cross-route moves are unaffected.
        expect(slot([r1[0]], 'R2', 2, r2)).toBe(2);
        expect(slot([r1[0]], 'R2', 3, r2)).toBe(3);
        // Multi-select reorder: a, b to the end of R1.
        expect(slot([r1[0], r1[1]], 'R1', 2, r1)).toBe(4);
    });

    it('describes commands for the confirm dialog', () => {
        const { r1 } = fixture();
        expect(describeCommand(moveEmployees({ stops: [r1[0]], targetRouteId: 'R2', position: 1 })))
            .toBe('Move Emp a to route R2 at stop 1');
        expect(describeCommand(mergeRoutes({ routeIds: ['R1', 'R2'] }))).toBe('Merge 2 routes into route R1');
    });
});

describe('validateCommand', () => {
    it('blocks edits touching a finalized route', () => {
        const { r1, routesById } = fixture();
        routesById.R2.isLocked = true;
        const { errors } = validateCommand(
            moveEmployees({ stops: [r1[0]], targetRouteId: 'R2', position: 1 }),
            { routesById, tripType: 'P' }
        );
        expect(errors[0]).toMatch(/R2 is finalized/);
    });

    it('rejects a split that would empty the route or re-split an S route', () => {
        const { r1, routesById } = fixture();
        expect(validateCommand(splitRoute({ routeId: 'R1', stops: r1 }), { routesById, tripType: 'P' }).errors)
            .toContain('Leave at least one employee on the original route.');

        const sRoute = { R1S: route('R1S', [stop('R1S', 'q', 1), stop('R1S', 'w', 2)]) };
        expect(
            validateCommand(splitRoute({ routeId: 'R1S', stops: [sRoute.R1S.stops[0]] }), { routesById: sRoute, tripType: 'P' }).errors
        ).toContain('Cannot split a route that already ends with "S".');
    });

    it('rejects adding an employee who is already routed', () => {
        const { routesById } = fixture();
        const { errors } = validateCommand(
            addEmployee({ employee: { id: 'x', empName: 'X' }, routeId: 'R1', position: 1 }),
            { routesById, tripType: 'P' }
        );
        expect(errors[0]).toMatch(/already on route R2/);
    });

    it('warns when a female employee becomes the first pickup without a guard', () => {
        const { routesById } = fixture();
        routesById.R2.stops.push(stop('R2', 'f', 3, 'F'));
        const female = routesById.R2.stops[2];
        const { errors, warnings } = validateCommand(
            moveEmployees({ stops: [female], targetRouteId: 'R1', position: 1 }),
            { routesById, tripType: 'P' }
        );
        expect(errors).toEqual([]);
        expect(warnings.some((w) => /R1: Emp f will be the first pickup/.test(w))).toBe(true);

        routesById.R1.plannedGuard = true;
        expect(
            validateCommand(moveEmployees({ stops: [female], targetRouteId: 'R1', position: 1 }), { routesById, tripType: 'P' }).warnings
        ).toEqual([]);
    });

    it('checks the last drop for drop trips', () => {
        const { routesById } = fixture();
        routesById.R2.stops.push(stop('R2', 'f', 3, 'F'));
        const { warnings } = validateCommand(removeEmployee({ stop: routesById.R2.stops[0] }), { routesById, tripType: 'D' });
        expect(warnings.some((w) => /last drop/.test(w))).toBe(true);
    });
});

describe('map geometry helpers', () => {
    // Identity projection: treat [lat, lng] as pixel [y, x].
    const project = ([lat, lng]) => ({ x: lng, y: lat });

    it('finds the route whose line is within the hit distance', () => {
        const routes = [
            { routeId: 'A', path: [[0, 0], [0, 100]], stops: [] },
            { routeId: 'B', path: [[50, 0], [50, 100]], stops: [] },
        ];
        expect(findRouteNearPoint([45, 30], routes, project, 10)).toBe('B');
        expect(findRouteNearPoint([25, 30], routes, project, 10)).toBeNull();
        expect(findRouteNearPoint([45, 30], routes, project, 10, ['B'])).toBeNull();
    });

    it('picks the cheapest insertion slot', () => {
        const stops = [{ lat: 0, lng: 0 }, { lat: 0, lng: 100 }, { lat: 0, lng: 200 }];
        expect(bestInsertionPosition([1, 50], stops, project)).toBe(2);
        expect(bestInsertionPosition([0, -40], stops, project)).toBe(1);
        expect(bestInsertionPosition([0, 260], stops, project)).toBe(4);
        expect(bestInsertionPosition([0, 0], [], project)).toBe(1);
    });
});
