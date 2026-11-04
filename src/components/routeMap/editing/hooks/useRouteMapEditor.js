import { useCallback, useEffect, useMemo, useState } from 'react';
import useRouteEditSession from './useRouteEditSession';
import {
    COMMAND,
    applyToSequences,
    moveEmployees,
    splitRoute,
    mergeRoutes,
    addEmployee,
    removeEmployee,
} from '../model/commands';

const CONFIRM_VARIANT = { [COMMAND.REMOVE]: 'remove', [COMMAND.MERGE]: 'merge' };

/**
 * RouteMap's editing controller: wraps the edit session with what the page's
 * widgets need (inspector, action bar, map drag/box-select, confirm dialog),
 * so RouteMap.jsx only composes components.
 *
 * @param {{ data: ReturnType<import('../../hooks/useRouteMapData').default>, userId: number }} params
 */
const useRouteMapEditor = ({ data, userId }) => {
    const { routesById, routesForMap, shift, visibility } = data;
    const [inspectorRouteId, setInspectorRouteId] = useState(null);

    const onCommitted = useCallback(
        (command) => {
            if (command.type === COMMAND.SPLIT) visibility.show(command.newRouteId);
            if (command.type === COMMAND.MERGE) {
                setInspectorRouteId((id) => (command.routeIds.slice(1).includes(id) ? command.targetRouteId : id));
            }
        },
        [visibility]
    );

    const edit = useRouteEditSession({ routesById, shift, userId, onCommitted });
    const { isEditMode, pending, clearSelection, selectStops, selectedStopKeys, selectedStops, request } = edit;

    useEffect(() => {
        if (!isEditMode) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !pending) clearSelection();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isEditMode, pending, clearSelection]);

    // --- map
    const onBoxSelect = useCallback(
        (bounds, { additive }) => {
            const stops = routesForMap.flatMap((r) =>
                r.stops.filter((s) => !isNaN(s.lat) && bounds.contains([s.lat, s.lng]))
            );
            selectStops(stops, { additive });
        },
        [routesForMap, selectStops]
    );

    const onMapMove = useCallback(
        (stops, targetRouteId, position) => {
            // Dragging one stop of a multi-selection moves the whole selection.
            const draggedSelected = stops.some((s) => selectedStopKeys.has(s.key));
            const moving = draggedSelected && selectedStops.length > stops.length ? selectedStops : stops;
            request(moveEmployees({ stops: moving, targetRouteId, position }));
        },
        [selectedStopKeys, selectedStops, request]
    );

    // --- sidebar
    const onToggleMerge = useCallback(
        (routeId) => {
            visibility.show(routeId); // merging needs the route loaded (lock state, stops)
            edit.toggleMergeRoute(routeId);
        },
        [visibility, edit]
    );

    const onEditStops = useCallback(
        (routeId) => {
            visibility.show(routeId);
            setInspectorRouteId(routeId);
        },
        [visibility]
    );

    // --- inspector
    const inspectorRoute = isEditMode && inspectorRouteId ? routesById[inspectorRouteId] ?? null : null;
    const pendingCommand = pending?.command;

    // While a reorder of the open route awaits confirmation, show the order it would produce.
    const inspectorPreview = useMemo(() => {
        if (!inspectorRoute || pendingCommand?.type !== COMMAND.REORDER) return undefined;
        if (pendingCommand.targetRouteId !== inspectorRoute.routeId) return undefined;
        return {
            stops: applyToSequences(pendingCommand, { [inspectorRoute.routeId]: inspectorRoute.stops })[inspectorRoute.routeId],
            movedKeys: new Set(pendingCommand.stops.map((s) => s.key)),
        };
    }, [inspectorRoute, pendingCommand]);

    const inspector = inspectorRoute && {
        route: inspectorRoute,
        preview: inspectorPreview,
        close: () => setInspectorRouteId(null),
        onSelectStop: (stop, e) => selectStops([stop], { toggle: e.ctrlKey || e.metaKey }),
        onReorder: (stop, position) =>
            request(moveEmployees({ stops: [stop], targetRouteId: inspectorRoute.routeId, position })),
        onRemove: (stop) => request(removeEmployee({ stop })),
        onAdd: (employee, position) => request(addEmployee({ employee, routeId: inspectorRoute.routeId, position })),
    };

    // --- floating action bar
    const editableRoutes = useMemo(
        () =>
            Object.values(routesById)
                .filter((r) => !r.isLocked)
                .map((r) => ({ routeId: r.routeId, stopCount: r.stops.length })),
        [routesById]
    );

    const actions = {
        editableRoutes,
        move: (targetRouteId, position) => request(moveEmployees({ stops: selectedStops, targetRouteId, position })),
        split: () => request(splitRoute({ routeId: selectedStops[0].routeId, stops: selectedStops })),
        remove: () => request(removeEmployee({ stop: selectedStops[0] })),
        merge: () => request(mergeRoutes({ routeIds: edit.mergeRouteIds })),
    };

    return {
        edit,
        inspector,
        actions,
        map: { onBoxSelect, onMapMove },
        sidebar: { onToggleMerge, onEditStops },
        confirmVariant: CONFIRM_VARIANT[pendingCommand?.type] ?? 'warning',
    };
};

export default useRouteMapEditor;
