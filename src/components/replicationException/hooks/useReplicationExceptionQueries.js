import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReplicationExceptionService from '../../../services/compliance/ReplicationExceptionService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const replicationExceptionKeys = {
    all: ['replicationException'],
    facilities: (userId) => ['replicationException', 'facilities', userId],
    shifts: (facilityId, tripType) => ['replicationException', 'shifts', facilityId, tripType],
    isFinalized: (params) => ['replicationException', 'isFinalized', params],
    deleteException: (params) => ['replicationException', 'deleteException', params],
    addException: (params) => ['replicationException', 'addException', params],
    alignRoutes: (params) => ['replicationException', 'alignRoutes', params],
    routeEmployees: (routeId) => ['replicationException', 'routeEmployees', routeId],
};

export const useFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: replicationExceptionKeys.facilities(userId),
        queryFn: async () => {
            const facilities = toArray(
                await ReplicationExceptionService.SelectFacility({ Userid: userId })
            );
            return facilities.map((item) => ({
                label: item.facility || item.facilityName,
                value: item.Id,
            }));
        },
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Error fetching facilities' },
    });
};

// Cascades off facility + trip type
export const useShiftsQuery = (facilityId, tripType) => {
    return useQuery({
        queryKey: replicationExceptionKeys.shifts(facilityId, tripType),
        queryFn: async () => {
            const shifts = toArray(
                await ReplicationExceptionService.GetShiftByFacilityType({
                    facid: facilityId,
                    type: tripType,
                })
            );
            return shifts.map((item) => ({ label: item.shiftTime, value: item.shiftTime }));
        },
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Error fetching shifts' },
    });
};

// ── Imperative reads ─────────────────────────────────────────────────────────
// The exception tables are click-driven (Submit button), carry row-selection
// state, and every action refreshes them via handleSubmit — so these stay
// imperative and never auto-refetch. The component owns all toasts.

export const fetchIsRouteFinalized = (queryClient, params) =>
    queryClient.fetchQuery({
        queryKey: replicationExceptionKeys.isFinalized(params),
        queryFn: async () =>
            toArray(await ReplicationExceptionService.GetIsRouteFinalized(params)),
        staleTime: 0,
        meta: { silent: true },
    });

export const fetchDeleteException = (queryClient, params) =>
    queryClient.fetchQuery({
        queryKey: replicationExceptionKeys.deleteException(params),
        queryFn: async () =>
            toArray(await ReplicationExceptionService.GetDeleteException(params)),
        staleTime: 0,
        meta: { silent: true },
    });

export const fetchAddException = (queryClient, params) =>
    queryClient.fetchQuery({
        queryKey: replicationExceptionKeys.addException(params),
        queryFn: async () => toArray(await ReplicationExceptionService.GetAddException(params)),
        staleTime: 0,
        meta: { silent: true },
    });

export const fetchAlignRoutes = (queryClient, params) =>
    queryClient.fetchQuery({
        queryKey: replicationExceptionKeys.alignRoutes(params),
        queryFn: async () => toArray(await ReplicationExceptionService.GetRoutesByOrder(params)),
        staleTime: 0,
        meta: { silent: true },
    });

// Seeds the editable per-route stop/ETA rows — never cached
export const fetchRouteEmployees = (queryClient, routeId) =>
    queryClient.fetchQuery({
        queryKey: replicationExceptionKeys.routeEmployees(routeId),
        queryFn: async () =>
            toArray(
                await ReplicationExceptionService.GetRoutesDetailsnew({ Routeid: routeId, isAdd: 0 })
            ),
        staleTime: 0,
        gcTime: 0,
        meta: { silent: true },
    });

// ── Mutations ────────────────────────────────────────────────────────────────
// The tables live in component state and every handler re-runs handleSubmit
// after a write, so no invalidation is needed — mutations here give the writes
// the standard no-retry treatment and a single home.

export const useDeleteExceptionEmpMutation = () => {
    return useMutation({
        mutationFn: (params) => ReplicationExceptionService.SprDeleteExceptionEmp(params),
    });
};

export const useMakeNewRouteMutation = () => {
    return useMutation({
        mutationFn: (params) =>
            ReplicationExceptionService.MakeRouteReplicateException(params),
    });
};

export const useAddEmpToRouteMutation = () => {
    return useMutation({
        mutationFn: (params) => ReplicationExceptionService.AddEmpToRoute(params),
    });
};

export const useUpdateRouteMutation = () => {
    return useMutation({
        mutationFn: (params) => ReplicationExceptionService.UpdateRoute(params),
    });
};

export const useCutPasteMutation = () => {
    return useMutation({
        mutationFn: (params) => ReplicationExceptionService.UpdateCutPaste(params),
    });
};
