import { COMMAND, applyToSequences } from './commands';

/**
 * Client-side rule checks run before a command is confirmed.
 * Errors block the command; warnings are shown in the confirm dialog.
 * The server remains the source of truth (Phase 2 moves these server-side).
 *
 * @param {object} command
 * @param {{ routesById: Record<string, { routeId, isLocked, plannedGuard, stops: object[] }>, tripType: 'P'|'D' }} ctx
 * @returns {{ errors: string[], warnings: string[], result: Record<string, object[]> | null }}
 */
export const validateCommand = (command, { routesById, tripType }) => {
    const errors = [];
    const warnings = [];

    const existing = command.affectedRouteIds.filter((id) => routesById[id]);
    existing
        .filter((id) => routesById[id].isLocked)
        .forEach((id) => errors.push(`Route ${id} is finalized. Unlock it on Manage Route before editing.`));

    switch (command.type) {
        case COMMAND.MOVE:
        case COMMAND.REORDER: {
            if (!command.stops.length) errors.push('Select at least one employee to move.');
            if (!routesById[command.targetRouteId]) errors.push(`Route ${command.targetRouteId} is not loaded.`);
            if (command.type === COMMAND.MOVE) {
                command.affectedRouteIds
                    .filter((id) => id !== command.targetRouteId && routesById[id])
                    .filter((id) => command.stops.filter((s) => s.routeId === id).length === routesById[id].stops.length)
                    .forEach((id) => warnings.push(`Route ${id} will have no employees left.`));
            }
            break;
        }
        case COMMAND.SPLIT: {
            const source = routesById[command.routeId];
            if (command.stops.some((s) => s.routeId !== command.routeId)) {
                errors.push('All selected employees must be on the same route to split.');
            }
            if (String(command.routeId).toUpperCase().endsWith('S')) {
                errors.push('Cannot split a route that already ends with "S".');
            }
            if (routesById[command.newRouteId]) {
                errors.push(`Split route ${command.newRouteId} already exists.`);
            }
            if (source && command.stops.length >= source.stops.length) {
                errors.push('Leave at least one employee on the original route.');
            }
            break;
        }
        case COMMAND.MERGE: {
            if (command.routeIds.length < 2) errors.push('Select at least two routes to merge.');
            break;
        }
        case COMMAND.ADD: {
            const onRoute = Object.values(routesById).find((r) =>
                r.stops.some((s) => String(s.empId) === String(command.employee.id))
            );
            if (onRoute) {
                errors.push(`${command.employee.empName || command.employee.id} is already on route ${onRoute.routeId}.`);
            }
            break;
        }
        case COMMAND.REMOVE: {
            const route = routesById[command.stop.routeId];
            if (route && route.stops.length === 1) {
                warnings.push(`Route ${route.routeId} will have no employees left.`);
            }
            break;
        }
        default:
            errors.push(`Unknown command: ${command.type}`);
    }

    if (errors.length) return { errors, warnings, result: null };

    const sequences = Object.fromEntries(
        Object.values(routesById).map((r) => [r.routeId, r.stops])
    );
    const result = applyToSequences(command, sequences);

    // Escort rule: a female employee picked up first / dropped last needs a guard.
    Object.entries(result).forEach(([routeId, stops]) => {
        if (!stops.length) return;
        const plannedGuard = routesById[routeId]?.plannedGuard ?? routesById[command.routeId]?.plannedGuard;
        if (plannedGuard) return;
        const critical = tripType === 'D' ? stops[stops.length - 1] : stops[0];
        if (String(critical.gender || '').toUpperCase().startsWith('F')) {
            warnings.push(
                `Route ${routeId}: ${critical.empName || critical.empCode} will be the ${tripType === 'D' ? 'last drop' : 'first pickup'} and is female. A guard may be required.`
            );
        }
    });

    return { errors, warnings, result };
};
