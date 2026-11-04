import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toastService } from '../../../../services/toastService';
import {
    manageRouteKeys,
    recalculateRoutesByIds,
} from '../../../manageRoute/hooks/useManageRouteQueries';
import { COMMAND, describeCommand, applyToSequences } from '../model/commands';
import { rowStopKey } from '../model/adapters';
import { validateCommand } from '../model/validators';
import { executeCommand } from '../api/routeEditApi';
import { notifyRouteEdit } from '../sync';

/**
 * After a successful move/reorder, write the new order straight into the
 * route-details cache so the UI doesn't flash back to the old order while the
 * refetch is in flight. The refetch that follows replaces it with server data.
 */
const patchRouteDetailsCache = (queryClient, command, routesById) => {
    const sequences = Object.fromEntries(Object.values(routesById).map((r) => [r.routeId, r.stops]));
    const result = applyToSequences(command, sequences);

    const rawByKey = new Map();
    command.affectedRouteIds.forEach((routeId) => {
        (queryClient.getQueryData(manageRouteKeys.routeDetails(routeId)) || []).forEach((emp) =>
            rawByKey.set(rowStopKey(routeId, emp), emp)
        );
    });

    Object.entries(result).forEach(([routeId, stops]) => {
        const rows = stops.map((s, i) => rawByKey.get(s.key) && { ...rawByKey.get(s.key), stopNo: i + 1 });
        if (rows.every(Boolean)) queryClient.setQueryData(manageRouteKeys.routeDetails(routeId), rows);
    });
};

/**
 * Edit-mode state for RouteMap.
 *
 * Flow for every change: request(command) -> validate -> confirm dialog
 * (pending) -> confirm() -> server call -> invalidate cache -> mark routes
 * stale until recalculated -> notify other tabs.
 *
 * @param {{ routesById, shift: { sDate, facilityId, tripType, shiftTime }, userId, onCommitted?: (command) => void }} params
 */
const useRouteEditSession = ({ routesById, shift, userId, onCommitted }) => {
    const queryClient = useQueryClient();

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedStopKeys, setSelectedStopKeys] = useState(() => new Set());
    const [mergeRouteIds, setMergeRouteIds] = useState([]);
    const [pending, setPending] = useState(null); // { command, warnings, message }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [staleRouteIds, setStaleRouteIds] = useState(() => new Set());

    const allStops = useMemo(
        () => Object.values(routesById).flatMap((r) => r.stops),
        [routesById]
    );

    // Drop keys that no longer exist (route refetched, employee moved elsewhere).
    const selectedStops = useMemo(
        () => allStops.filter((s) => selectedStopKeys.has(s.key)),
        [allStops, selectedStopKeys]
    );

    const clearSelection = useCallback(() => {
        setSelectedStopKeys(new Set());
        setMergeRouteIds([]);
    }, []);

    const toggleEditMode = useCallback((next) => {
        setIsEditMode(next);
        if (!next) clearSelection();
    }, [clearSelection]);

    const isStopEditable = useCallback(
        (stop) => !routesById[stop.routeId]?.isLocked,
        [routesById]
    );

    /** additive=false replaces the selection with these stops. */
    const selectStops = useCallback((stops, { additive = false, toggle = false } = {}) => {
        const editable = stops.filter(isStopEditable);
        setSelectedStopKeys((prev) => {
            const next = additive || toggle ? new Set(prev) : new Set();
            editable.forEach((s) => {
                if (toggle && prev.has(s.key)) next.delete(s.key);
                else next.add(s.key);
            });
            return next;
        });
    }, [isStopEditable]);

    const toggleMergeRoute = useCallback((routeId) => {
        if (routesById[routeId]?.isLocked) return;
        setMergeRouteIds((prev) =>
            prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId]
        );
    }, [routesById]);

    const request = useCallback((command) => {
        const { errors, warnings } = validateCommand(command, { routesById, tripType: shift.tripType });
        if (errors.length) {
            toastService.error(errors[0]);
            return false;
        }
        setPending({ command, warnings, message: describeCommand(command) });
        return true;
    }, [routesById, shift.tripType]);

    const cancel = useCallback(() => setPending(null), []);

    const confirm = useCallback(async () => {
        if (!pending) return;
        const { command, message } = pending;
        setIsSubmitting(true);
        try {
            const targetStops = routesById[command.targetRouteId]?.stops;
            await executeCommand(command, { ...shift, userId, targetStops });
            toastService.success(`${message}: done. Recalculate to refresh route lines and ETAs.`);

            const affected = command.affectedRouteIds;
            setStaleRouteIds((prev) => {
                const next = new Set(prev);
                affected.forEach((id) => next.add(id));
                if (command.type === COMMAND.MERGE) command.routeIds.slice(1).forEach((id) => next.delete(id));
                return next;
            });
            clearSelection();

            if (command.type === COMMAND.MOVE || command.type === COMMAND.REORDER) {
                patchRouteDetailsCache(queryClient, command, routesById);
            }
            affected.forEach((id) =>
                queryClient.invalidateQueries({ queryKey: manageRouteKeys.routeDetails(id) })
            );
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.routesAll });
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.statisticsAll });
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.pendingRecalcAll });

            notifyRouteEdit({ source: 'routeMap', action: command.type, routeIds: affected });
            onCommitted?.(command);
        } catch (error) {
            console.error('Route edit failed:', error);
            toastService.error(error.message || 'The change could not be saved.');
        } finally {
            setIsSubmitting(false);
            setPending(null);
        }
    }, [pending, shift, userId, routesById, queryClient, clearSelection, onCommitted]);

    const recalculate = useCallback(async (routeIds) => {
        if (!routeIds.length) return;
        setIsRecalculating(true);
        try {
            const updated = await recalculateRoutesByIds({
                routeIds: routeIds.join(','),
                shiftDate: shift.sDate,
                shiftTime: shift.shiftTime,
                facilityId: shift.facilityId,
                tripType: shift.tripType,
                userId,
            });
            toastService[updated ? 'success' : 'info'](
                updated ? 'Routes recalculated.' : 'No routes needed recalculation.'
            );
            setStaleRouteIds(new Set());
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.all });
        } catch (error) {
            console.error('Recalculation failed:', error);
            toastService.error(`Failed to recalculate routes: ${error.message}`);
        } finally {
            setIsRecalculating(false);
        }
    }, [shift, userId, queryClient]);

    return {
        isEditMode,
        toggleEditMode,
        selectedStops,
        selectedStopKeys,
        selectStops,
        clearSelection,
        isStopEditable,
        mergeRouteIds,
        toggleMergeRoute,
        pending,
        request,
        confirm,
        cancel,
        isSubmitting,
        staleRouteIds,
        recalculate,
        isRecalculating,
    };
};

export default useRouteEditSession;
