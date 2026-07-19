import { useState, useEffect, useCallback } from 'react';
import { toastService } from '../../../services/toastService';

/**
 * Lock/unlock state machine for finalized routes on Manage Route.
 *
 * Owns: whether the shift has finalized routes (isShiftLocked), whether the
 * user is picking routes to unlock (isUnlockMode), the picked set, and the
 * confirm-dialog plumbing. The actual unlock server call stays in the view
 * (it needs the mutation + post-refresh), driven by `pendingUnlock`.
 *
 * @param {Array} tableData - current routes; drives isShiftLocked and
 *   auto-exits unlock mode when no finalized routes remain.
 */
const useUnlockRoutes = (tableData) => {
    const [isShiftLocked, setIsShiftLocked] = useState(false);
    const [isUnlockMode, setIsUnlockMode] = useState(false);
    const [routesToUnlock, setRoutesToUnlock] = useState(new Set());
    const [showUnlockConfirmDialog, setShowUnlockConfirmDialog] = useState(false);
    const [pendingUnlock, setPendingUnlock] = useState(null);

    // Update locked state based on route finalization status
    useEffect(() => {
        if (tableData?.length > 0) {
            const hasFinalizedRoutes = tableData.some((route) => route.isRouteFinalized === 1);
            setIsShiftLocked(hasFinalizedRoutes);

            // Exit unlock mode if no finalized routes exist to prevent
            // the UI from being in an invalid state
            if (!hasFinalizedRoutes && isUnlockMode) {
                setIsUnlockMode(false);
                setRoutesToUnlock(new Set());
            }
        } else {
            setIsShiftLocked(false);
            if (isUnlockMode) {
                setIsUnlockMode(false);
                setRoutesToUnlock(new Set());
            }
        }
    }, [tableData, isUnlockMode]);

    const handleSelectRouteToUnlock = useCallback((routeId) => {
        setRoutesToUnlock((prev) => {
            const newSelection = new Set(prev);
            if (newSelection.has(routeId)) {
                newSelection.delete(routeId);
            } else {
                newSelection.add(routeId);
            }
            return newSelection;
        });
    }, []);

    // Queue every finalized route in the shift for unlocking.
    const handleUnlockShift = useCallback(() => {
        const finalizedRoutes = (tableData || [])
            .filter((route) => route.isRouteFinalized === 1)
            .map((route) => route.RouteID);

        if (finalizedRoutes.length === 0) {
            toastService.info('No finalized routes to unlock in this shift.');
            return;
        }

        setPendingUnlock({
            routeIds: finalizedRoutes,
            type: 'shift',
        });
        setShowUnlockConfirmDialog(true);
    }, [tableData]);

    // Queue only the routes the user picked in unlock mode.
    const handleUnlockSelectedRoutes = useCallback(() => {
        if (routesToUnlock.size === 0) {
            toastService.warn('Please select routes to unlock.');
            return;
        }
        setPendingUnlock({
            routeIds: Array.from(routesToUnlock),
            type: 'routes',
        });
        setShowUnlockConfirmDialog(true);
    }, [routesToUnlock]);

    return {
        isShiftLocked,
        setIsShiftLocked,
        isUnlockMode,
        setIsUnlockMode,
        routesToUnlock,
        setRoutesToUnlock,
        showUnlockConfirmDialog,
        setShowUnlockConfirmDialog,
        pendingUnlock,
        setPendingUnlock,
        handleSelectRouteToUnlock,
        handleUnlockShift,
        handleUnlockSelectedRoutes,
    };
};

export default useUnlockRoutes;
