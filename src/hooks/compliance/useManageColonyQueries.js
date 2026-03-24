import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ManageColonyService from '../../services/compliance/ManageColonyService';

// Query Key Factory
export const manageColonyKeys = {
    all: ['manageColony'],
    facilities: (userId) => ['manageColony', 'facilities', userId],
    routeSeq: (facilityId) => ['manageColony', 'routeSeq', facilityId],
    routeSeqDetail: (routeId, locationId, facilityId) => ['manageColony', 'routeSeqDetail', routeId, locationId, facilityId],
    cities: (locationId, facilityId) => ['manageColony', 'cities', locationId, facilityId],
    zones: (locationId, facilityId) => ['manageColony', 'zones', locationId, facilityId],
};

// --- Helper: parse response that may be JSON string or object ---
const parseResponse = (response) => {
    if (typeof response === 'string') {
        try {
            const parsed = JSON.parse(response);
            return Array.isArray(parsed) ? parsed : (parsed?.data || []);
        } catch {
            return [];
        }
    }
    if (Array.isArray(response)) return response;
    if (response?.data && Array.isArray(response.data)) return response.data;
    return [];
};

// --- Queries ---

export const useFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: manageColonyKeys.facilities(userId),
        queryFn: async () => {
            const response = await ManageColonyService.SelectFacility({ Userid: userId });
            const parsed = parseResponse(response);
            return (parsed || []).map(item => ({
                facilityName: item.facility || item.facilityName || "",
                Id: item.Id || item.id || item.Value || "",
            }));
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useRouteSeqQuery = (facilityId, enabled = false) => {
    return useQuery({
        queryKey: manageColonyKeys.routeSeq(facilityId),
        queryFn: async () => {
            const response = await ManageColonyService.GetRouteSeq({
                locationid: facilityId,
                facilityid: facilityId,
            });
            return parseResponse(response);
        },
        enabled: enabled && !!facilityId,
        staleTime: 0, // always fresh
    });
};

export const useRouteSeqDetailQuery = (routeId, locationId, facilityId) => {
    return useQuery({
        queryKey: manageColonyKeys.routeSeqDetail(routeId, locationId, facilityId),
        queryFn: async () => {
            const response = await ManageColonyService.GetRouteSeqDetail({
                routeID: routeId,
                locationID: locationId,
                facilityid: facilityId,
            });
            return parseResponse(response);
        },
        enabled: !!routeId && !!facilityId,
        staleTime: 1000 * 60, // 1 minute
    });
};

export const useCitiesQuery = (locationId, facilityId) => {
    return useQuery({
        queryKey: manageColonyKeys.cities(locationId, facilityId),
        queryFn: async () => {
            const response = await ManageColonyService.GetRouteSeqCity({
                locationid: locationId,
                facilityid: facilityId,
            });
            return parseResponse(response);
        },
        enabled: !!locationId && !!facilityId,
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};

export const useZonesQuery = (locationId, facilityId) => {
    return useQuery({
        queryKey: manageColonyKeys.zones(locationId, facilityId),
        queryFn: async () => {
            const response = await ManageColonyService.GetRouteSeqZone({
                locationid: locationId,
                facilityid: facilityId,
            });
            return parseResponse(response);
        },
        enabled: !!locationId && !!facilityId,
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};

// --- Mutations ---

export const useDeleteColonyMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageColonyService.DeleteRouteSeqColony(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageColonyKeys.all });
        },
    });
};

export const useMoveColonyMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageColonyService.MoveColony(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageColonyKeys.all });
        },
    });
};

export const useUpdateColonyMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageColonyService.UpdateRouteSeqColony(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageColonyKeys.all });
        },
    });
};

export const useSaveColonyMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageColonyService.SaveRouteSeqColony(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageColonyKeys.all });
        },
    });
};

export const useSplitRouteClusterMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageColonyService.SplitRouteCluster(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageColonyKeys.all });
        },
    });
};
