import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useFinalizeWorkflow from '../useFinalizeWorkflow';
import ManageRouteService from '../../../../services/compliance/ManageRouteService';
import { toastService } from '../../../../services/toastService';

vi.mock('../../../../services/toastService', () => ({
    toastService: {
        info: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../../../../services/compliance/ManageRouteService', () => ({
    default: {
        GetInputJsonRecalculate: vi.fn(),
    },
}));

vi.mock('../useManageRouteQueries', () => ({
    useFinalizeRouteMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue([]) }),
    recalculateModifiedRoutes: vi.fn(),
}));

const defaultParams = {
    shiftDate: '2026-07-15',
    selectedFacility: '1',
    userId: '42',
    onSearch: vi.fn(),
    setIsSubmitting: vi.fn(),
};

describe('useFinalizeWorkflow — cutoff validation', () => {
    beforeEach(() => {
        // Fixed clock: 2026-07-15 08:00 local time
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(new Date(2026, 6, 15, 8, 0, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('blocks Pick Up finalization inside the 4-hour window', async () => {
        const { result } = renderHook(() =>
            useFinalizeWorkflow({
                ...defaultParams,
                selectedShifts: '1100', // 3h away < 4h cutoff
                selectedTripType: 'P',
            })
        );

        await act(async () => {
            await result.current.handleFinalizeRoute();
        });

        expect(toastService.warn).toHaveBeenCalledWith(
            expect.stringContaining('Finalization window has closed')
        );
        expect(result.current.showRecalcBeforeFinalizeDialog).toBe(false);
        expect(result.current.showFinalizeConfirmDialog).toBe(false);
        expect(ManageRouteService.GetInputJsonRecalculate).not.toHaveBeenCalled();
    });

    it('opens the recalc-first dialog when modified routes exist', async () => {
        ManageRouteService.GetInputJsonRecalculate.mockResolvedValue({
            routes: [{ id: 1 }],
        });

        const { result } = renderHook(() =>
            useFinalizeWorkflow({
                ...defaultParams,
                selectedShifts: '1400', // 6h away, outside cutoff
                selectedTripType: 'P',
            })
        );

        await act(async () => {
            await result.current.handleFinalizeRoute();
        });

        expect(result.current.showRecalcBeforeFinalizeDialog).toBe(true);
        expect(result.current.showFinalizeConfirmDialog).toBe(false);
    });

    it('goes straight to the confirm dialog when nothing needs recalculation', async () => {
        ManageRouteService.GetInputJsonRecalculate.mockResolvedValue({ routes: [] });

        const { result } = renderHook(() =>
            useFinalizeWorkflow({
                ...defaultParams,
                selectedShifts: '1000', // 2h away — Drop cutoff is only 1h
                selectedTripType: 'D',
            })
        );

        await act(async () => {
            await result.current.handleFinalizeRoute();
        });

        expect(result.current.showRecalcBeforeFinalizeDialog).toBe(false);
        expect(result.current.showFinalizeConfirmDialog).toBe(true);
    });

    it('fails open (assumes recalc needed) when the check errors', async () => {
        ManageRouteService.GetInputJsonRecalculate.mockRejectedValue(new Error('network'));

        const { result } = renderHook(() =>
            useFinalizeWorkflow({
                ...defaultParams,
                selectedShifts: '1400',
                selectedTripType: 'P',
            })
        );

        await act(async () => {
            await result.current.handleFinalizeRoute();
        });

        expect(result.current.showRecalcBeforeFinalizeDialog).toBe(true);
    });
});
