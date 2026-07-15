import { useState, useEffect, useCallback } from 'react';
import { toastService } from '../../services/toastService';

/**
 * Route-merge selection state for Manage Route.
 *
 * Owns: merge mode toggle, the ordered route selection (first selected is
 * the merge TARGET, the rest are SOURCES), the floating panel visibility,
 * and the merge confirm dialog plumbing.
 *
 * The merge server call stays in the view (it needs the mutation and the
 * post-merge refresh), driven by `pendingMergeOperation`.
 */
const useRouteMergeSelection = () => {
    const [selectedRoutes, setSelectedRoutes] = useState([]); // Use an array for the selection state
    const [isRouteSelectMode, setIsRouteSelectMode] = useState(false);
    const [showFloatingRoutePanel, setShowFloatingRoutePanel] = useState(false);
    const [showRouteMergeDialog, setShowRouteMergeDialog] = useState(false);
    const [pendingMergeOperation, setPendingMergeOperation] = useState(null);
    const [routeSelectionOrder, setRouteSelectionOrder] = useState([]);

    // The floating panel is only visible in merge mode with a selection
    useEffect(() => {
        if (isRouteSelectMode) {
            setShowFloatingRoutePanel(selectedRoutes.length > 0);
        } else {
            setShowFloatingRoutePanel(false);
        }
    }, [selectedRoutes.length, isRouteSelectMode]);

    const handleClearRouteSelection = useCallback(() => {
        setSelectedRoutes([]); // Clear the array
        setRouteSelectionOrder([]);
    }, []);

    // DataTable onSelectionChange: finalized routes are never selectable
    const handleRouteSelectionChange = useCallback((routes) => {
        const selectableRoutes = routes.filter((route) => route.isRouteFinalized !== 1);
        setSelectedRoutes(selectableRoutes);
        setRouteSelectionOrder(selectableRoutes.map((r) => r.RouteID));
    }, []);

    // Toolbar toggle; leaving merge mode clears the selection
    const toggleRouteSelectMode = useCallback(() => {
        setIsRouteSelectMode((prev) => {
            if (prev) {
                setSelectedRoutes([]);
                setRouteSelectionOrder([]);
            }
            return !prev;
        });
    }, []);

    // Validates the selection and opens the confirm dialog.
    // First selected route = target, remaining = sources.
    const handleMergeRoutes = useCallback(() => {
        if (selectedRoutes.length < 2) {
            toastService.warn('Please select at least 2 routes to merge');
            return;
        }

        const routeArray = Array.from(routeSelectionOrder);
        const targetRoute = routeArray[0];
        const sourceRoutes = routeArray.slice(1);

        setPendingMergeOperation({
            sourceRoutes,
            targetRoute,
            routeArray,
        });

        setShowRouteMergeDialog(true);
    }, [routeSelectionOrder, selectedRoutes.length]);

    const cancelMergeOperation = useCallback(() => {
        setShowRouteMergeDialog(false);
        setPendingMergeOperation(null);
    }, []);

    return {
        selectedRoutes,
        setSelectedRoutes,
        isRouteSelectMode,
        setIsRouteSelectMode,
        showFloatingRoutePanel,
        setShowFloatingRoutePanel,
        showRouteMergeDialog,
        setShowRouteMergeDialog,
        pendingMergeOperation,
        setPendingMergeOperation,
        routeSelectionOrder,
        setRouteSelectionOrder,
        handleClearRouteSelection,
        handleRouteSelectionChange,
        toggleRouteSelectMode,
        handleMergeRoutes,
        cancelMergeOperation,
    };
};

export default useRouteMergeSelection;
