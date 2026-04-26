import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EmpSpocService from "../services/compliance/EmpSpocService";
import { toastService } from "../services/toastService";

const safeParse = (data) => {
    if (typeof data === "string") {
        try { return JSON.parse(data); } catch { return []; }
    }
    return data ?? [];
};

const getResult = (data) => {
    const parsed = safeParse(data);
    const item = Array.isArray(parsed) ? parsed[0] : parsed;
    return String(item?.result ?? item?.Result ?? "");
};

export const empSpocKeys = {
    spocSearch: (locationId, empIdName, isAdmin) => ["empSpoc", "spocSearch", locationId, empIdName, isAdmin],
    spocTeam: (spocId) => ["empSpoc", "spocTeam", spocId],
    backupSpoc: (spocId) => ["empSpoc", "backupSpoc", spocId],
    empSearch: (locationId, searchTerm, isAdmin) => ["empSpoc", "empSearch", locationId, searchTerm, isAdmin],
    processByFacility: (facilityId) => ["empSpoc", "processByFacility", facilityId],
    empByProcess: (processId, empIds, locationId) => ["empSpoc", "empByProcess", processId, empIds, locationId],
};

export const useSpocSearchQuery = (locationId, empIdName, isAdmin, enabled) =>
    useQuery({
        queryKey: empSpocKeys.spocSearch(locationId, empIdName, isAdmin),
        queryFn: async () => safeParse(await EmpSpocService.EmpSearch({ locationid: locationId, empidname: empIdName, IsAdmin: isAdmin })),
        enabled: !!enabled && !!empIdName,
        staleTime: 0,
    });

export const useSpocTeamQuery = (spocId) =>
    useQuery({
        queryKey: empSpocKeys.spocTeam(spocId),
        queryFn: async () => safeParse(await EmpSpocService.GetEmpAssignedSPOC({ spocid: spocId, empids: "" })),
        enabled: !!spocId,
        staleTime: 0,
    });

export const useBackupSpocQuery = (spocId) =>
    useQuery({
        queryKey: empSpocKeys.backupSpoc(spocId),
        queryFn: async () => safeParse(await EmpSpocService.GetBackupSpoc({ empid: spocId })),
        enabled: !!spocId,
        staleTime: 0,
    });

export const useAssignEmpSearchQuery = (locationId, searchTerm, isAdmin, enabled) =>
    useQuery({
        queryKey: empSpocKeys.empSearch(locationId, searchTerm, isAdmin),
        queryFn: async () => safeParse(await EmpSpocService.EmpSearch({ locationid: locationId, empidname: searchTerm, IsAdmin: isAdmin })),
        enabled: !!enabled && !!searchTerm,
        staleTime: 0,
    });

export const useProcessByFacilityQuery = (facilityId) =>
    useQuery({
        queryKey: empSpocKeys.processByFacility(facilityId),
        queryFn: async () => safeParse(await EmpSpocService.GetProcessByFacility({ facilityid: facilityId })),
        enabled: !!facilityId && Number(facilityId) > 0,
        staleTime: 5 * 60 * 1000,
    });

export const useEmpByProcessQuery = (processId, empIds, locationId, enabled) =>
    useQuery({
        queryKey: empSpocKeys.empByProcess(processId, empIds, locationId),
        queryFn: async () => safeParse(await EmpSpocService.GetEmployeeByProcess({ ProcessId: processId, EmpIds: empIds, LocationId: locationId })),
        enabled: !!enabled,
        staleTime: 0,
    });

export const useAssignSpocMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => EmpSpocService.AssignSpoc(params),
        onSuccess: (data) => {
            if (getResult(data) === "1") {
                toastService.success("Employee assigned to SPOC.");
                queryClient.invalidateQueries({ queryKey: ["empSpoc", "spocTeam"] });
            } else {
                toastService.warn("Employee already exists in SPOC.");
            }
        },
        onError: () => toastService.error("Failed to assign employee."),
    });
};

export const useAssignBackupSpocMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => EmpSpocService.AssignBackupSpoc(params),
        onSuccess: (data) => {
            if (getResult(data) === "1") {
                toastService.success("Backup SPOC assigned.");
                queryClient.invalidateQueries({ queryKey: ["empSpoc", "backupSpoc"] });
            } else {
                toastService.warn("Backup already exists or limit exceeded.");
            }
        },
        onError: () => toastService.error("Failed to assign backup SPOC."),
    });
};

export const useRemoveSpocMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => EmpSpocService.RemoveSPOC(params),
        onSuccess: () => {
            toastService.success("Employee removed from SPOC team.");
            queryClient.invalidateQueries({ queryKey: ["empSpoc", "spocTeam"] });
        },
        onError: () => toastService.error("Failed to remove employee."),
    });
};

export const useRemoveBackupSpocMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => EmpSpocService.RemoveBackupSpoc(params),
        onSuccess: () => {
            toastService.success("Backup SPOC removed.");
            queryClient.invalidateQueries({ queryKey: ["empSpoc", "backupSpoc"] });
        },
        onError: () => toastService.error("Failed to remove backup SPOC."),
    });
};

export const useAssignAllSpocMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => EmpSpocService.AssignAllSpoc(params),
        onSuccess: () => {
            toastService.success("All employees assigned to SPOC.");
            queryClient.invalidateQueries({ queryKey: ["empSpoc", "spocTeam"] });
        },
        onError: () => toastService.error("Failed to assign all employees."),
    });
};
