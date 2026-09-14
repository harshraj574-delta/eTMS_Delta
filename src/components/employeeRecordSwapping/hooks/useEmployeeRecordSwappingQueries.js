import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmployeeRecordSwappingService from '../../../services/compliance/EmployeeRecordSwappingService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object') return d.data ?? [];
    return [];
};

export const employeeRecordSwappingKeys = {
    all: ['employeeRecordSwapping'],
    duplicates: ['employeeRecordSwapping', 'duplicates'],
    empSearch: (text) => ['employeeRecordSwapping', 'empSearch', text],
    duplicateDetail: (commonValue, commonField) => [
        'employeeRecordSwapping',
        'duplicateDetail',
        commonValue,
        commonField,
    ],
    employeeDetails: (empId) => ['employeeRecordSwapping', 'employeeDetails', empId],
    shifts: (empId, date) => ['employeeRecordSwapping', 'shifts', empId, date],
};

// List-view table; the submit mutation refreshes it via invalidation
export const useDuplicateRecordsQuery = () => {
    return useQuery({
        queryKey: employeeRecordSwappingKeys.duplicates,
        queryFn: async () => toArray(await EmployeeRecordSwappingService.GetDuplicateEmpData()),
        meta: { errorMessage: 'Failed to fetch duplicate records' },
    });
};

// ── Imperative reads (click-driven; the component owns toasts + enrichment) ──

export const fetchEmpSearch = (queryClient, { locationId, text, isAdmin }) =>
    queryClient.fetchQuery({
        queryKey: employeeRecordSwappingKeys.empSearch(text),
        queryFn: async () =>
            toArray(
                await EmployeeRecordSwappingService.EmpSearch({
                    locationid: locationId,
                    empidname: text,
                    IsAdmin: isAdmin,
                })
            ),
        staleTime: 0,
        meta: { silent: true },
    });

export const fetchDuplicateDetail = (queryClient, { commonValue, commonField }) =>
    queryClient.fetchQuery({
        queryKey: employeeRecordSwappingKeys.duplicateDetail(commonValue, commonField),
        queryFn: async () =>
            toArray(
                await EmployeeRecordSwappingService.GetDuplicateEmpDetail({
                    CommonValue: commonValue,
                    CommonField: commonField,
                    EmpList: '',
                })
            ),
        staleTime: 0,
        meta: { silent: true },
    });

export const fetchEmployeeDetails = (queryClient, empId) =>
    queryClient.fetchQuery({
        queryKey: employeeRecordSwappingKeys.employeeDetails(empId),
        queryFn: async () =>
            toArray(await EmployeeRecordSwappingService.GetEmployeeDetails({ empid: empId })),
        staleTime: 1000 * 60,
        meta: { silent: true },
    });

export const fetchEmployeeShifts = (queryClient, { empId, date }) =>
    queryClient.fetchQuery({
        queryKey: employeeRecordSwappingKeys.shifts(empId, date),
        queryFn: async () =>
            toArray(
                await EmployeeRecordSwappingService.GetHelpDeskEmployeeDetail({
                    empid: empId,
                    sDate: date,
                })
            ),
        staleTime: 1000 * 60,
        meta: { silent: true },
    });

export const useUpdateDuplicateEmpMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => EmployeeRecordSwappingService.UpdateDuplicateEmp(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: employeeRecordSwappingKeys.all });
        },
    });
};
