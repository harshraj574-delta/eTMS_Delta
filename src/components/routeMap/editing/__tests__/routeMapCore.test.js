import { describe, it, expect } from 'vitest';
import { assignRouteColors } from '../../hooks/useStableRouteColors';
import { getRouteEditAccess } from '../permissions';
import { employeeIdOf, toStop, toRoute, rowStopKey } from '../model/adapters';

describe('assignRouteColors', () => {
    it('assigns in list order initially', () => {
        expect([...assignRouteColors(['A', 'B', 'C'], new Map(), 5)]).toEqual([['A', 0], ['B', 1], ['C', 2]]);
    });

    it('keeps existing colours when a split inserts a route mid-list', () => {
        const first = assignRouteColors(['A', 'B', 'C'], new Map(), 5);
        const next = assignRouteColors(['A', 'AS', 'B', 'C'], first, 5);
        expect(next.get('A')).toBe(0);
        expect(next.get('B')).toBe(1);
        expect(next.get('C')).toBe(2);
        expect(next.get('AS')).toBe(3);
    });

    it('frees colours of routes that disappear (merge) for later routes', () => {
        const first = assignRouteColors(['A', 'B', 'C'], new Map(), 5);
        const merged = assignRouteColors(['A', 'C'], first, 5);
        expect([...merged]).toEqual([['A', 0], ['C', 2]]);
        expect(assignRouteColors(['A', 'C', 'D'], merged, 5).get('D')).toBe(1);
    });

    it('wraps once the palette is exhausted', () => {
        const ids = ['A', 'B', 'C'];
        expect([...assignRouteColors(ids, new Map(), 2).values()]).toEqual([0, 1, 0]);
    });
});

describe('getRouteEditAccess', () => {
    const session = (fields, admin = false) => ({ getUserSession: () => fields, isAdmin: () => admin });

    it('defaults to any signed-in user', () => {
        expect(getRouteEditAccess({ env: {}, session: session({ ID: '42' }) })).toEqual({ canEdit: true, userId: 42, reason: null });
    });

    it('is view-only without a session user', () => {
        const access = getRouteEditAccess({ env: {}, session: session({ ID: null }) });
        expect(access.canEdit).toBe(false);
        expect(access.reason).toMatch(/signed in/);
    });

    it('honours the rollout flag', () => {
        expect(getRouteEditAccess({ env: { VITE_ROUTE_MAP_EDITING: 'off' }, session: session({ ID: '1' }, true) }).canEdit).toBe(false);
        expect(getRouteEditAccess({ env: { VITE_ROUTE_MAP_EDITING: 'admins' }, session: session({ ID: '1' }) }).canEdit).toBe(false);
        expect(getRouteEditAccess({ env: { VITE_ROUTE_MAP_EDITING: 'ADMINS' }, session: session({ ID: '1' }, true) }).canEdit).toBe(true);
        // unknown values fall back to the default instead of locking everyone out
        expect(getRouteEditAccess({ env: { VITE_ROUTE_MAP_EDITING: 'yes' }, session: session({ ID: '1' }) }).canEdit).toBe(true);
    });

    describe('through etms-api', () => {
        const withPermissions = (permissions) => ({ env: {}, session: session({ ID: '7' }), access: { active: true, permissions, pages: [] } });

        it('needs the Manage Route permission', () => {
            expect(getRouteEditAccess(withPermissions(['route.view', 'route.manage'])).canEdit).toBe(true);
            const viewer = getRouteEditAccess(withPermissions(['route.view']));
            expect(viewer.canEdit).toBe(false);
            expect(viewer.reason).toMatch(/Manage Route/);
        });

        it('accepts wildcard grants like the server', () => {
            expect(getRouteEditAccess(withPermissions(['*'])).canEdit).toBe(true);
            expect(getRouteEditAccess(withPermissions(['route.*'])).canEdit).toBe(true);
        });

        it('is view-only until the access has loaded', () => {
            expect(getRouteEditAccess({ env: {}, session: session({ ID: '7' }), access: null }).canEdit).toBe(false);
        });

        it('ignores the admins-only flag: the server decides', () => {
            expect(getRouteEditAccess({ ...withPermissions(['route.manage']), env: { VITE_ROUTE_MAP_EDITING: 'admins' } }).canEdit).toBe(true);
        });
    });
});

describe('adapters', () => {
    const row = { id: 5273, empCode: '202665', empName: 'Panna Lal Das', stopNo: 2, ETA: '22:03', Gender: 'M', GeoX: '77.2', GeoY: '28.5', facGeoX: '77.0', facGeoY: '28.4' };

    it('reads the employee id from whichever field the API sent', () => {
        expect(employeeIdOf({ id: 1 })).toBe('1');
        expect(employeeIdOf({ empID: 2 })).toBe('2');
        expect(employeeIdOf({ empId: 3 })).toBe('3');
        expect(employeeIdOf({ empCode: 'X9' })).toBe('X9');
    });

    it('builds the same key for a row and its Stop', () => {
        const stop = toStop('R1', row);
        expect(stop).toMatchObject({ key: 'R1-5273', empId: '5273', lat: 28.5, lng: 77.2, eta: '22:03', gender: 'M' });
        expect(rowStopKey('R1', row)).toBe(stop.key);
    });

    it('assembles a route with lock/guard flags and facility', () => {
        const route = toRoute({ RouteID: 'R1', isRouteFinalized: 1, PlannedGuard: '1' }, [row], { geometry: null });
        expect(route).toMatchObject({ routeId: 'R1', isLocked: true, plannedGuard: true, path: null });
        expect(route.facility).toEqual({ facilityGeoX: '77.0', facilityGeoY: '28.4' });
        expect(route.stops).toHaveLength(1);
    });
});
