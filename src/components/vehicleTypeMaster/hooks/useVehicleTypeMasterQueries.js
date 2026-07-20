import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../../services/api';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const vehicleTypeMasterKeys = {
    all: ['vehicleTypeMaster'],
    facilities: (userId) => ['vehicleTypeMaster', 'facilities', userId],
    vendors: (facilityId) => ['vehicleTypeMaster', 'vendors', facilityId],
    vehicleTypes: (facilityId, vendorId) => ['vehicleTypeMaster', 'vehicleTypes', facilityId, vendorId],
    vendorScheme: (vendorId) => ['vehicleTypeMaster', 'vendorScheme', vendorId],
};

export const useFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: vehicleTypeMasterKeys.facilities(userId),
        queryFn: async () => toArray(await apiService.SelectFacility({ Userid: userId })),
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load facilities. Please try again.' },
    });
};

export const useVendorsQuery = (facilityId) => {
    return useQuery({
        queryKey: vehicleTypeMasterKeys.vendors(facilityId),
        queryFn: async () => toArray(await apiService.GetVendorByFacility({ facilityid: facilityId })),
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load vendors. Please try again.' },
    });
};

// vendorId 0 = all vendors. The grid is read-only (editing happens on a
// detached selectedVehicletype copy), so a reactive query is safe.
export const useVehicleTypesQuery = (facilityId, vendorId) => {
    return useQuery({
        queryKey: vehicleTypeMasterKeys.vehicleTypes(facilityId, vendorId),
        queryFn: async () =>
            toArray(
                await apiService.SelectVehicleTypeFacility({
                    vendorid: vendorId,
                    facilityid: facilityId,
                })
            ),
        enabled: !!facilityId,
        meta: { errorMessage: 'Failed to load vehicle types. Please try again.' },
    });
};

// Scheme (bill type) of one vendor — seeds the edit/add form on vendor change
export const fetchVendorScheme = async (queryClient, vendorId) => {
    const rows = await queryClient.fetchQuery({
        queryKey: vehicleTypeMasterKeys.vendorScheme(vendorId),
        queryFn: async () => toArray(await apiService.GetSelectedVendor({ vendorid: vendorId })),
        staleTime: 1000 * 60,
        meta: { silent: true },
    });
    return rows[0]?.vendorType;
};

export const useInsertVehicleTypeMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => apiService.InsertVehicleType(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vehicleTypeMasterKeys.all });
        },
    });
};

export const useUpdateVehicleTypeMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => apiService.UpdateVehicleType(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vehicleTypeMasterKeys.all });
        },
    });
};
