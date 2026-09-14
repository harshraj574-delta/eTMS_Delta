import { useQuery } from '@tanstack/react-query';
import OTAReportService from '../../../services/compliance/OTAReportService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

// Some report endpoints answer axios-style ({ data: ... }), some answer raw
const unwrap = (response) => {
    const body = response && typeof response === 'object' && 'data' in response
        ? response.data
        : response;
    const parsed = parseMaybeJson(body);
    return Array.isArray(parsed) ? parsed : [parsed];
};

export const otaReportKeys = {
    all: ['otaReport'],
    facilities: (userId) => ['otaReport', 'facilities', userId],
    vendors: (facilityId) => ['otaReport', 'vendors', facilityId],
    detail: (params) => ['otaReport', 'detail', params],
    shiftWise: (params) => ['otaReport', 'shiftWise', params],
    vendorWise: (params) => ['otaReport', 'vendorWise', params],
};

export const useFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: otaReportKeys.facilities(userId),
        queryFn: async () => {
            const facilities = toArray(await OTAReportService.SelectFacility({ Userid: userId }));
            return facilities.map((item) => ({
                label: item.facility || item.facilityName,
                value: item.Id,
            }));
        },
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Error fetching facilities' },
    });
};

export const useVendorsQuery = (facilityId) => {
    return useQuery({
        queryKey: otaReportKeys.vendors(facilityId),
        queryFn: async () => {
            const vendors = toArray(
                await OTAReportService.GetVendorByFacility({ facilityId })
            );
            return vendors.map((item) => ({
                label: item.vendor || item.vendorName,
                value: item.Id,
            }));
        },
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Error fetching vendors' },
    });
};

// Click-driven report fetch (three report types, result-dependent toasts) —
// stays imperative; the component owns the toasts and result grouping.
export const fetchReport = (queryClient, reportType, params) => {
    const fetchers = {
        detailed: () => OTAReportService.RepOTAdetail(params),
        shiftwise: () => OTAReportService.RptArrivalShiftWise(params),
        vendorwise: () => OTAReportService.RptArrivalVendorWise(params),
    };
    const keyFactory = {
        detailed: otaReportKeys.detail,
        shiftwise: otaReportKeys.shiftWise,
        vendorwise: otaReportKeys.vendorWise,
    };
    return queryClient.fetchQuery({
        queryKey: keyFactory[reportType](params),
        queryFn: async () => unwrap(await fetchers[reportType]()),
        staleTime: 0,
        meta: { silent: true },
    });
};
