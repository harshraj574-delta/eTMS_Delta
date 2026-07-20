import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GuardMasterService from '../../../services/compliance/GuardMasterService';
import parseMaybeJson from '../../../services/parseMaybeJson';

// GuardMasterService endpoints answer axios-style: the JSON string lives in response.data
const toArray = (response) => {
    const d = parseMaybeJson(response?.data);
    return Array.isArray(d) ? d : [];
};

export const guardMasterKeys = {
    all: ['guardMaster'],
    facilities: (userId) => ['guardMaster', 'facilities', userId],
    guards: (facilityId) => ['guardMaster', 'guards', facilityId],
    documentTypes: ['guardMaster', 'documentTypes'],
    newGuardId: ['guardMaster', 'newGuardId'],
};

export const useFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: guardMasterKeys.facilities(userId),
        queryFn: async () => toArray(await GuardMasterService.getFacilitiesByUserId(userId)),
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load facilities. Please try again.' },
    });
};

// The grid is read-only (editing happens on a detached selectedGuard copy),
// so a reactive query is safe — the save/update mutations refresh it.
export const useGuardsQuery = (facilityId) => {
    return useQuery({
        queryKey: guardMasterKeys.guards(facilityId),
        queryFn: async () =>
            toArray(
                await GuardMasterService.getGuardMasterDetails({
                    FacilityID: facilityId,
                    SearchValue: '',
                })
            ),
        enabled: !!facilityId,
        meta: { errorMessage: 'Failed to fetch guard details.' },
    });
};

export const useDocumentTypesQuery = () => {
    return useQuery({
        queryKey: guardMasterKeys.documentTypes,
        queryFn: async () => {
            const parsed = toArray(await GuardMasterService.SPR_DocumentDetails({ type: 'G' }));
            return parsed.map((item) => ({ name: item.DocumentType, value: item.Id }));
        },
        staleTime: 1000 * 60 * 10,
        meta: { silent: true },
    });
};

// Server-generated temp ID — must hit the server on every Add click
export const fetchNewGuardId = (queryClient, params) =>
    queryClient.fetchQuery({
        queryKey: guardMasterKeys.newGuardId,
        queryFn: async () => toArray(await GuardMasterService.GetNewGuardID(params)),
        staleTime: 0,
        gcTime: 0,
        meta: { silent: true },
    });

export const useSaveGuardMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => GuardMasterService.SaveGuard(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: guardMasterKeys.all });
        },
    });
};

export const useUpdateGuardMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => GuardMasterService.UpdateGuard(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: guardMasterKeys.all });
        },
    });
};
