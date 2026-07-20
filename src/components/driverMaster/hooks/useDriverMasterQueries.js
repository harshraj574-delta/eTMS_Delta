import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverMasterService from '../../../services/compliance/DriverMasterService';
import parseMaybeJson from '../../../services/parseMaybeJson';

// DriverMasterService endpoints answer axios-style: the JSON string lives in response.data
const toArray = (response) => {
    const d = parseMaybeJson(response?.data);
    return Array.isArray(d) ? d : [];
};

export const driverMasterKeys = {
    all: ['driverMaster'],
    facilities: (userId) => ['driverMaster', 'facilities', userId],
    vendors: (facilityId) => ['driverMaster', 'vendors', facilityId],
    documentTypes: ['driverMaster', 'documentTypes'],
    drivers: (facilityId, vendorId, search) => ['driverMaster', 'drivers', facilityId, vendorId, search],
};

export const useFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: driverMasterKeys.facilities(userId),
        queryFn: async () => toArray(await driverMasterService.getFacilitiesByUserId(userId)),
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load facilities. Please try again.' },
    });
};

export const useVendorsQuery = (facilityId) => {
    return useQuery({
        queryKey: driverMasterKeys.vendors(facilityId),
        queryFn: async () => toArray(await driverMasterService.getVenders({ facilityid: facilityId })),
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load vendors. Please try again.' },
    });
};

export const useDocumentTypesQuery = () => {
    return useQuery({
        queryKey: driverMasterKeys.documentTypes,
        queryFn: async () => {
            const parsed = toArray(await driverMasterService.getDocumentDetails({ type: 'D' }));
            return parsed.map((item) => ({ name: item.DocumentType, value: item.Id }));
        },
        staleTime: 1000 * 60 * 10,
        meta: { silent: true },
    });
};

// Committed search: params are frozen at Submit click; the grid is read-only
// (editing seeds a detached formData copy), so a reactive query is safe.
export const useDriversQuery = (committedParams) => {
    return useQuery({
        queryKey: driverMasterKeys.drivers(
            committedParams?.facilityId,
            committedParams?.vendorId,
            committedParams?.search
        ),
        queryFn: async () =>
            toArray(
                await driverMasterService.getDriverMasterDetails({
                    facilityid: committedParams.facilityId,
                    vendorid: committedParams.vendorId,
                    Search: committedParams.search,
                })
            ),
        enabled: !!committedParams,
        meta: { errorMessage: 'Failed to load driver details.' },
    });
};

export const useSaveDriverMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => driverMasterService.addUpdateDriverMaster(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: driverMasterKeys.all });
        },
    });
};
