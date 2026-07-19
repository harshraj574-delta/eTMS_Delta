import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdhocmanagementService from '../../../services/compliance/AdhocmanagementService';
import parseMaybeJson from '../../../services/parseMaybeJson';

// Query Key Factory
export const adhocManagementKeys = {
    all: ['adhocManagement'],
    requestsAll: ['adhocManagement', 'requests'],
    requests: (empId) => ['adhocManagement', 'requests', empId],
    managers: (userId) => ['adhocManagement', 'managers', userId],
    facilities: (empId) => ['adhocManagement', 'facilities', empId],
    employees: (locationId, managerId) => ['adhocManagement', 'employees', locationId, managerId],
    shifts: (facilityId, date, tripTypeLabel) => ['adhocManagement', 'shifts', facilityId, date, tripTypeLabel],
    reasons: (facilityId, requestType) => ['adhocManagement', 'reasons', facilityId, requestType],
};

// Last year of the user's adhoc requests ("emp" view). Counts on the page
// are derived from this list so cards/tabs/table always agree.
export const useAdhocRequestsQuery = (empId) => {
    return useQuery({
        queryKey: adhocManagementKeys.requests(empId),
        queryFn: async () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            const data = parseMaybeJson(
                await AdhocmanagementService.SelectEmpAdhocRequest({
                    EmpId: parseInt(empId),
                    sDate: startDate.toISOString().split('T')[0],
                    eDate: endDate.toISOString().split('T')[0],
                    status: 'emp',
                })
            );
            return Array.isArray(data) ? data : [];
        },
        enabled: !!empId,
    });
};

export const useManagersQuery = (userId) => {
    return useQuery({
        queryKey: adhocManagementKeys.managers(userId),
        queryFn: async () => {
            const data = parseMaybeJson(
                await AdhocmanagementService.GetBackupMgrId({ backupmgrid: userId })
            );
            return Array.isArray(data) ? data : [];
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10,
    });
};

export const useAdhocFacilitiesQuery = (empId) => {
    return useQuery({
        queryKey: adhocManagementKeys.facilities(empId),
        queryFn: async () => {
            const data = parseMaybeJson(
                await AdhocmanagementService.SelectFacilityByGroup({ EmpId: parseInt(empId) })
            );
            if (Array.isArray(data)) return data;
            if (data && typeof data === 'object') return [data];
            return [];
        },
        enabled: !!empId,
        staleTime: 1000 * 60 * 10,
    });
};

export const useAdhocEmployeesQuery = (locationId, managerId) => {
    return useQuery({
        queryKey: adhocManagementKeys.employees(locationId, managerId),
        queryFn: async () => {
            const data = parseMaybeJson(
                await AdhocmanagementService.EmpSearchManager({
                    empidname: '-1',
                    locationid: locationId,
                    managerID: managerId,
                })
            );
            return Array.isArray(data) ? data : [];
        },
        enabled: !!locationId && !!managerId,
        staleTime: 1000 * 60 * 5,
    });
};

// Shift options for the raise-adhoc form (pick/drop use different endpoints)
export const useAdhocShiftsQuery = ({ facilityId, date, tripTypeLabel }) => {
    return useQuery({
        queryKey: adhocManagementKeys.shifts(facilityId, date, tripTypeLabel),
        queryFn: async () => {
            const params = {
                facilityid: facilityId,
                sDate: date,
                type: tripTypeLabel === 'Pick Up' ? 'P' : 'D',
                processid: 0,
            };
            const response =
                tripTypeLabel === 'Pick Up'
                    ? await AdhocmanagementService.getpickshiftAdhoc(params)
                    : await AdhocmanagementService.getdropshiftadhoc(params);
            const data = parseMaybeJson(response);
            return Array.isArray(data) ? data : [];
        },
        enabled: !!facilityId && !!date && !!tripTypeLabel,
    });
};

export const useAdhocReasonsQuery = (facilityId, requestType) => {
    return useQuery({
        queryKey: adhocManagementKeys.reasons(facilityId, requestType),
        queryFn: async () => {
            const data = parseMaybeJson(
                await AdhocmanagementService.GetAdhocReason({
                    facilityid: facilityId,
                    triptype: requestType,
                })
            );
            return Array.isArray(data) ? data : [];
        },
        enabled: !!facilityId && !!requestType,
        staleTime: 1000 * 60 * 5,
    });
};

export const useAddAdhocRequestMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => AdhocmanagementService.AddAdhocRequest(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adhocManagementKeys.requestsAll });
        },
    });
};

export const useDeleteAdhocRequestMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => AdhocmanagementService.DeleteAdhoc(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adhocManagementKeys.requestsAll });
        },
    });
};
