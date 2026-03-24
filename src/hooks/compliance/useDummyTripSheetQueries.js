import { useQuery, useMutation } from '@tanstack/react-query';
import DummyTripSheetService from '../../services/compliance/DummyTripSheetService';

export const dummyTripSheetKeys = {
    all: ['dummyTripSheet'],
    facilities: (userId) => ['dummyTripSheet', 'facilities', userId],
    cabTypes: (facilityId) => ['dummyTripSheet', 'cabTypes', facilityId],
    shifts: (facilityId, processId, type, weekday) => ['dummyTripSheet', 'shifts', facilityId, processId, type, weekday],
};

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

export const useFacilitiesQuery = (userId, enabled = true) => {
    return useQuery({
        queryKey: dummyTripSheetKeys.facilities(userId),
        queryFn: async () => {
            const response = await DummyTripSheetService.SelectFacility({ Userid: userId });
            const parsed = parseResponse(response);
            return parsed.map(item => ({
                facilityName: item.facility || item.facilityName || "",
                Id: item.Id || item.id || item.Value || "",
            }));
        },
        enabled: enabled && !!userId,
        staleTime: 1000 * 60 * 60,
    });
};

export const useCabTypesQuery = (facilityId, enabled = false) => {
    return useQuery({
        queryKey: dummyTripSheetKeys.cabTypes(facilityId),
        queryFn: async () => {
            const response = await DummyTripSheetService.GetDummyCabTypeData({ facilityid: facilityId });
            return parseResponse(response);
        },
        enabled: enabled && !!facilityId,
        staleTime: 1000 * 60 * 60,
    });
};

export const useShiftsQuery = (facilityId, processId, type, weekday, enabled = false) => {
    return useQuery({
        queryKey: dummyTripSheetKeys.shifts(facilityId, processId, type, weekday),
        queryFn: async () => {
            const response = await DummyTripSheetService.GetDummyShiftsbyDays({
                facilityID: facilityId,
                processID: processId || 0,
                type: type,
                weekday: weekday
            });
            return parseResponse(response);
        },
        enabled: enabled && !!facilityId && type !== undefined && weekday !== undefined,
        staleTime: 1000 * 60 * 5,
    });
};

export const useEmpSearchMutation = () => {
    return useMutation({
        mutationFn: (params) => DummyTripSheetService.EmpSearch({
            locationid: params.locationid,
            empidname: params.empidname,
            IsAdmin: params.IsAdmin || 'N'
        }),
        onSuccess: (data) => parseResponse(data)
    });
};

export const useGetEmployeeMutation = () => {
    return useMutation({
        mutationFn: (empId) => DummyTripSheetService.GetEmployee({ Userid: empId }),
    });
};

export const useGetEmpByRouteMutation = () => {
    return useMutation({
        mutationFn: (routeId) => DummyTripSheetService.GetEmpByRoute({ routeids: routeId }),
    });
};

export const useGetRoutesDummyMatchMutation = () => {
    return useMutation({
        mutationFn: (params) => DummyTripSheetService.GetRoutesDummyMatch(params),
    });
};

export const useGetTransactionIdMutation = () => {
    return useMutation({
        mutationFn: () => DummyTripSheetService.getTransactionId(),
    });
};
