import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toastService } from '../../services/toastService';
import ManageRouteService from '../../services/compliance/ManageRouteService';
import {
    useBaseFacilityQuery,
    useShiftsQuery,
    useRoutesQuery,
    useRouteStatisticsQuery,
    useVendorSummaryQuery,
    manageRouteKeys,
    useDeleteEmployeeMutation,
    useSplitRouteMutation,
    useMergeRouteMutation,
    useMoveEmployeeMutation,
    useUnlockRoutesMutation
} from './useManageRouteQueries';

/**
 * useManageRouteLogic
 * 
 * Controller hook that separates the business logic from the UI.
 * Manages:
 * 1. Filter State (Date, Facility, Shift)
 * 2. Data Fetching (via TanStack Query hooks)
 * 3. User Actions (Search, Delete, Merge, etc.)
 */
const useManageRouteLogic = () => {
    const queryClient = useQueryClient();
    const userID = sessionStorage.getItem("ID");

    // --- State: Filters ---
    const [filters, setFilters] = useState({
        sDate: new Date().toISOString().split('T')[0],
        facilityId: null,
        tripType: 'P', // Default Pick
        shifts: [],
        orderBy: 'Routeno',
        direction: 'ASC'
    });

    const [searchParams, setSearchParams] = useState(null); // Committed search criteria
    const [isSearchEnabled, setIsSearchEnabled] = useState(false);

    // --- State: UI Toggles ---
    const [uiState, setUiState] = useState({
        showOffcanvas: false,
        selectedRouteId: null,
        showGenerateDialog: false,
        isSelectionHeld: false,
        selectedEmployees: new Set(), // For multi-select operations
    });

    // --- Data Fetching ---

    // 1. Facilities (Load on mount)
    const { data: facilities } = useBaseFacilityQuery(userID);

    // 2. Shifts (Dependent on Facility & TripType)
    const { data: availableShifts } = useShiftsQuery(filters.facilityId, filters.tripType);

    // 3. Main Route Data (Depends on COMMANDED searchParams + Live Sort)
    const routesQueryParams = useMemo(() => {
        if (!searchParams) return null;
        return {
            sDate: searchParams.sDate,
            eDate: searchParams.sDate,
            FacilityID: searchParams.facilityId,
            TripType: searchParams.tripType,
            Shifttimes: searchParams.shifts,
            OrderBy: filters.orderBy,  // Allow sorting on current result
            Direction: filters.direction // Allow sorting on current result
        };
    }, [searchParams, filters.orderBy, filters.direction]);

    // Query Configuration
    const {
        data: routes,
        isLoading: isRoutesLoading,
        isFetching: isRoutesFetching,
        refetch: searchRoutes
    } = useRoutesQuery(routesQueryParams, isSearchEnabled && !!routesQueryParams);

    // 4. Statistics & Vendor Summary
    const { data: stats } = useRouteStatisticsQuery(routesQueryParams, isSearchEnabled && !!routesQueryParams);
    const { data: vendorSummary } = useVendorSummaryQuery(routesQueryParams, isSearchEnabled && !!routesQueryParams);

    // --- Mutations ---
    const deleteEmployeeMutation = useDeleteEmployeeMutation();
    const splitRouteMutation = useSplitRouteMutation();
    const mergeRouteMutation = useMergeRouteMutation();
    const moveEmployeeMutation = useMoveEmployeeMutation();
    const unlockRoutesMutation = useUnlockRoutesMutation();

    // --- Actions ---

    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        // Note: We no longer disable search here. 
        // Changing filters updates UI but does NOT trigger refetch until "Search" is clicked.
        // Sorting (orderBy/direction) DOES trigger refetch via useMemo dependency.
    }, []);

    const handleSearch = useCallback(async () => {
        if (!filters.facilityId || filters.shifts.length === 0) {
            toastService.warn("Please select Facility and Shifts");
            return;
        }

        try {
            // 1. Validate
            const validateResponse = await ManageRouteService.sp_validateEmpRoster({
                facilityid: filters.facilityId,
                sDate: filters.sDate,
                triptype: filters.tripType,
                shifttime: filters.shifts
            });

            // Parse response (handling [ { Result: 1 } ] or "1" or 1)
            let result;
            if (typeof validateResponse === "string") {
                if (validateResponse.includes("[") && validateResponse.includes("]")) {
                    const parsed = JSON.parse(validateResponse);
                    result = parsed[0]?.Result;
                } else {
                    result = parseInt(validateResponse);
                }
            } else if (Array.isArray(validateResponse)) {
                result = validateResponse[0]?.Result;
            } else {
                result = validateResponse;
            }

            // 2. Handle Result
            if (result === 1) {
                // Success: Commit filters to searchParams
                setSearchParams({ ...filters });
                setIsSearchEnabled(true);
                setUiState(prev => ({ ...prev, showGenerateDialog: false }));

                // Trigger refetches
                setTimeout(() => {
                    searchRoutes();
                    queryClient.invalidateQueries(manageRouteKeys.statistics(routesQueryParams));
                    queryClient.invalidateQueries(manageRouteKeys.vendorSummary(routesQueryParams));
                }, 0);

                toastService.success("Route data loaded successfully.");

            } else if (result === 2) {
                // Roster not available
                setIsSearchEnabled(false);
                setSearchParams(null); // Clear data
                setUiState(prev => ({ ...prev, showGenerateDialog: false }));
                toastService.error("The Roster is not available.");
            } else if (result === 0) {
                // Roster available but paths not generated -> Show Dialog
                setIsSearchEnabled(false);
                setSearchParams(null); // Clear data
                setUiState(prev => ({ ...prev, showGenerateDialog: true }));
            } else {
                toastService.error("Invalid validation response");
            }

        } catch (error) {
            console.error("Search validation error", error);
            toastService.error("Failed to validate roster.");
        }
    }, [filters, searchRoutes, queryClient, routesQueryParams]);

    const handleDeleteEmployee = useCallback(async (employee, routeId) => {
        try {
            await deleteEmployeeMutation.mutateAsync({
                sDate: filters.sDate,
                FacilityID: filters.facilityId,
                TripType: filters.tripType,
                Shifttimes: filters.shifts,
                RouteID: routeId,
                EmpID: employee.id || employee.empID,
                uname: userID
            });
            toastService.success(`Employee removed from route ${routeId}`);
        } catch (error) {
            toastService.error("Failed to delete employee");
        }
    }, [filters, deleteEmployeeMutation, userID]);


    return {
        // Data exposed to View
        data: {
            facilities: Array.isArray(facilities) ? facilities.map(f => ({ label: f.facility, value: f.Id })) : [],
            shifts: Array.isArray(availableShifts) ? availableShifts.map(s => ({ label: s.shiftTime, value: s.shiftTime })) : [],
            routes: routes || [],
            stats: stats || [],
            vendorSummary: vendorSummary || [],
            isLoading: isRoutesLoading || isRoutesFetching
        },

        // Current State exposed to View
        state: {
            filters,
            ui: uiState
        },

        // Actions exposed to View
        actions: {
            setFilter: handleFilterChange,
            search: handleSearch,
            deleteEmployee: handleDeleteEmployee,
            setUiState: (updates) => setUiState(prev => ({ ...prev, ...updates })),
            // Expose mutations if needed for complex UI handling
            mutations: {
                split: splitRouteMutation,
                merge: mergeRouteMutation,
                move: moveEmployeeMutation,
                unlock: unlockRoutesMutation
            }
        }
    };
};

export default useManageRouteLogic;
