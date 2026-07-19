import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../../services/api';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const vendorMasterKeys = {
    all: ['vendorMaster'],
    facilities: (userId) => ['vendorMaster', 'facilities', userId],
    vendors: (facilityId) => ['vendorMaster', 'vendors', facilityId],
};

export const useFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: vendorMasterKeys.facilities(userId),
        queryFn: async () => toArray(await apiService.SelectFacility({ Userid: userId })),
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load facilities. Please try again.' },
    });
};

// The grid is read-only (editing happens on a detached selectedVendor copy),
// so a reactive query is safe — mutations below refresh it via invalidation.
export const useVendorsQuery = (facilityId) => {
    return useQuery({
        queryKey: vendorMasterKeys.vendors(facilityId),
        queryFn: async () => toArray(await apiService.GetVendorByFacility({ facilityid: facilityId })),
        enabled: !!facilityId,
        meta: { errorMessage: 'Failed to load vendor data. Please try again.' },
    });
};

export const useInsertVendorMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => apiService.InsertVendor(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vendorMasterKeys.all });
        },
    });
};

export const useUpdateVendorMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => apiService.UpdateVendor(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vendorMasterKeys.all });
        },
    });
};
