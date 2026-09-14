import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CostMasterService from '../../../services/compliance/CostMasterService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const costMasterKeys = {
    all: ['costMaster'],
    facilities: (userId) => ['costMaster', 'facilities', userId],
    vendors: (facilityId) => ['costMaster', 'vendors', facilityId],
    zones: (facilityId) => ['costMaster', 'zones', facilityId],
    cost: (params) => ['costMaster', 'cost', params],
};

export const useFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: costMasterKeys.facilities(userId),
        queryFn: async () => {
            const facilities = toArray(await CostMasterService.SelectFacility({ Userid: userId }));
            return facilities.map((item) => ({
                label: item.facility || item.facilityName,
                value: item.Id,
            }));
        },
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load facilities. Please try again.' },
    });
};

// Shared by the search bar and the Add New Cost sidebar (different facility
// selections, same cache when they match). The "-All Vendors-" entry is added
// by the caller that needs it.
export const useVendorsQuery = (facilityId) => {
    return useQuery({
        queryKey: costMasterKeys.vendors(facilityId),
        queryFn: async () => {
            const vendors = toArray(
                await CostMasterService.GetVendorByFac({ facilityid: facilityId })
            );
            return vendors.map((item) => ({
                label: item.vendor || item.vendorName,
                value: item.Id,
            }));
        },
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load vendors. Please try again.' },
    });
};

export const useZonesQuery = (facilityId) => {
    return useQuery({
        queryKey: costMasterKeys.zones(facilityId),
        queryFn: async () => {
            const zones = toArray(
                await CostMasterService.SelectZoneByFac({ facilityid: facilityId })
            );
            return zones.map((item) => ({
                label: item.zone || item.zoneName,
                value: item.id,
            }));
        },
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load zones. Please try again.' },
    });
};

// Click-driven cost search with result-dependent toasts — stays imperative;
// the component owns the toasts and re-runs it after updates.
export const fetchCost = (queryClient, params) =>
    queryClient.fetchQuery({
        queryKey: costMasterKeys.cost(params),
        queryFn: async () => {
            const parsed = parseMaybeJson(await CostMasterService.GetCost(params));
            return Array.isArray(parsed) ? parsed : [parsed];
        },
        staleTime: 0,
        meta: { silent: true },
    });

export const useAddCostMutation = () => {
    return useMutation({
        mutationFn: (params) => CostMasterService.AddNewCost(params),
    });
};

export const useUpdateCostMutation = () => {
    return useMutation({
        mutationFn: (params) => CostMasterService.sprUpdateCost(params),
    });
};
