import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorAllocationService } from '../../../services/compliance/VendorAllocationService';
import CostMasterService from '../../../services/compliance/CostMasterService';
import parseMaybeJson from '../../../services/parseMaybeJson';

// Query Key Factory
export const vendorAllocationKeys = {
    all: ['vendorAllocation'],
    facilities: (userId) => ['vendorAllocation', 'facilities', userId],
    shifts: (facilityId, tripType) => ['vendorAllocation', 'shifts', facilityId, tripType],
    vendors: (facilityId) => ['vendorAllocation', 'vendors', facilityId],
    routes: (params) => ['vendorAllocation', 'routes', params],
    statistics: (params) => ['vendorAllocation', 'statistics', params],
    assignedCountsAll: ['vendorAllocation', 'assignedCounts'],
    assignedCounts: (params) => ['vendorAllocation', 'assignedCounts', params],
};

// NOTE: CostMasterService / vendorAllocationService are shared with other,
// not-yet-migrated pages, so responses are normalized here in the hooks
// rather than at the service boundary.

export const useFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: vendorAllocationKeys.facilities(userId),
        queryFn: async () => {
            const data = parseMaybeJson(await CostMasterService.SelectFacility({ Userid: userId }));
            return Array.isArray(data)
                ? data.map((item) => ({
                      label: item.facility || item.facilityName,
                      value: item.Id,
                  }))
                : [];
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10,
    });
};

export const useShiftTimesQuery = (facilityId, tripType) => {
    return useQuery({
        queryKey: vendorAllocationKeys.shifts(facilityId, tripType),
        queryFn: async () => {
            const data = parseMaybeJson(
                await vendorAllocationService.GetShiftByFacilityType({
                    facid: facilityId,
                    type: tripType,
                })
            );
            return Array.isArray(data)
                ? data.map((item) => ({ name: item.shiftTime, value: item.shiftTime }))
                : [];
        },
        enabled: !!facilityId && !!tripType,
        staleTime: 1000 * 60 * 5,
    });
};

export const useVendorsQuery = (facilityId) => {
    return useQuery({
        queryKey: vendorAllocationKeys.vendors(facilityId),
        queryFn: async () => {
            const data = parseMaybeJson(
                await CostMasterService.GetVendorByFac({ facilityid: facilityId })
            );
            const formatted = Array.isArray(data)
                ? data.map((item) => ({
                      label: item.vendor || item.vendorName,
                      value: item.Id,
                  }))
                : [];
            return [{ label: '-Select -', value: 0 }, ...formatted];
        },
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 5,
    });
};

// Routes for the committed search (params = null until the user clicks Show)
export const useAllocationRoutesQuery = (params) => {
    return useQuery({
        queryKey: vendorAllocationKeys.routes(params),
        queryFn: async () => {
            const data = parseMaybeJson(
                await vendorAllocationService.GetRoutesByOrder({
                    sDate: params.sDate,
                    eDate: params.sDate,
                    FacilityID: params.facilityId,
                    TripType: params.tripType,
                    Shifttimes: params.shiftTime,
                    OrderBy: 'Location',
                    Direction: 'ASC',
                    Routeid: 0,
                    occ_seater: '',
                })
            );
            return Array.isArray(data) ? data : [];
        },
        enabled: !!params,
        staleTime: 0,
        // The table seeded from this query is edited locally (vendor per row);
        // a focus-triggered refetch would wipe unsaved edits.
        refetchOnWindowFocus: false,
    });
};

export const useAllocationStatisticsQuery = (params) => {
    return useQuery({
        queryKey: vendorAllocationKeys.statistics(params),
        queryFn: async () => {
            const data = parseMaybeJson(
                await vendorAllocationService.GetRoutesStatistics({
                    sdate: params.sDate,
                    edate: params.sDate,
                    triptype: params.tripType,
                    facilityid: params.facilityId,
                    shifttime: params.shiftTime,
                })
            );
            const stat = Array.isArray(data) && data.length > 0 ? data[0] : {};
            return {
                TotalRoutes: stat.TotalRoutes ?? 0,
                TotalEmps: stat.TotalEmps ?? 0,
            };
        },
        enabled: !!params,
    });
};

export const useAssignedVendorCountsQuery = (params) => {
    return useQuery({
        queryKey: vendorAllocationKeys.assignedCounts(params),
        queryFn: async () => {
            const data = parseMaybeJson(
                await vendorAllocationService.GetAssignedVendorCount({
                    sdate: params.sDate,
                    edate: params.sDate,
                    facilityid: params.facilityId,
                    triptype: params.tripType,
                    shifttimes: params.shiftTime,
                })
            );
            return Array.isArray(data) ? data : [];
        },
        enabled: !!params,
    });
};

// Assign a vendor to one route; the per-shift assigned counts refresh after.
export const useAssignVendorMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => vendorAllocationService.AssignStickerToRoutes(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vendorAllocationKeys.assignedCountsAll });
        },
    });
};
