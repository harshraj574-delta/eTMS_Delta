import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useRouteEditSession from '../hooks/useRouteEditSession';
import { moveEmployees, stopKey } from '../model/commands';
import ManageRouteService from '../../../../services/compliance/ManageRouteService';
import { toastService } from '../../../../services/toastService';
import { notifyRouteEdit } from '../sync';

vi.mock('../../../../services/toastService', () => ({
    toastService: { info: vi.fn(), warn: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../../services/compliance/ManageRouteService', () => ({
    default: { UpdateCutPaste: vi.fn() },
}));
vi.mock('../sync', () => ({ notifyRouteEdit: vi.fn(), useRouteEditListener: vi.fn() }));

const stop = (routeId, empId, stopNo) => ({
    key: stopKey(routeId, empId), routeId, empId, empCode: empId, empName: empId, stopNo, gender: 'M',
});

const routesById = {
    R1: { routeId: 'R1', isLocked: false, stops: [stop('R1', 'a', 1), stop('R1', 'b', 2)] },
    R2: { routeId: 'R2', isLocked: false, stops: [stop('R2', 'x', 1)] },
    R3: { routeId: 'R3', isLocked: true, stops: [stop('R3', 'z', 1)] },
};
const shift = { sDate: '2026-11-03', facilityId: '1', tripType: 'P', shiftTime: '2330' };

const setup = (onCommitted) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const hook = renderHook(() => useRouteEditSession({ routesById, shift, userId: 7, onCommitted }), { wrapper });
    return { ...hook, invalidate, queryClient };
};

describe('useRouteEditSession', () => {
    beforeEach(() => vi.clearAllMocks());

    it('never selects stops on finalized routes', () => {
        const { result } = setup();
        act(() => result.current.selectStops([...routesById.R1.stops, ...routesById.R3.stops]));
        expect(result.current.selectedStops.map((s) => s.empId)).toEqual(['a', 'b']);

        act(() => result.current.selectStops([routesById.R1.stops[0]], { toggle: true }));
        expect(result.current.selectedStops.map((s) => s.empId)).toEqual(['b']);
    });

    it('shows the first validation error instead of opening the confirm dialog', () => {
        const { result } = setup();
        act(() => {
            result.current.request(moveEmployees({ stops: [routesById.R1.stops[0]], targetRouteId: 'R3', position: 1 }));
        });
        expect(result.current.pending).toBeNull();
        expect(toastService.error).toHaveBeenCalledWith(expect.stringMatching(/R3 is finalized/));
    });

    it('confirm sends UpdateCutPaste, marks routes stale, invalidates and notifies', async () => {
        ManageRouteService.UpdateCutPaste.mockResolvedValue([{}]);
        const onCommitted = vi.fn();
        const { result, invalidate } = setup(onCommitted);

        act(() => {
            result.current.request(moveEmployees({ stops: [routesById.R1.stops[0]], targetRouteId: 'R2', position: 2 }));
        });
        expect(result.current.pending.message).toBe('Move a to route R2 at stop 2');

        await act(() => result.current.confirm());

        expect(ManageRouteService.UpdateCutPaste).toHaveBeenCalledWith({
            OldRouteid: 'R1', oldemployeeid: 'a', newrouteid: 'R2', stopno: 2, userid: 7,
        });
        expect([...result.current.staleRouteIds]).toEqual(['R1', 'R2']);
        expect(result.current.pending).toBeNull();
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['manageRoute', 'routeDetails', 'R1'] });
        expect(notifyRouteEdit).toHaveBeenCalledWith(expect.objectContaining({ source: 'routeMap', action: 'move' }));
        expect(onCommitted).toHaveBeenCalled();
    });

    it('sends the server slot number and patches the cached order after a reorder', async () => {
        ManageRouteService.UpdateCutPaste.mockResolvedValue([{}]);
        const { result, queryClient } = setup();
        // Raw GetRoutesDetailsnew rows, as RouteMap caches them.
        queryClient.setQueryData(['manageRoute', 'routeDetails', 'R1'], [
            { id: 'a', empName: 'a', stopNo: 1, GeoX: '77.1' },
            { id: 'b', empName: 'b', stopNo: 2, GeoX: '77.2' },
        ]);

        act(() => {
            result.current.request(moveEmployees({ stops: [routesById.R1.stops[0]], targetRouteId: 'R1', position: 2 }));
        });
        await act(() => result.current.confirm());

        // a: final position 2 of 2 -> "insert after current stop 2" = slot 3
        expect(ManageRouteService.UpdateCutPaste).toHaveBeenCalledWith(expect.objectContaining({ stopno: 3 }));
        expect(queryClient.getQueryData(['manageRoute', 'routeDetails', 'R1'])).toEqual([
            { id: 'b', empName: 'b', stopNo: 1, GeoX: '77.2' },
            { id: 'a', empName: 'a', stopNo: 2, GeoX: '77.1' },
        ]);
    });

    it('keeps routes clean when the server call fails', async () => {
        ManageRouteService.UpdateCutPaste.mockRejectedValue(new Error('boom'));
        const { result } = setup();
        act(() => {
            result.current.request(moveEmployees({ stops: [routesById.R1.stops[0]], targetRouteId: 'R2', position: 1 }));
        });
        await act(() => result.current.confirm());
        expect(toastService.error).toHaveBeenCalledWith('boom');
        expect(result.current.staleRouteIds.size).toBe(0);
        expect(notifyRouteEdit).not.toHaveBeenCalled();
    });
});
