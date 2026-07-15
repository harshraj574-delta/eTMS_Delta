import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useRouteMergeSelection from '../useRouteMergeSelection';
import { toastService } from '../../../services/toastService';

vi.mock('../../../services/toastService', () => ({
    toastService: {
        info: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const routes = (...ids) => ids.map((id) => ({ RouteID: id, isRouteFinalized: 0 }));

describe('useRouteMergeSelection', () => {
    it('filters finalized routes out of the selection and tracks order', () => {
        const { result } = renderHook(() => useRouteMergeSelection());

        act(() => {
            result.current.handleRouteSelectionChange([
                { RouteID: 'R1', isRouteFinalized: 0 },
                { RouteID: 'R2', isRouteFinalized: 1 }, // finalized: not selectable
                { RouteID: 'R3', isRouteFinalized: 0 },
            ]);
        });

        expect(result.current.selectedRoutes.map((r) => r.RouteID)).toEqual(['R1', 'R3']);
        expect(result.current.routeSelectionOrder).toEqual(['R1', 'R3']);
    });

    it('shows the floating panel only in merge mode with a selection', () => {
        const { result } = renderHook(() => useRouteMergeSelection());

        act(() => {
            result.current.handleRouteSelectionChange(routes('R1'));
        });
        expect(result.current.showFloatingRoutePanel).toBe(false); // not in merge mode

        act(() => {
            result.current.toggleRouteSelectMode();
        });
        expect(result.current.showFloatingRoutePanel).toBe(true);
    });

    it('warns and does not open the dialog with fewer than 2 routes', () => {
        const { result } = renderHook(() => useRouteMergeSelection());

        act(() => {
            result.current.handleRouteSelectionChange(routes('R1'));
        });
        act(() => {
            result.current.handleMergeRoutes();
        });

        expect(toastService.warn).toHaveBeenCalledWith('Please select at least 2 routes to merge');
        expect(result.current.showRouteMergeDialog).toBe(false);
        expect(result.current.pendingMergeOperation).toBe(null);
    });

    it('first selected route is the merge target, the rest are sources', () => {
        const { result } = renderHook(() => useRouteMergeSelection());

        act(() => {
            result.current.handleRouteSelectionChange(routes('R7', 'R2', 'R5'));
        });
        act(() => {
            result.current.handleMergeRoutes();
        });

        expect(result.current.showRouteMergeDialog).toBe(true);
        expect(result.current.pendingMergeOperation).toEqual({
            targetRoute: 'R7',
            sourceRoutes: ['R2', 'R5'],
            routeArray: ['R7', 'R2', 'R5'],
        });
    });

    it('leaving merge mode clears the selection', () => {
        const { result } = renderHook(() => useRouteMergeSelection());

        act(() => {
            result.current.toggleRouteSelectMode(); // enter
        });
        act(() => {
            result.current.handleRouteSelectionChange(routes('R1', 'R2'));
        });
        act(() => {
            result.current.toggleRouteSelectMode(); // leave
        });

        expect(result.current.isRouteSelectMode).toBe(false);
        expect(result.current.selectedRoutes).toEqual([]);
        expect(result.current.routeSelectionOrder).toEqual([]);
        expect(result.current.showFloatingRoutePanel).toBe(false);
    });
});
