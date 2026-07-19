import { useState, useCallback } from 'react';
import { toastService } from '../../../services/toastService';

/**
 * Client-side employee selection state for Manage Route.
 *
 * Owns the multi-select employee set, the active action mode
 * ('multiSelect' | 'split'), the floating selection panel visibility,
 * and the cross-page "hold" drop workflow.
 *
 * Server operations on the selection (move/split/delete) stay in the view;
 * this hook is pure client state so it can be tested in isolation.
 */
const useEmployeeSelection = () => {
    const [selectedEmployees, setSelectedEmployees] = useState(new Set());
    const [selectedAction, setSelectedAction] = useState('multiSelect'); // Default to multiSelect
    const [selectionStartRoute, setSelectionStartRoute] = useState(null);
    const [isSelectionHeld, setIsSelectionHeld] = useState(false);
    const [showFloatingPanel, setShowFloatingPanel] = useState(false);
    const [crossPageDropMode, setCrossPageDropMode] = useState(false);

    // Toggle a single employee; keeps the panel open while a selection exists.
    const handleEmployeeSelection = useCallback(
        (employeeKey, routeId) => {
            setSelectedEmployees((prev) => {
                const newSelection = new Set(prev);

                if (newSelection.has(employeeKey)) {
                    newSelection.delete(employeeKey);
                    // When selection becomes empty, reset related states but keep panel open
                    if (newSelection.size === 0) {
                        setSelectionStartRoute(null);
                        setIsSelectionHeld(false);
                        setCrossPageDropMode(false);
                        setSelectedAction('multiSelect'); // Revert to default action
                    }
                } else {
                    newSelection.add(employeeKey);
                    if (!selectionStartRoute) {
                        setSelectionStartRoute(routeId);
                    }
                    // Always ensure the panel is visible when there's a selection
                    setShowFloatingPanel(true);
                }

                return newSelection;
            });
        },
        [selectionStartRoute]
    );

    const handleActionChange = useCallback((action) => {
        setSelectedAction(action);
        if (action === 'multiSelect') {
            setIsSelectionHeld(false);
            setCrossPageDropMode(false);
        }
    }, []);

    // Hold the current selection so it can be dropped onto routes on other pages.
    const handleToggleHold = useCallback(() => {
        setSelectedAction('multiSelect');

        setIsSelectionHeld((prev) => {
            const newHeld = !prev;
            setCrossPageDropMode(newHeld);
            if (newHeld) {
                toastService.info(
                    'Selection held - click on any route to drop employees'
                );
            } else {
                toastService.info('Selection released');
            }
            return newHeld;
        });
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedEmployees(new Set());
        setSelectionStartRoute(null);
        setShowFloatingPanel(false);
        setIsSelectionHeld(false);
        setCrossPageDropMode(false);
        setSelectedAction('multiSelect');
    }, []);

    // Drop selection keys whose employees no longer exist in the cache.
    const handleCleanupStaleSelections = useCallback((staleKeys) => {
        setSelectedEmployees((prev) => {
            const newSelection = new Set(prev);
            staleKeys.forEach((key) => newSelection.delete(key));

            // If all selections were stale, hide the panel
            if (newSelection.size === 0) {
                setShowFloatingPanel(false);
                setIsSelectionHeld(false);
                setCrossPageDropMode(false);
            }

            return newSelection;
        });
    }, []);

    return {
        selectedEmployees,
        setSelectedEmployees,
        selectedAction,
        setSelectedAction,
        selectionStartRoute,
        setSelectionStartRoute,
        isSelectionHeld,
        setIsSelectionHeld,
        showFloatingPanel,
        setShowFloatingPanel,
        crossPageDropMode,
        setCrossPageDropMode,
        handleEmployeeSelection,
        handleActionChange,
        handleToggleHold,
        handleClearSelection,
        handleCleanupStaleSelections,
    };
};

export default useEmployeeSelection;
