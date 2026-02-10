import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ManageRouteService from '../../services/compliance/ManageRouteService';

// Query Key Factory
export const manageRouteKeys = {
    all: ['manageRoute'],
    baseFacility: (userid) => ['manageRoute', 'baseFacility', userid],
    shifts: (facid, type) => ['manageRoute', 'shifts', facid, type],
    routes: (params) => ['manageRoute', 'routes', params],
    routeDetails: (routeId) => ['manageRoute', 'routeDetails', routeId],
    statistics: (params) => ['manageRoute', 'statistics', params],
    vendorSummary: (params) => ['manageRoute', 'vendorSummary', params],
    validateRoster: (params) => ['manageRoute', 'validateRoster', params],
    inputJson: (params) => ['manageRoute', 'inputJson', params],
};

// --- Queries ---

export const useBaseFacilityQuery = (userid) => {
    return useQuery({
        queryKey: manageRouteKeys.baseFacility(userid),
        queryFn: async () => {
            const response = await ManageRouteService.SelectBaseFacility({ userid });
            // Parse if string, otherwise return as is
            return typeof response === 'string' ? JSON.parse(response) : response;
        },
        enabled: !!userid,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useShiftsQuery = (facid, type) => {
    return useQuery({
        queryKey: manageRouteKeys.shifts(facid, type),
        queryFn: async () => {
            const response = await ManageRouteService.GetShiftByFacilityType({ facid, type });
            return typeof response === 'string' ? JSON.parse(response) : response;
        },
        enabled: !!facid && !!type,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useValidateRosterQuery = (params, options = {}) => {
    return useQuery({
        queryKey: manageRouteKeys.validateRoster(params),
        queryFn: async () => {
            const response = await ManageRouteService.sp_validateEmpRoster(params);

            // Handle various return formats of the validation SP
            let result;
            if (typeof response === 'string') {
                if (response.includes('[') && response.includes(']')) {
                    const parsed = JSON.parse(response);
                    result = parsed[0]?.Result;
                } else {
                    result = parseInt(response);
                }
            } else if (Array.isArray(response)) {
                result = response[0]?.Result;
            } else {
                result = response;
            }
            return result;
        },
        enabled: false, // Usually run manually via refetch
        ...options
    });
};

export const useRoutesQuery = (params, enabled = false) => {
    return useQuery({
        queryKey: manageRouteKeys.routes(params),
        queryFn: async () => {
            const response = await ManageRouteService.GetRoutesByOrder({
                ...params,
                Routeid: '',
                occ_seater: -2
            });
            return typeof response === 'string' ? JSON.parse(response) : response;
        },
        enabled: enabled,
        staleTime: 0, // Always fresh
    });
};

export const useRouteDetailsQuery = (routeId) => {
    return useQuery({
        queryKey: manageRouteKeys.routeDetails(routeId),
        queryFn: async () => {
            const response = await ManageRouteService.GetRoutesDetailsnew({
                RouteID: routeId,
                isAdd: 0
            });
            return typeof response === 'string' ? JSON.parse(response) : response;
        },
        enabled: !!routeId,
        staleTime: 1000 * 60, // 1 minute
    });
};

export const useRouteStatisticsQuery = (params, enabled = false) => {
    return useQuery({
        queryKey: manageRouteKeys.statistics(params),
        queryFn: async () => {
            const response = await ManageRouteService.GetRoutesStatistics(params);
            return typeof response === 'string' ? JSON.parse(response) : response;
        },
        enabled: enabled,
    });
};

export const useVendorSummaryQuery = (params, enabled = false) => {
    return useQuery({
        queryKey: manageRouteKeys.vendorSummary(params),
        queryFn: async () => {
            const response = await ManageRouteService.getvehtypeCountVendorwise(params);
            try {
                return typeof response === 'string' ? JSON.parse(response) : response;
            } catch {
                return [];
            }
        },
        enabled: enabled,
    });
};

// --- Mutations ---

export const useGenerateRoutesMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ inputParams, saveParams }) => {
            // 1. Get Input JSON
            const inputResponse = await ManageRouteService.GetRouteInputJson(inputParams);
            let routeInputData;
            try {
                routeInputData = typeof inputResponse === 'string' ? JSON.parse(inputResponse) : inputResponse;
            } catch (e) {
                throw new Error("Invalid route input data");
            }

            // 2. Generate Routes
            const generatedRouteJson = await ManageRouteService.generateRoutes(routeInputData);

            // 3. Save Routes
            const saveResponse = await ManageRouteService.save_routesMapBasedNew({
                ...saveParams,
                jsonstring: JSON.stringify(generatedRouteJson)
            });

            return saveResponse;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(manageRouteKeys.routes(variables.inputParams)); // Approximate invalidation
        }
    });
};

export const useRecalculateRoutesMutation = () => {
    return useMutation({
        mutationFn: async ({ recalculateParams, updateParams }) => {
            // 1. Get Input JSON for Recalc
            const inputResponse = await ManageRouteService.GetInputJsonRecalculate(recalculateParams);
            const inputJsonData = typeof inputResponse === 'string' ? JSON.parse(inputResponse) : inputResponse;

            if (!inputJsonData || !inputJsonData.routes || inputJsonData.routes.length === 0) {
                return { message: "No routes to recalculate" };
            }

            // 2. Recalculate
            const recalculatedJson = await ManageRouteService.recalculateRoutes(inputJsonData);

            // 3. Update
            const response = await ManageRouteService.updateRouteMapbased({
                ...updateParams,
                jsonstring: JSON.stringify(recalculatedJson)
            });

            return response;
        }
    });
};

export const useSplitRouteMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageRouteService.SplitRoute(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.all });
        }
    });
};

export const useMergeRouteMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageRouteService.MergeRoute(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.all });
        }
    });
};

export const useDeleteEmployeeMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageRouteService.DeleteEmployeeFromRoute(params),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(manageRouteKeys.routeDetails(variables.RouteID));
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.routes }); // Invalidate list broadly
        }
    });
};

export const useAddEmployeeMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageRouteService.AddEmpToRoute(params),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(manageRouteKeys.routeDetails(variables.routeId));
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.routes });
        }
    });
};

export const useMoveEmployeeMutation = () => { // UpdateCutPaste
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageRouteService.UpdateCutPaste(params),
        onSuccess: (_, variables) => {
            // Invalidate source and target routes (approximate)
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.all });
        }
    });
};

export const useAutoVendorAllocationMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageRouteService.AutoVendorAllocationNew(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.vendorSummary });
        }
    });
};

export const useFinalizeRouteMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageRouteService.PushRouteToDashbaord(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.all });
        }
    });
};

export const useUnlockRoutesMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageRouteService.BlockTransport(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.routes });
        }
    });
};
