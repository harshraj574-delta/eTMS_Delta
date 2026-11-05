import { stopKey } from './adapters';

/**
 * Route-edit commands.
 *
 * Every edit made on the map is described as a plain command object first.
 * The same object is validated (validators.js), simulated (applyToSequences),
 * shown in the confirm dialog (describeCommand) and finally sent to the
 * server (api/routeEditApi.js). Phase 2 will send a list of these to a batch
 * commit endpoint instead of one API call each, without touching the UI.
 *
 * Stop shape used throughout: { key, routeId, empId, empCode, empName, stopNo, gender, lat, lng }
 */

export const COMMAND = {
    MOVE: 'move',
    REORDER: 'reorder',
    SPLIT: 'split',
    MERGE: 'merge',
    ADD: 'add',
    REMOVE: 'remove',
};

const unique = (values) => [...new Set(values)];

export { stopKey };

/** Move stops (from one or more routes) into targetRouteId at 1-based position. */
export const moveEmployees = ({ stops, targetRouteId, position }) => {
    const isReorder = stops.length > 0 && stops.every((s) => s.routeId === targetRouteId);
    return {
        type: isReorder ? COMMAND.REORDER : COMMAND.MOVE,
        stops,
        targetRouteId,
        position,
        affectedRouteIds: unique([...stops.map((s) => s.routeId), targetRouteId]),
    };
};

/** Mirrors SplitRoute: the selected stops go to a new route named `${routeId}S`. */
export const splitRoute = ({ routeId, stops }) => ({
    type: COMMAND.SPLIT,
    routeId,
    stops,
    newRouteId: `${routeId}S`,
    affectedRouteIds: [routeId, `${routeId}S`],
});

/** Mirrors MergeRoute: every route is merged into the first one. */
export const mergeRoutes = ({ routeIds }) => ({
    type: COMMAND.MERGE,
    routeIds,
    targetRouteId: routeIds[0],
    affectedRouteIds: [...routeIds],
});

/** employee comes from EmpSearch: { id, empName, empCode?, Gender? } */
export const addEmployee = ({ employee, routeId, position }) => ({
    type: COMMAND.ADD,
    employee,
    routeId,
    position,
    affectedRouteIds: [routeId],
});

export const removeEmployee = ({ stop }) => ({
    type: COMMAND.REMOVE,
    stop,
    affectedRouteIds: [stop.routeId],
});

const sortByStop = (stops) => [...stops].sort((a, b) => Number(a.stopNo) - Number(b.stopNo));

const clampIndex = (position, length) => Math.min(Math.max(Number(position) - 1, 0), length);

/**
 * Pure simulation of a command against the current stop sequences.
 * @param {object} command
 * @param {Record<string, object[]>} sequences routeId -> stops
 * @returns {Record<string, object[]>} routeId -> stops after the command, renumbered 1..n
 *          (only routes the command touches are included; a merged-away route maps to [])
 */
export const applyToSequences = (command, sequences) => {
    const get = (routeId) => sortByStop(sequences[routeId] || []);
    const result = {};

    switch (command.type) {
        case COMMAND.MOVE:
        case COMMAND.REORDER: {
            const movingKeys = new Set(command.stops.map((s) => s.key));
            command.affectedRouteIds.forEach((routeId) => {
                result[routeId] = get(routeId).filter((s) => !movingKeys.has(s.key));
            });
            const target = result[command.targetRouteId];
            const moved = command.stops.map((s) => ({ ...s, routeId: command.targetRouteId }));
            target.splice(clampIndex(command.position, target.length), 0, ...moved);
            break;
        }
        case COMMAND.SPLIT: {
            const splitKeys = new Set(command.stops.map((s) => s.key));
            const source = get(command.routeId);
            result[command.routeId] = source.filter((s) => !splitKeys.has(s.key));
            result[command.newRouteId] = source
                .filter((s) => splitKeys.has(s.key))
                .map((s) => ({ ...s, routeId: command.newRouteId }));
            break;
        }
        case COMMAND.MERGE: {
            result[command.targetRouteId] = command.routeIds.flatMap((routeId) =>
                get(routeId).map((s) => ({ ...s, routeId: command.targetRouteId }))
            );
            command.routeIds.slice(1).forEach((routeId) => {
                result[routeId] = [];
            });
            break;
        }
        case COMMAND.ADD: {
            const target = get(command.routeId);
            const { employee } = command;
            target.splice(clampIndex(command.position, target.length), 0, {
                key: stopKey(command.routeId, employee.id),
                routeId: command.routeId,
                empId: String(employee.id),
                empCode: employee.empCode ?? employee.id,
                empName: employee.empName,
                gender: employee.Gender ?? employee.gender,
            });
            result[command.routeId] = target;
            break;
        }
        case COMMAND.REMOVE: {
            result[command.stop.routeId] = get(command.stop.routeId).filter(
                (s) => s.key !== command.stop.key
            );
            break;
        }
        default:
            throw new Error(`Unknown route-edit command: ${command.type}`);
    }

    Object.keys(result).forEach((routeId) => {
        result[routeId] = result[routeId].map((s, i) => ({ ...s, stopNo: i + 1 }));
    });
    return result;
};

/**
 * UpdateCutPaste's `stopno` is a slot in the target route's *current* order,
 * moving employees included: "insert before whoever is at stop N now", with
 * N = length + 1 meaning the end (same numbering as Manage Route's drop zones).
 * Commands carry the *final* position instead, so convert. The two only differ
 * when employees move down within their own route: in a 3-stop route, moving
 * stop 2 to final position 3 is stopno 4.
 */
export const toServerStopNo = (command, targetStops) => {
    const current = sortByStop(targetStops);
    const movingKeys = new Set(command.stops.map((s) => s.key));
    const remaining = current.filter((s) => !movingKeys.has(s.key));
    const insertBefore = remaining[clampIndex(command.position, remaining.length)];
    return insertBefore ? current.indexOf(insertBefore) + 1 : current.length + 1;
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const who = (stops) =>
    stops.length === 1 ? stops[0].empName || stops[0].empCode : plural(stops.length, 'employee');

/** Human-readable one-liner for confirm dialogs and toasts. */
export const describeCommand = (command) => {
    switch (command.type) {
        case COMMAND.MOVE:
            return `Move ${who(command.stops)} to route ${command.targetRouteId} at stop ${command.position}`;
        case COMMAND.REORDER:
            return `Move ${who(command.stops)} to stop ${command.position} in route ${command.targetRouteId}`;
        case COMMAND.SPLIT:
            return `Split ${who(command.stops)} from route ${command.routeId} into new route ${command.newRouteId}`;
        case COMMAND.MERGE:
            return `Merge ${plural(command.routeIds.length, 'route')} into route ${command.targetRouteId}`;
        case COMMAND.ADD:
            return `Add ${command.employee.empName || command.employee.id} to route ${command.routeId} at stop ${command.position}`;
        case COMMAND.REMOVE:
            return `Remove ${command.stop.empName || command.stop.empCode} from route ${command.stop.routeId}`;
        default:
            return 'Apply change';
    }
};
