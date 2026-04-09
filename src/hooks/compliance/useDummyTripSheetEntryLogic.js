import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DummyTripSheetEntryService from "../../services/compliance/DummyTripSheetEntryService";

export const dummyTripSheetEntryKeys = {
    all: ['dummyTripSheetEntry'],
    routeInfo: (routeids) => [...dummyTripSheetEntryKeys.all, 'routeInfo', routeids],
    empByRoute: (routeids) => [...dummyTripSheetEntryKeys.all, 'empByRoute', routeids],
    vehicleTagNumbers: (facilityid) => [...dummyTripSheetEntryKeys.all, 'vehicleTagNumbers', facilityid],
    vehicleInfoByRouteNo: (routeno, facilityid) => [...dummyTripSheetEntryKeys.all, 'vehicleInfoByRouteNo', routeno, facilityid],
    empSearch: (locationid, empidname) => [...dummyTripSheetEntryKeys.all, 'empSearch', locationid, empidname],
    zoneByFac: (facilityid) => [...dummyTripSheetEntryKeys.all, 'zoneByFac', facilityid],
    guardDetails: (FacilityID, SearchValue) => [...dummyTripSheetEntryKeys.all, 'guardDetails', FacilityID, SearchValue],
    vendorByFacility: (facilityid) => [...dummyTripSheetEntryKeys.all, 'vendorByFacility', facilityid],
    vehicleType: (vendorid) => [...dummyTripSheetEntryKeys.all, 'vehicleType', vendorid],
    driverDetails: (facid, type) => [...dummyTripSheetEntryKeys.all, 'driverDetails', facid, type],
    shiftByFacilityType: (facid, type) => [...dummyTripSheetEntryKeys.all, 'shiftByFacilityType', facid, type],
    tollMaster: (routeid, Employeeid, AllToll) => [...dummyTripSheetEntryKeys.all, 'tollMaster', routeid, Employeeid, AllToll],
    penaltyType: (vendorid) => [...dummyTripSheetEntryKeys.all, 'penaltyType', vendorid],
    vehicleByVendorType: (vendorid, vehicletype) => [...dummyTripSheetEntryKeys.all, 'vehicleByVendorType', vendorid, vehicletype],
    incidentMaster: () => [...dummyTripSheetEntryKeys.all, 'incidentMaster'],
    tripRemark: () => [...dummyTripSheetEntryKeys.all, 'tripRemark'],
    tollidbyroute: (routeids) => [...dummyTripSheetEntryKeys.all, 'tollidbyroute', routeids],
    isAdmin: (userid) => [...dummyTripSheetEntryKeys.all, 'isAdmin', userid],
};

// --- Queries ---

export const useDummyRouteInfo = (routeids, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.routeInfo(routeids),
        queryFn: () => DummyTripSheetEntryService.GetDummyRouteInfo({ routeids }),
        enabled: !!routeids,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...options,
    });
};

export const useDummyEmpByRoute = (routeids, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.empByRoute(routeids),
        queryFn: () => DummyTripSheetEntryService.GetDummyEmpByRoute({ routeids }),
        enabled: !!routeids,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...options,
    });
};

export const useEmpSearch = (locationid, empidname, IsAdmin, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.empSearch(locationid, empidname),
        queryFn: () => DummyTripSheetEntryService.EmpSearch({ locationid, empidname, IsAdmin }),
        enabled: !!locationid && !!empidname,
        ...options,
    });
};

// Adding missing queries necessary for the forms
export const useVendorByFacility = (facilityid, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.vendorByFacility(facilityid),
        queryFn: () => DummyTripSheetEntryService.GetVendorByFacility({ facilityid }),
        enabled: !!facilityid,
        ...options,
    });
};

export const useVehicleType = (vendorid, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.vehicleType(vendorid),
        queryFn: () => DummyTripSheetEntryService.SelectVehicleType({ vendorid }),
        enabled: !!vendorid,
        ...options,
    });
};

export const useZoneByFac = (facilityid, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.zoneByFac(facilityid),
        queryFn: () => DummyTripSheetEntryService.SelectZoneByFac({ facilityid }),
        enabled: !!facilityid,
        ...options,
    });
};

export const useGuardDetails = (facilityid, searchvalue, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.guardDetails(facilityid, searchvalue),
        queryFn: () => DummyTripSheetEntryService.GetGuardDetails({ FacilityID: facilityid, SearchValue: searchvalue }),
        enabled: !!facilityid,
        ...options,
    });
};

export const useDriverDetails = (facid, type, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.driverDetails(facid, type),
        queryFn: () => DummyTripSheetEntryService.GetDriverDetails({ facid, type }),
        enabled: !!facid,
        ...options,
    });
};

export const useShiftByFacilityType = (facid, type, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.shiftByFacilityType(facid, type),
        queryFn: () => DummyTripSheetEntryService.GetShiftByFacilityType({ facid, type }),
        enabled: !!facid && !!type,
        ...options,
    });
};

export const useVehicleByVendorType = (vendorid, vehicletype, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.vehicleByVendorType(vendorid, vehicletype),
        queryFn: () => DummyTripSheetEntryService.GetVehicleByVendorType({ vendorid, vehicletype }),
        enabled: !!vendorid,
        ...options,
    });
};

export const usePenaltyType = (vendorid, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.penaltyType(vendorid),
        queryFn: () => DummyTripSheetEntryService.GetPenaltyType({ vendorid }),
        enabled: !!vendorid,
        ...options,
    });
};

export const useIncidentMaster = (options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.incidentMaster(),
        queryFn: () => DummyTripSheetEntryService.GetIncidentMaster({}),
        ...options,
    });
};

export const useTripRemark = (options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.tripRemark(),
        queryFn: () => DummyTripSheetEntryService.GetTripRemark({}),
        ...options,
    });
};

export const useTollMaster = (routeid, Employeeid, AllToll, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.tollMaster(routeid, Employeeid, AllToll),
        queryFn: () => DummyTripSheetEntryService.SelectTollMaster({ routeid, Employeeid, AllToll }),
        enabled: !!routeid,
        ...options,
    });
};

export const useTollidbyroute = (routeids, options = {}) => {
    return useQuery({
        queryKey: dummyTripSheetEntryKeys.tollidbyroute(routeids),
        queryFn: () => DummyTripSheetEntryService.SelectTollidbyroute({ routeids }),
        enabled: !!routeids,
        ...options,
    });
};

// --- Mutations ---

export const useSaveDummyRouteInfo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => DummyTripSheetEntryService.SaveDummyRouteInfo(params),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(dummyTripSheetEntryKeys.routeInfo(variables.routeId));
        },
    });
};

export const useCancelTripSheet = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => DummyTripSheetEntryService.CancelTripSheet(params),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(dummyTripSheetEntryKeys.routeInfo(variables.routeids));
            queryClient.invalidateQueries(dummyTripSheetEntryKeys.empByRoute(variables.routeids));
        },
    });
};

export const useAddEmpToDummyRoute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => DummyTripSheetEntryService.AddEmpToDummyRoute(params),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(dummyTripSheetEntryKeys.empByRoute(variables.routeId));
            queryClient.invalidateQueries(dummyTripSheetEntryKeys.routeInfo(variables.routeId));
        },
    });
};

export const useDeleteEmpFromRoute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => DummyTripSheetEntryService.DeleteEmpFromRoute(params),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(dummyTripSheetEntryKeys.empByRoute(variables.routeId));
            queryClient.invalidateQueries(dummyTripSheetEntryKeys.routeInfo(variables.routeId));
        },
    });
};

export const useSaveDummyRouteDetInfo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => DummyTripSheetEntryService.SaveDummyRouteDetInfo(params),
        onSuccess: (_, variables) => {
            const normalizeValue = (value) => (value == null ? "" : String(value).trim());
            const targetEmployeeId = normalizeValue(variables?.empid ?? variables?.employeeId);
            const targetEmpCode = normalizeValue(variables?.empCode);
            const targetStopNo = normalizeValue(variables?.stopNo);
            const resolveEmployeeId = (employee) =>
                employee?.employeeId ??
                employee?.employeeid ??
                employee?.EmployeeID ??
                employee?.EmployeeId ??
                employee?.id ??
                employee?.Id ??
                employee?.empId ??
                employee?.empid ??
                employee?.EmpId ??
                employee?.empID ??
                employee?.ID;

            queryClient.setQueryData(
                dummyTripSheetEntryKeys.empByRoute(variables.routeId),
                (currentEmployees) => {
                    if (!Array.isArray(currentEmployees)) {
                        return currentEmployees;
                    }

                    return currentEmployees.map((employee) => {
                        const employeeId = normalizeValue(resolveEmployeeId(employee));
                        const employeeCode = normalizeValue(employee?.empCode ?? employee?.employeeCode);
                        const stopNo = normalizeValue(employee?.stopNo);
                        const matchesEmployee =
                            (employeeId && targetEmployeeId && employeeId === targetEmployeeId) ||
                            (employeeCode && targetEmpCode && employeeCode === targetEmpCode) ||
                            (stopNo && targetStopNo && stopNo === targetStopNo);

                        if (!matchesEmployee) {
                            return employee;
                        }

                        return {
                            ...employee,
                            trackingStatus: variables?.trackingStatus ?? employee.trackingStatus,
                            trackingRemark: variables?.trackingRemark ?? employee.trackingRemark,
                        };
                    });
                }
            );

            queryClient.invalidateQueries({ queryKey: dummyTripSheetEntryKeys.empByRoute(variables.routeId) });
            queryClient.invalidateQueries({ queryKey: dummyTripSheetEntryKeys.routeInfo(variables.routeId) });
        },
    });
};

// --- Main Hook ---
export const useDummyTripSheetEntryLogic = (routeids) => {
    const { 
        data: routeInfoData, 
        isLoading: isRouteInfoLoading, 
        refetch: refetchRouteInfo,
        error: routeInfoError 
    } = useDummyRouteInfo(routeids, { enabled: !!routeids });

    const { 
        data: empData, 
        isLoading: isEmpLoading, 
        refetch: refetchEmpData,
        error: empError 
    } = useDummyEmpByRoute(routeids, { enabled: !!routeids });

    const saveRouteMutation = useSaveDummyRouteInfo();
    const cancelTripMutation = useCancelTripSheet();
    const addEmpMutation = useAddEmpToDummyRoute();
    const deleteEmpMutation = useDeleteEmpFromRoute();
    const saveEmpDetMutation = useSaveDummyRouteDetInfo();

    const refetchAll = useCallback(() => {
        refetchRouteInfo();
        refetchEmpData();
    }, [refetchEmpData, refetchRouteInfo]);

    const actions = useMemo(() => ({
        refetchAll,
        saveRouteInfo: saveRouteMutation.mutateAsync,
        cancelTripSheet: cancelTripMutation.mutateAsync,
        addEmpToRoute: addEmpMutation.mutateAsync,
        deleteEmpFromRoute: deleteEmpMutation.mutateAsync,
        saveEmpDetInfo: saveEmpDetMutation.mutateAsync,
    }), [
        addEmpMutation.mutateAsync,
        cancelTripMutation.mutateAsync,
        deleteEmpMutation.mutateAsync,
        refetchAll,
        saveEmpDetMutation.mutateAsync,
        saveRouteMutation.mutateAsync,
    ]);

    const data = useMemo(() => ({
        routeInfo: routeInfoData,
        employees: empData,
    }), [empData, routeInfoData]);

    const errors = useMemo(() => ({
        routeInfoError,
        empError
    }), [empError, routeInfoError]);

    return {
        data,
        isLoading: isRouteInfoLoading || isEmpLoading,
        actions,
        isMutating: saveRouteMutation.isPending || 
                    cancelTripMutation.isPending || 
                    addEmpMutation.isPending || 
                    deleteEmpMutation.isPending || 
                    saveEmpDetMutation.isPending,
        errors
    };
};
