import ManageRouteService from '../../../../services/compliance/ManageRouteService';
import { COMMAND, toServerStopNo } from '../model/commands';

const firstRow = (response) => {
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    return Array.isArray(parsed) ? parsed[0] : parsed;
};

const SPLIT_ERRORS = {
    0: (cmd) => `Split route ${cmd.newRouteId} already exists. Cannot split again.`,
    [-1]: () => 'Cannot split a route that already ends with "S".',
};

/**
 * Phase 1: one existing API call per command, same payloads Manage Route sends.
 * Throws an Error with a user-facing message when the server rejects the change.
 *
 * @param {object} command see model/commands.js
 * @param {{ userId: number, sDate: string, facilityId: string, tripType: string, shiftTime: string,
 *           targetStops?: object[] }} ctx targetStops = current stops of a move's target route
 */
export const executeCommand = async (command, ctx) => {
    switch (command.type) {
        case COMMAND.MOVE:
        case COMMAND.REORDER:
            return ManageRouteService.UpdateCutPaste({
                OldRouteid: command.stops.map((s) => s.routeId).join(','),
                oldemployeeid: command.stops.map((s) => s.empId).join(','),
                newrouteid: String(command.targetRouteId),
                stopno: toServerStopNo(command, ctx.targetStops ?? []),
                userid: ctx.userId,
            });

        case COMMAND.SPLIT: {
            const row = firstRow(
                await ManageRouteService.SplitRoute({
                    RouteIDs: command.routeId,
                    empIDs: command.stops.map((s) => s.empId).join(','),
                })
            );
            if (row?.result !== 1) {
                throw new Error(SPLIT_ERRORS[row?.result]?.(command) ?? 'Unexpected response from split operation.');
            }
            return row;
        }

        case COMMAND.MERGE:
            return ManageRouteService.MergeRoute({
                RouteIDs: command.routeIds.join(','),
                userid: ctx.userId,
            });

        case COMMAND.ADD: {
            const row = firstRow(
                await ManageRouteService.AddEmpToRoute({
                    empId: command.employee.id,
                    stopNo: command.position,
                    routeId: command.routeId,
                    isDelete: 0,
                    IsNewAdded: 0,
                    updatedby: ctx.userId,
                })
            );
            if (row?.RESULT !== 1) throw new Error('The server did not add the employee to the route.');
            return row;
        }

        case COMMAND.REMOVE: {
            const row = firstRow(
                await ManageRouteService.DeleteEmployeeFromRoute({
                    sDate: ctx.sDate,
                    FacilityID: ctx.facilityId,
                    TripType: ctx.tripType,
                    Shifttimes: ctx.shiftTime,
                    RouteID: command.stop.routeId,
                    EmpID: command.stop.empId,
                    uname: ctx.userId,
                })
            );
            if (row?.RESULT !== 1) throw new Error('The server did not remove the employee from the route.');
            return row;
        }

        default:
            throw new Error(`Unknown route-edit command: ${command.type}`);
    }
};
