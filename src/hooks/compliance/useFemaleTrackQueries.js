import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FemaleTrackService from '../../services/compliance/FemaleTrackService';

// Query Key Factory
export const femaleTrackKeys = {
    all: ['femaleTrack'],
    facilities: (userid) => ['femaleTrack', 'facilities', userid],
    shifts: (facid, type) => ['femaleTrack', 'shifts', facid, type],
    femaleData: (params) => ['femaleTrack', 'femaleData', params],
};

// --- Queries ---

export const useFacilityQuery = (userid) => {
    return useQuery({
        queryKey: femaleTrackKeys.facilities(userid),
        queryFn: async () => {
            const response = await FemaleTrackService.SelectFacility({ Userid: userid });
            return typeof response === 'string' ? JSON.parse(response) : response;
        },
        enabled: !!userid,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useShiftsQuery = (facid, type) => {
    return useQuery({
        queryKey: femaleTrackKeys.shifts(facid, type),
        queryFn: async () => {
            const response = await FemaleTrackService.GetShiftByFacilityType({ facid, type });
            return typeof response === 'string' ? JSON.parse(response) : response;
        },
        enabled: !!facid && !!type,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useFemaleDataQuery = (params, enabled = false) => {
    return useQuery({
        queryKey: femaleTrackKeys.femaleData(params),
        queryFn: async () => {
            const response = await FemaleTrackService.GetFemaleData_ForRHS(params);
            let data = typeof response === 'string' ? JSON.parse(response) : response;
            // Ensure array
            return Array.isArray(data) ? data : [];
        },
        enabled: enabled,
        staleTime: 0, // Always fresh
    });
};

// --- Mutations ---

export const useUpdateFemaleTrackMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => FemaleTrackService.UpdateFemaleTrackRHS(params),
        onSuccess: () => {
            // Invalidate all female data queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['femaleTrack', 'femaleData'] });
        }
    });
};
