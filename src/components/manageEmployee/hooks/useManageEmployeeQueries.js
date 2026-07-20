import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../../services/api';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const manageEmployeeKeys = {
    all: ['manageEmployee'],
    employees: (facilityId) => ['manageEmployee', 'employees', facilityId],
    empSearch: (locationId, keyword) => ['manageEmployee', 'empSearch', locationId, keyword],
    managers: ['manageEmployee', 'managers'],
    processes: (facilityId) => ['manageEmployee', 'processes', facilityId],
    subProcesses: (processId) => ['manageEmployee', 'subProcesses', processId],
    cities: (empId) => ['manageEmployee', 'cities', empId],
    facilities: (empId, isAdmin) => ['manageEmployee', 'facilities', empId, isAdmin],
};

// Main grid — full employee list of the user's facility
export const useEmployeesQuery = (facilityId) => {
    return useQuery({
        queryKey: manageEmployeeKeys.employees(facilityId),
        queryFn: async () => toArray(await apiService.GetEmployeeList({ facilityid: facilityId })),
        enabled: !!facilityId,
        meta: { errorMessage: 'Failed to load employees. Please try again.' },
    });
};

// Search overlay — active only after the user commits a keyword
export const useEmpSearchQuery = (locationId, keyword, isAdmin) => {
    return useQuery({
        queryKey: manageEmployeeKeys.empSearch(locationId, keyword),
        queryFn: async () =>
            toArray(
                await apiService.EmpSearch({
                    locationid: locationId,
                    empidname: keyword,
                    IsAdmin: isAdmin,
                })
            ),
        enabled: keyword !== null,
        meta: { errorMessage: 'Error searching employees.' },
    });
};

export const useManagersQuery = () => {
    return useQuery({
        queryKey: manageEmployeeKeys.managers,
        queryFn: async () => {
            const managers = toArray(
                await apiService.GetManagerList({ locationid: '', empidname: '', IsAdmin: '' })
            );
            return managers.map((manager) => ({
                label:
                    manager.empName ||
                    manager.EmpName ||
                    manager.userName ||
                    manager.UserName ||
                    manager.id,
                value: manager.id || manager.Id || manager.empId || manager.EmpId,
            }));
        },
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });
};

export const useProcessesQuery = (facilityId) => {
    return useQuery({
        queryKey: manageEmployeeKeys.processes(facilityId),
        queryFn: async () => {
            const processes = toArray(
                await apiService.GetProcessByFacility({ facilityid: String(facilityId) })
            );
            return processes.map((process) => ({
                label: process.ProcessName || process.processName,
                value: process.Id,
            }));
        },
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });
};

// Cascades off the employee being edited
export const useSubProcessesQuery = (processId) => {
    return useQuery({
        queryKey: manageEmployeeKeys.subProcesses(processId),
        queryFn: async () => {
            const subProcesses = toArray(await apiService.GetSubProcess({ processid: processId }));
            return subProcesses.map((subprocess) => ({
                label: subprocess.subProcessName,
                value: subprocess.Id,
            }));
        },
        enabled: !!processId,
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });
};

// City options for the address section (endpoint keyed by employee id)
export const useCitiesQuery = (empId) => {
    return useQuery({
        queryKey: manageEmployeeKeys.cities(empId),
        queryFn: async () => {
            const cities = toArray(await apiService.locationid({ locationid: empId }));
            return cities.map((location) => ({ label: location.City, value: location.City }));
        },
        enabled: !!empId,
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });
};

// Facility options for the edit form; admins see every facility
export const useFacilityOptionsQuery = (empId, isAdmin) => {
    return useQuery({
        queryKey: manageEmployeeKeys.facilities(empId, isAdmin),
        queryFn: async () => {
            const facilities =
                isAdmin === 'Y'
                    ? toArray(await apiService.selectAllFacility({ Userid: empId }))
                    : toArray(await apiService.selectFacility({ Userid: empId }));
            return facilities.map((facility) => ({
                label: facility.facilityName,
                value: facility.Id,
            }));
        },
        enabled: !!empId,
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });
};

export const useUpdateEmployeeMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => apiService.UpdateEmployee(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageEmployeeKeys.all });
        },
    });
};
