import { useQuery, useMutation } from '@tanstack/react-query';
import HelpDeskService from '../../../services/compliance/HelpDeskService';
import parseMaybeJson from '../../../services/parseMaybeJson';

// Normalize the service's mixed response shapes to an array
const toArray = (data) => {
    const d = parseMaybeJson(data);
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object') return d.data || [d];
    return [];
};

export const helpDeskKeys = {
    all: ['helpDesk'],
    incidentMaster: ['helpDesk', 'incidentMaster'],
    facilities: (userId) => ['helpDesk', 'facilities', userId],
    shifts: (facilityId, tripType) => ['helpDesk', 'shifts', facilityId, tripType],
    empSearch: (locationId, text) => ['helpDesk', 'empSearch', locationId, text],
    employeeBundle: (empId) => ['helpDesk', 'employeeBundle', empId],
    empDayDetail: (empId, date) => ['helpDesk', 'empDayDetail', empId, date],
    scheduleLog: (empId, date) => ['helpDesk', 'scheduleLog', empId, date],
    routeSummary: (routeId) => ['helpDesk', 'routeSummary', routeId],
    routeDetails: (routeId) => ['helpDesk', 'routeDetails', routeId],
    routes: (params) => ['helpDesk', 'routes', params],
    routeCounts: (params) => ['helpDesk', 'routeCounts', params],
};

// ── Reactive queries (safe, read-only lookups) ────────────────────────────────

export const useIncidentMasterQuery = () => {
    return useQuery({
        queryKey: helpDeskKeys.incidentMaster,
        queryFn: async () => toArray(await HelpDeskService.GetIncidentMaster()),
        staleTime: 1000 * 60 * 60,
    });
};

export const useHelpDeskFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: helpDeskKeys.facilities(userId),
        queryFn: async () => {
            const data = toArray(await HelpDeskService.SelectFacility({ Userid: userId }));
            return data.map((item) => ({
                label: item.facility || item.facilityName,
                value: item.Id,
            }));
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10,
    });
};

export const useHelpDeskShiftsQuery = (facilityId, tripType) => {
    return useQuery({
        queryKey: helpDeskKeys.shifts(facilityId, tripType),
        queryFn: async () => {
            const data = toArray(
                await HelpDeskService.GetShiftByFacilityType({ facid: facilityId, type: tripType })
            );
            return data.map((item) => ({ name: item.shiftTime, value: item.shiftTime }));
        },
        enabled: !!facilityId && !!tripType,
        staleTime: 1000 * 60 * 5,
    });
};

// ── Imperative reads (click-driven; results seed locally-edited state) ────────
// These use queryClient.fetchQuery: cached + deduped, but NEVER auto-refetch,
// because several results become editable copies (tracking status / remarks)
// and a background refetch would wipe unsaved edits.

export const fetchEmpSearch = (queryClient, { locationId, text }) =>
    queryClient.fetchQuery({
        queryKey: helpDeskKeys.empSearch(locationId, text),
        queryFn: async () =>
            toArray(
                await HelpDeskService.EmpSearch({
                    locationid: locationId,
                    empidname: text,
                    IsAdmin: 'N',
                })
            ),
        staleTime: 0,
    });

// Employee profile = details + directory record merged by empCode
export const fetchEmployeeBundle = async (queryClient, empId) =>
    queryClient.fetchQuery({
        queryKey: helpDeskKeys.employeeBundle(empId),
        queryFn: async () => {
            const [detailsRes, empRes] = await Promise.all([
                HelpDeskService.GetEmployeeDetails({ empid: empId }),
                HelpDeskService.GetEmployee({ Userid: empId }),
            ]);
            const details = toArray(detailsRes);
            return { details: details.length > 0 ? details[0] : null, list: toArray(empRes) };
        },
        staleTime: 1000 * 60,
    });

export const fetchEmpDayDetail = (queryClient, { empId, date }) =>
    queryClient.fetchQuery({
        queryKey: helpDeskKeys.empDayDetail(empId, date),
        queryFn: async () =>
            toArray(
                await HelpDeskService.GetHelpDeskEmployeeDetail({ sDate: date, empid: empId })
            ),
        staleTime: 1000 * 30,
    });

export const fetchScheduleLog = (queryClient, { empId, date }) =>
    queryClient.fetchQuery({
        queryKey: helpDeskKeys.scheduleLog(empId, date),
        queryFn: async () =>
            toArray(await HelpDeskService.GetEmpScheduleLog({ sDate: date, empid: empId })),
        staleTime: 1000 * 30,
    });

export const fetchRouteSummary = (queryClient, routeId) =>
    queryClient.fetchQuery({
        queryKey: helpDeskKeys.routeSummary(routeId),
        queryFn: async () =>
            toArray(await HelpDeskService.GetRouteSummary({ routeids: routeId })),
        staleTime: 1000 * 30,
    });

// Always fresh: rows become an editable tracking form
export const fetchRouteDetails = (queryClient, routeId) =>
    queryClient.fetchQuery({
        queryKey: helpDeskKeys.routeDetails(routeId),
        queryFn: async () =>
            toArray(await HelpDeskService.GetRoutesDetailsnew({ RouteID: routeId, isAdd: 1 })),
        staleTime: 0,
    });

export const fetchHelpDeskRoutes = (queryClient, params) =>
    queryClient.fetchQuery({
        queryKey: helpDeskKeys.routes(params),
        queryFn: async () => toArray(await HelpDeskService.GetRoutesHelpDesk(params)),
        staleTime: 0,
    });

export const fetchRouteCounts = (queryClient, params) =>
    queryClient.fetchQuery({
        queryKey: helpDeskKeys.routeCounts(params),
        queryFn: async () => {
            const data = parseMaybeJson(await HelpDeskService.GetRouteCountHelpDesk(params));
            if (Array.isArray(data)) return data[0] || {};
            if (data && typeof data === 'object') {
                if (data.data) return Array.isArray(data.data) ? data.data[0] || {} : data.data;
                return data;
            }
            return {};
        },
        staleTime: 0,
    });

// ── Mutations ────────────────────────────────────────────────────────────────
// No cache invalidation on purpose: this page manages locally-edited copies
// and re-fetches explicitly on the next open (details are staleTime 0).

export const useUpdateTrackingStatusMutation = () => {
    return useMutation({
        mutationFn: (payload) => HelpDeskService.UpdateTrackingStatus(payload),
    });
};

export const useUpdateVehicleRemarkMutation = () => {
    return useMutation({
        mutationFn: (payload) => HelpDeskService.sprUpdateVehicleRemark(payload),
    });
};
