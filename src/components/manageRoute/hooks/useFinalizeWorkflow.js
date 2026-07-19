import { useState, useCallback } from 'react';
import { toastService } from '../../../services/toastService';
import ManageRouteService from '../../../services/compliance/ManageRouteService';
import {
    useFinalizeRouteMutation,
    recalculateModifiedRoutes,
} from './useManageRouteQueries';

/**
 * Returns a user-facing warning when finalization is inside the cutoff
 * window (Pick Up = 4h before shift, Drop = 1h), or null when allowed.
 * Shared by the desktop workflow hook and ManageRouteMobile.
 */
export function getFinalizeCutoffWarning({ shiftDate, shifts, tripType }) {
    if (!shifts) return null;
    const raw = String(shifts).replace(':', '');
    if (raw.length !== 4) return null;

    const shiftHH = parseInt(raw.slice(0, 2), 10);
    const shiftMM = parseInt(raw.slice(2, 4), 10);
    const now = new Date();
    const shiftTime = shiftDate ? new Date(shiftDate) : new Date();
    shiftTime.setHours(shiftHH, shiftMM, 0, 0);
    const cutoffMs = tripType === 'P' ? 4 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000;
    const cutoffTime = new Date(shiftTime.getTime() - cutoffMs);

    if (now >= cutoffTime) {
        const tripLabel = tripType === 'P' ? 'Pick Up' : 'Drop';
        const cutoffLabel = tripType === 'P' ? '4 hours' : '1 hour';
        const shiftLabel = `${String(shiftHH).padStart(2, '0')}:${String(shiftMM).padStart(2, '0')}`;
        return `${tripLabel} routes must be finalized at least ${cutoffLabel} before shift time (${shiftLabel}). Finalization window has closed.`;
    }
    return null;
}

/**
 * Finalization workflow for Manage Route.
 *
 * Owns: the cutoff-window validation, the "recalculate first?" check and
 * dialog, the finalize confirm dialog, and the finalize/recalc-then-finalize
 * server pipelines.
 *
 * @param {object} params
 * @param {string} params.shiftDate
 * @param {string|string[]} params.selectedShifts
 * @param {string|number} params.selectedFacility
 * @param {string} params.selectedTripType - 'P' | 'D'
 * @param {string} params.userId
 * @param {Function} params.onSearch - refreshes the routes table
 * @param {Function} params.setIsSubmitting - shared page-level busy flag
 */
const useFinalizeWorkflow = ({
    shiftDate,
    selectedShifts,
    selectedFacility,
    selectedTripType,
    userId,
    onSearch,
    setIsSubmitting,
}) => {
    const finalizeRouteMutation = useFinalizeRouteMutation();

    const [isFinalizing, setIsFinalizing] = useState(false);
    const [showRecalcBeforeFinalizeDialog, setShowRecalcBeforeFinalizeDialog] = useState(false);
    const [showFinalizeConfirmDialog, setShowFinalizeConfirmDialog] = useState(false);
    const [isRecalcBeforeFinalize, setIsRecalcBeforeFinalize] = useState(false);

    const checkIfRecalculationNeeded = useCallback(async () => {
        try {
            const inputJsonData = await ManageRouteService.GetInputJsonRecalculate({
                shiftdate: shiftDate,
                shifttime: selectedShifts,
                facilityid: selectedFacility,
                triptype: selectedTripType,
            });

            return !!(
                inputJsonData &&
                inputJsonData.routes &&
                inputJsonData.routes.length > 0
            );
        } catch (error) {
            console.error('Error checking recalculation status:', error);
            return true;
        }
    }, [shiftDate, selectedShifts, selectedFacility, selectedTripType]);

    // Entry point from the Finalize button: validates the cutoff window,
    // then routes to either the recalc-first dialog or the confirm dialog.
    const handleFinalizeRoute = useCallback(async () => {
        const cutoffWarning = getFinalizeCutoffWarning({
            shiftDate,
            shifts: selectedShifts,
            tripType: selectedTripType,
        });
        if (cutoffWarning) {
            toastService.warn(cutoffWarning);
            return;
        }

        const needsRecalculation = await checkIfRecalculationNeeded();

        if (needsRecalculation) {
            setShowRecalcBeforeFinalizeDialog(true);
            return;
        }

        setShowFinalizeConfirmDialog(true);
    }, [checkIfRecalculationNeeded, selectedShifts, selectedTripType, shiftDate]);

    const proceedWithFinalization = useCallback(async () => {
        setIsSubmitting(true);
        setIsFinalizing(true);
        try {
            const params = {
                sDate: shiftDate,
                eDate: shiftDate,
                facilityid: selectedFacility,
                triptype: selectedTripType,
                shifttimes: selectedShifts,
            };

            const bulkRouteData = await finalizeRouteMutation.mutateAsync(params);

            if (bulkRouteData && bulkRouteData.length > 0) {
                toastService.success(
                    'Route finalization  completed successfully.'
                );
                await onSearch();
            } else {
                toastService.warn('No route data available to finalize.');
            }
        } catch (error) {
            console.error('Error finalizing routes:', error);
            toastService.error(
                'Finalization  data  failed. Please try again.'
            );
        } finally {
            setIsFinalizing(false);
            setIsSubmitting(false);
        }
    }, [shiftDate, selectedFacility, selectedTripType, selectedShifts, finalizeRouteMutation, onSearch, setIsSubmitting]);

    const handleRecalculateAndFinalize = useCallback(async () => {
        setIsRecalcBeforeFinalize(true);
        setShowRecalcBeforeFinalizeDialog(false);

        try {
            toastService.info('Recalculating routes before finalization...');

            const updated = await recalculateModifiedRoutes(
                {
                    shiftDate,
                    shifts: selectedShifts,
                    facilityId: selectedFacility,
                    tripType: selectedTripType,
                    userId,
                },
                { onBeforeRecalc: () => toastService.info('Sending data for recalculation...') }
            );

            if (!updated) {
                toastService.info(
                    'No routes need recalculation. Proceeding with finalization...'
                );
                await proceedWithFinalization();
                return;
            }

            toastService.success(
                'Routes recalculated successfully! Now finalizing...'
            );

            await onSearch();
            await proceedWithFinalization();
        } catch (error) {
            console.error('Error during recalculation before finalize:', error);
            toastService.error(`Failed to recalculate routes: ${error.message}`);
        } finally {
            setIsRecalcBeforeFinalize(false);
        }
    }, [shiftDate, selectedShifts, selectedFacility, selectedTripType, userId, onSearch, proceedWithFinalization]);

    return {
        isFinalizing,
        isRecalcBeforeFinalize,
        showRecalcBeforeFinalizeDialog,
        setShowRecalcBeforeFinalizeDialog,
        showFinalizeConfirmDialog,
        setShowFinalizeConfirmDialog,
        handleFinalizeRoute,
        proceedWithFinalization,
        handleRecalculateAndFinalize,
    };
};

export default useFinalizeWorkflow;
