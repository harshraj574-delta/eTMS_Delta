import { useQuery, useMutation } from '@tanstack/react-query';
import VehicleMasterService from '../../../services/compliance/VehicleMasterService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const vehicleMasterKeys = {
    all: ['vehicleMaster'],
    facilities: (userId) => ['vehicleMaster', 'facilities', userId],
    fuelTypes: ['vehicleMaster', 'fuelTypes'],
    documentTypes: ['vehicleMaster', 'documentTypes'],
    vendors: (facilityId) => ['vehicleMaster', 'vendors', facilityId],
    vehicleTypes: (vendorId) => ['vehicleMaster', 'vehicleTypes', vendorId],
    vehicles: (facilityId, vendorId) => ['vehicleMaster', 'vehicles', facilityId, vendorId],
};

// Shared queryFns so the reactive hooks and the imperative fetchers
// (used by edit-open name→id resolution) hit the same cache entries.
const vendorsQueryOptions = (facilityId) => ({
    queryKey: vehicleMasterKeys.vendors(facilityId),
    queryFn: async () => {
        const data = toArray(
            await VehicleMasterService.GetVendorByFacility({ facilityid: facilityId })
        );
        return data.map((item) => ({ name: item.vendorName, value: item.Id }));
    },
    staleTime: 1000 * 60 * 5,
    meta: { errorMessage: 'Failed to load vendor data.' },
});

const vehicleTypesQueryOptions = (vendorId) => ({
    queryKey: vehicleMasterKeys.vehicleTypes(vendorId),
    queryFn: async () => {
        const data = toArray(
            await VehicleMasterService.SelectVehicleType({ vendorid: vendorId })
        );
        return data.map((item) => ({ name: item.vehicle, value: item.Id }));
    },
    staleTime: 1000 * 60 * 5,
    meta: { errorMessage: 'Failed to load vehicle type data.' },
});

// ── Lookups ──────────────────────────────────────────────────────────────────

export const useVmFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: vehicleMasterKeys.facilities(userId),
        queryFn: async () => {
            const data = toArray(await VehicleMasterService.SelectFacility({ Userid: userId }));
            return data.map((item) => ({ name: item.facilityName, value: item.Id }));
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10,
    });
};

export const useVmFuelTypesQuery = () => {
    return useQuery({
        queryKey: vehicleMasterKeys.fuelTypes,
        queryFn: async () => {
            const data = toArray(await VehicleMasterService.sp_getfuelmaster());
            return data.map((item) => ({ name: item.fueltype, value: item.Id }));
        },
        staleTime: 1000 * 60 * 60,
    });
};

export const useVmDocumentTypesQuery = () => {
    return useQuery({
        queryKey: vehicleMasterKeys.documentTypes,
        queryFn: async () => {
            const data = toArray(await VehicleMasterService.SPR_DocumentDetails({ type: 'V' }));
            return data.map((item) => ({ name: item.DocumentType, value: item.Id }));
        },
        staleTime: 1000 * 60 * 60,
    });
};

export const useVmVendorsQuery = (facilityId) => {
    return useQuery({
        ...vendorsQueryOptions(facilityId),
        enabled: !!facilityId,
    });
};

export const useVmVehicleTypesQuery = (vendorId) => {
    return useQuery({
        ...vehicleTypesQueryOptions(vendorId),
        enabled: !!vendorId,
    });
};

// ── Imperative reads ─────────────────────────────────────────────────────────

// Edit-open needs the arrays synchronously to resolve names → ids
export const fetchVmVendors = (queryClient, facilityId) =>
    queryClient.fetchQuery(vendorsQueryOptions(facilityId));

export const fetchVmVehicleTypes = (queryClient, vendorId) =>
    queryClient.fetchQuery(vehicleTypesQueryOptions(vendorId));

// Committed search: the vehicles list for facility+vendor
export const fetchVehicles = (queryClient, { facilityId, vendorId }) =>
    queryClient.fetchQuery({
        queryKey: vehicleMasterKeys.vehicles(facilityId, vendorId),
        queryFn: async () =>
            toArray(
                await VehicleMasterService.SPR_VehiclesDetails({
                    facilityid: facilityId,
                    vendorid: vendorId,
                    search: '',
                })
            ),
        staleTime: 0,
        meta: { silent: true },
    });

// ── Mutations ────────────────────────────────────────────────────────────────

export const useAddUpdateVehicleMutation = () => {
    return useMutation({
        mutationFn: (payload) => VehicleMasterService.SPR_AddUpdateVehicle(payload),
    });
};
