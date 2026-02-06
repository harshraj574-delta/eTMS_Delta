import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import { toastService } from "../services/toastService";

// Helper to safely parse JSON if it's a string
const safeParse = (data) => {
    if (typeof data === "string") {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("JSON parse error:", e);
            return [];
        }
    }
    return data;
};

// Query Keys
export const myScheduleKeys = {
    all: ["mySchedule"],
    lockDetails: (facID) => ["mySchedule", "lockDetails", facID],
    facilities: (empid) => ["mySchedule", "facilities", empid],
    managers: (backupmgrid) => ["mySchedule", "managers", backupmgrid],
    processes: (empid, type) => ["mySchedule", "processes", empid, type],
    mgrAssociate: (mgrId, processId) => [
        "mySchedule",
        "mgrAssociate",
        mgrId,
        processId,
    ],
    mgrSchedule: (mgrid, sDate) => ["mySchedule", "mgrSchedule", mgrid, sDate],
    shiftData: (facilityId, type, weekday, processId) => [
        "mySchedule",
        "shiftData",
        facilityId,
        type,
        weekday,
        processId,
    ],
    employeeSchedule: (empid, sDate) => [
        "mySchedule",
        "employeeSchedule",
        empid,
        sDate,
    ],
    pickShiftTimes: (facilityId, sDate, empid) => [
        "mySchedule",
        "pickShiftTimes",
        facilityId,
        sDate,
        empid,
    ],
    dropShiftTimes: (facilityId, sDate, empid, processId) => [
        "mySchedule",
        "dropShiftTimes",
        facilityId,
        sDate,
        empid,
        processId,
    ],
    myTrips: (empid, sDate, eDate) => [
        "mySchedule",
        "myTrips",
        empid,
        sDate,
        eDate,
    ],
    routeDetails: (routeid, sDate) => [
        "mySchedule",
        "routeDetails",
        routeid,
        sDate,
    ],
};

// -- Queries --

export const useLockDetailsQuery = (facID) => {
    return useQuery({
        queryKey: myScheduleKeys.lockDetails(facID),
        queryFn: async () => {
            const response = await apiService.GetLockDetails({ facID });
            // The service already parses JSON: "return JSON.parse(response.data);"
            // But let's be safe if it changes or if response is array
            return response;
        },
        enabled: !!facID,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useFacilityDetailsQuery = (empid) => {
    return useQuery({
        queryKey: myScheduleKeys.facilities(empid),
        queryFn: async () => {
            const response = await apiService.SelectFacilityByGroup({ empid });
            return response; // Already parsed in service
        },
        // enabled: empid !== undefined, // empid can be 0 or -1, so allow numbers
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
};

export const useManagersQuery = (backupmgrid) => {
    return useQuery({
        queryKey: myScheduleKeys.managers(backupmgrid),
        queryFn: async () => {
            return await apiService.GetBackupMgrId({ backupmgrid });
        },
        enabled: !!backupmgrid,
        staleTime: 5 * 60 * 1000,
    });
};

export const useProcessesQuery = (empid, type) => {
    return useQuery({
        queryKey: myScheduleKeys.processes(empid, type),
        queryFn: async () => {
            return await apiService.GetSpocAssignedProcess({ empid, type });
        },
        enabled: !!empid && !!type,
        staleTime: 5 * 60 * 1000,
    });
};

export const useMgrAssociateQuery = (mgrId, processId) => {
    return useQuery({
        queryKey: myScheduleKeys.mgrAssociate(mgrId, processId),
        queryFn: async () => {
            return await apiService.GetMgrAssociate({ mgrId, ProcessId: processId });
        },
        enabled: !!mgrId && !!processId,
        staleTime: 30 * 1000, // 30 seconds
    });
};

export const useMgrScheduleQuery = (mgrid, sDate) => {
    return useQuery({
        queryKey: myScheduleKeys.mgrSchedule(mgrid, sDate),
        queryFn: async () => {
            return await apiService.GetMgrSchedule({ mgrid, sdate: sDate });
        },
        enabled: !!mgrid && !!sDate,
        staleTime: 0, // Always fresh as per request (or small)
    });
};

export const useShiftDataQuery = (facilityId, type, weekday, processId) => {
    return useQuery({
        queryKey: myScheduleKeys.shiftData(facilityId, type, weekday, processId),
        queryFn: async () => {
            return await apiService.GetShiftsbyDays({
                facilityid: facilityId,
                type,
                weekday,
                ProcessId: processId,
            });
        },
        enabled: !!facilityId && !!processId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useEmployeeScheduleQuery = (empid, sDate) => {
    return useQuery({
        queryKey: myScheduleKeys.employeeSchedule(empid, sDate),
        queryFn: async () => {
            const response = await apiService.GetOneEmployeeSchedule({
                empid,
                sdate: sDate,
            });
            // The service does handle parsing sometimes in comments, but component did manual parsing. 
            // Component logic:
            // if (typeof response === "string") try parse
            // if (!Array.isArray(scheduleData)) scheduleData = [scheduleData]

            let data = safeParse(response);
            if (!Array.isArray(data)) {
                data = data ? [data] : [];
            }
            return data;
        },
        enabled: !!empid && !!sDate,
        staleTime: 0,
    });
};

export const usePickShiftTimeQuery = (facilityId, sDate, empid) => {
    return useQuery({
        queryKey: myScheduleKeys.pickShiftTimes(facilityId, sDate, empid),
        queryFn: async () => {
            const response = await apiService.GetPickShiftTime({
                facilityid: facilityId,
                sdate: sDate,
                empid,
                processid: "0",
            });
            return safeParse(response);
        },
        enabled: !!facilityId && !!sDate && !!empid,
    });
};

export const useDropShiftTimeQuery = (facilityId, sDate, empid, processId) => {
    return useQuery({
        queryKey: myScheduleKeys.dropShiftTimes(facilityId, sDate, empid, processId),
        queryFn: async () => {
            const response = await apiService.GetDropShiftTime({
                facilityid: facilityId,
                sdate: sDate,
                callfrom: "A",
                empid,
                processid: processId || "0",
            });
            return safeParse(response);
        },
        enabled: !!facilityId && !!sDate && !!empid,
    });
};

export const useMyTripsQuery = (empid, sDate, eDate) => {
    return useQuery({
        queryKey: myScheduleKeys.myTrips(empid, sDate, eDate),
        queryFn: async () => {
            const response = await apiService.GetMyTrips({
                empid,
                sDate,
                eDate,
            });
            return safeParse(response);
        },
        enabled: !!empid && !!sDate && !!eDate,
    });
};

export const useRouteDetailsQuery = (routeid, sDate) => {
    return useQuery({
        queryKey: myScheduleKeys.routeDetails(routeid, sDate),
        queryFn: async () => {
            const response = await apiService.GetMyRoutesDetails({
                empid: 0,
                sDate,
                triptype: "",
                routeid,
            });
            return safeParse(response);
        },
        enabled: !!routeid && !!sDate,
    });
};

// -- Mutations --

export const useInsertNewScheduleMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.InsertNewSchedule,
        onSuccess: (response, variables) => {
            // Handling the "9 hours" message logic which was in the component
            if (
                response &&
                Array.isArray(response) &&
                response.length > 0 &&
                response[0].res2?.includes(
                    "Roster insert failed, due to difference between login and logout time is less than 9 hours."
                )
            ) {
                toastService.error(
                    "Roster insertion failed: login and logout time must differ by at least 9 hours."
                );
                return; // Don't invalidate if failed logic
            }

            toastService.success("Record saved!");

            // Invalidate MgrSchedule (and Associate list maybe?)
            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === "mySchedule" &&
                    (query.queryKey[1] === "mgrSchedule" || query.queryKey[1] === "mgrAssociate")
            });
        },
        onError: (error) => {
            console.error("Error saving schedule:", error);
            toastService.error("Failed to save the schedule. Please try again later.");
        }
    });
};

export const useUpdateEmpScheduleMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.UpdateEmpSchedule,
        onSuccess: (response, variables) => {
            // Check for specific error object return if any (Component logic slightly diff)
            // logic: if (response) success else error.
            // MySchedule.jsx lines 804-834 handles parsing explicitly.
            // apiService handles parsing: line 241: return JSON.parse(response.data);

            let data = safeParse(response);
            if (!Array.isArray(data)) {
                data = [data];
            }

            // Check for specific failure flags in the response
            // Example response: "[{\"IsLogInProcessed\":-1,\"IsLogOutProcessed\":-1,\"RESULT\":1,\"WorkingHour\":9}]"
            if (data && data.length > 0) {
                const result = data[0];
                const isLoginFailed = result.IsLogInProcessed === -1;
                const isLogoutFailed = result.IsLogOutProcessed === -1;

                if (isLoginFailed || isLogoutFailed) {
                    // Determine specific error message
                    let errorMessage = "Update failed.";
                    if (isLoginFailed && isLogoutFailed) {
                        errorMessage = "Both Login and Logout shift updates failed.";
                    } else if (isLoginFailed) {
                        errorMessage = "Login shift update failed.";
                    } else if (isLogoutFailed) {
                        errorMessage = "Logout shift update failed.";
                    }

                    if (result.res2) { // Fallback to res2 if available
                        errorMessage += ` ${result.res2}`;
                    }

                    // Show error and throw to trigger onError/catch block in component
                    toastService.error(errorMessage);
                    throw new Error(errorMessage);
                }

                if (result.res2 && result.res2.includes("failed")) {
                    toastService.error(result.res2);
                    throw new Error(result.res2);
                }
            }

            toastService.success("Schedule updated successfully!");

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: myScheduleKeys.mgrSchedule(variables.mgrid) }); // We don't have mgrid in variables usually, but we want to invalidate *current* mgr schedule
            // Better to invalidate all mgrSchedule or just active ones
            queryClient.invalidateQueries({
                predicate: (query) => query.queryKey[0] === "mySchedule" && query.queryKey[1] === "mgrSchedule"
            });

            queryClient.invalidateQueries({
                queryKey: myScheduleKeys.employeeSchedule(variables.empID, variables.StartDate),
            });
        },
        onError: (error) => {
            // If we threw the error above, it is already toasted.
            // If it's a network error, we want to toast it.
            // To avoid double toasts, we can check if it's one of ours.
            // Simplified: The throw above goes to mutateAsync().catch() in component? 
            // Actually onError in useMutation fires if mutationFn fails OR if onSuccess throws?
            // Wait, if onSuccess throws, does onError fire? 
            // According to React Query docs: "onSuccess" fires after mutationFn. If onSuccess throws, it might bubble up.
            // Actually, throwing in onSuccess DOES NOT trigger onError of the same mutation options.
            // UseMutation callbacks: onMutate -> mutationFn -> onSuccess/onError -> onSettled.
            // If onSuccess throws, it bubbles to the caller of mutate().
            // So logic above is safe. "toastService.error" is called. Caller catches it.
            // But if mutationFn fails (network), onError fires.
            // So we need to ensure we don't duplicate.

            // For network errors etc:
            if (!error.message || (error.message && !error.message.includes("update failed") && !error.message.includes("Update failed"))) {
                toastService.error("Error updating schedule: " + error.message);
            }
        },
    });
};

export const useCancelTripMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: apiService.CancelTrip,
        onSuccess: (response, variables) => {
            toastService.success("Trip cancelled successfully.");

            queryClient.invalidateQueries({
                predicate: (query) => query.queryKey[0] === "mySchedule" && query.queryKey[1] === "mgrSchedule"
            });
            queryClient.invalidateQueries({
                predicate: (query) => query.queryKey[0] === "mySchedule" && query.queryKey[1] === "myTrips"
            });
        },
        onError: (error) => {
            toastService.error("Failed to cancel the trip: " + error.message);
        },
    });
};
