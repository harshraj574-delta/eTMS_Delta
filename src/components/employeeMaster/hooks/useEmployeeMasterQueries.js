import { useQuery, useMutation } from '@tanstack/react-query';
import EmployeeMasterService from '../../../services/compliance/EmployeeMasterService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object' && Array.isArray(d.data)) return d.data;
    return [];
};

export const employeeMasterKeys = {
    all: ['employeeMaster'],
    facilities: (userId) => ['employeeMaster', 'facilities', userId],
    managers: (locationId, isAdmin) => ['employeeMaster', 'managers', locationId, isAdmin],
    cities: (locationId) => ['employeeMaster', 'cities', locationId],
    processes: (facilityId) => ['employeeMaster', 'processes', facilityId],
    subProcesses: (processId) => ['employeeMaster', 'subProcesses', processId],
    areas: (locationId, city) => ['employeeMaster', 'areas', locationId, city],
    landmarks: (locationId, area) => ['employeeMaster', 'landmarks', locationId, area],
    search: (locationId, text) => ['employeeMaster', 'search', locationId, text],
    employee: (id) => ['employeeMaster', 'employee', id],
    tmpId: ['employeeMaster', 'tmpId'],
};

// ── Lookups (reactive) ────────────────────────────────────────────────────────

export const useEmFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: employeeMasterKeys.facilities(userId),
        queryFn: async () => {
            const data = toArray(await EmployeeMasterService.SelectFacility({ Userid: userId }));
            return data.map((item) => ({
                label: item.facility || item.facilityName,
                value: item.Id,
            }));
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10,
    });
};

export const useEmManagersQuery = (locationId, isAdmin) => {
    return useQuery({
        queryKey: employeeMasterKeys.managers(locationId, isAdmin),
        queryFn: async () => {
            const data = toArray(
                await EmployeeMasterService.GetManagerList({
                    locationid: locationId,
                    empidname: '',
                    IsAdmin: isAdmin,
                })
            );
            return data.map((item) => ({
                label: item.empName,
                value: item.empId || item.Id,
            }));
        },
        enabled: !!locationId,
        staleTime: 1000 * 60 * 10,
    });
};

export const useEmCitiesQuery = (locationId) => {
    return useQuery({
        queryKey: employeeMasterKeys.cities(locationId),
        queryFn: async () => {
            const data = toArray(
                await EmployeeMasterService.GetGeoCityByRS({ locationid: locationId })
            );
            return data.map((item) => ({
                label: item.cityName || item.City,
                value: item.cityName || item.City,
            }));
        },
        enabled: !!locationId,
        staleTime: 1000 * 60 * 10,
    });
};

// ── Cascading lookups: options follow their parent selection ─────────────────
// (These replace the imperative fetch + setTimeout chains in edit-binding.)

export const useEmProcessesQuery = (facilityId) => {
    return useQuery({
        queryKey: employeeMasterKeys.processes(facilityId),
        queryFn: async () => {
            const data = toArray(
                await EmployeeMasterService.GetProcessByFacility({ facilityid: facilityId })
            );
            return data.map((item) => ({
                label: item.processName || item.ProcessName,
                value: item.Id || item.processId,
            }));
        },
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 5,
    });
};

export const useEmSubProcessesQuery = (processId) => {
    return useQuery({
        queryKey: employeeMasterKeys.subProcesses(processId),
        queryFn: async () => {
            const data = toArray(
                await EmployeeMasterService.GetSubProcess({ processid: processId })
            );
            return data.map((item) => ({
                label: item.subProcessName || item.SubProcessName,
                value: item.Id || item.subProcessId,
            }));
        },
        enabled: !!processId,
        staleTime: 1000 * 60 * 5,
    });
};

export const useEmAreasQuery = (locationId, city) => {
    return useQuery({
        queryKey: employeeMasterKeys.areas(locationId, city),
        queryFn: async () => {
            const data = toArray(
                await EmployeeMasterService.GetGeoCityColonyRS({
                    locationid: locationId,
                    city,
                })
            );
            return data.map((item) => ({
                label: item.colony || item.ColonyName,
                value: item.colony || item.Colony,
            }));
        },
        enabled: !!locationId && !!city,
        staleTime: 1000 * 60 * 5,
    });
};

export const useEmLandmarksQuery = (locationId, area) => {
    return useQuery({
        queryKey: employeeMasterKeys.landmarks(locationId, area),
        queryFn: async () => {
            const data = toArray(
                await EmployeeMasterService.GetSubColonyRs({
                    locationid: locationId,
                    colony: area,
                })
            );
            return data.map((item) => ({
                label: item.subColony || item.Subcolony,
                value: item.id || item.Id || item.subColony || item.Subcolony,
            }));
        },
        enabled: !!locationId && !!area,
        staleTime: 1000 * 60 * 5,
    });
};

// ── Imperative reads ─────────────────────────────────────────────────────────

export const fetchEmployeeSearch = (queryClient, { locationId, text, isAdmin }) =>
    queryClient.fetchQuery({
        queryKey: employeeMasterKeys.search(locationId, text),
        queryFn: async () =>
            toArray(
                await EmployeeMasterService.EmpSearch({
                    locationid: locationId,
                    empidname: text,
                    IsAdmin: isAdmin,
                })
            ),
        staleTime: 0,
    });

// Seeds the edit form — imperative so a background refetch can't clobber edits
export const fetchEmployeeById = (queryClient, id) =>
    queryClient.fetchQuery({
        queryKey: employeeMasterKeys.employee(id),
        queryFn: async () => toArray(await EmployeeMasterService.GetEmployee({ Userid: id })),
        staleTime: 0,
        gcTime: 0,
    });

// A fresh temp id per new-employee form (never cached)
export const fetchGenerateTmpId = (queryClient) =>
    queryClient.fetchQuery({
        queryKey: employeeMasterKeys.tmpId,
        queryFn: async () => {
            const data = parseMaybeJson(await EmployeeMasterService.GenerateTmpId({}));
            const first = Array.isArray(data) ? data[0] : data;
            return first?.TmpEmpId || first?.tmpEmpId || first?.EmpId || '';
        },
        staleTime: 0,
        gcTime: 0,
    });

// ── Mutations ────────────────────────────────────────────────────────────────

export const useInsertEmployeeMutation = () => {
    return useMutation({
        mutationFn: (payload) => EmployeeMasterService.InsertEmployee(payload),
    });
};

export const useUpdateEmployeeMutation = () => {
    return useMutation({
        mutationFn: (payload) => EmployeeMasterService.UpdateEmployee(payload),
    });
};
