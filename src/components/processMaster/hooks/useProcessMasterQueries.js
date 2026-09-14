import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProcessMasterService from '../../../services/compliance/ProcessMasterService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const processMasterKeys = {
    all: ['processMaster'],
    processes: (facilityId) => ['processMaster', 'processes', facilityId],
    subProcesses: (processId) => ['processMaster', 'subProcesses', processId],
};

export const useProcessesQuery = (facilityId) => {
    return useQuery({
        queryKey: processMasterKeys.processes(facilityId),
        queryFn: async () => toArray(await ProcessMasterService.GetProcessNew(facilityId)),
        enabled: !!facilityId,
        meta: { errorMessage: 'Error fetching processes' },
    });
};

// Sub-process list of the process opened in the sidebar — a live observer,
// so the mutations' invalidation below refreshes it automatically
export const useSubProcessesQuery = (processId) => {
    return useQuery({
        queryKey: processMasterKeys.subProcesses(processId),
        queryFn: async () => toArray(await ProcessMasterService.getSubProcess(processId)),
        enabled: !!processId,
        staleTime: 1000 * 30,
        meta: { errorMessage: 'Error fetching sub-processes' },
    });
};

// ── Mutations (all invalidate both lists) ────────────────────────────────────

export const useAddProcessMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ processName, facilityId }) =>
            ProcessMasterService.addProcess(processName, facilityId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: processMasterKeys.all });
        },
    });
};

export const useUpdateProcessMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, processName }) => ProcessMasterService.updateProcess(id, processName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: processMasterKeys.all });
        },
    });
};

export const useAddSubProcessMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ processId, subProcessName }) =>
            ProcessMasterService.addSubProcess(processId, subProcessName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: processMasterKeys.all });
        },
    });
};

export const useUpdateSubProcessMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ processId, subProcessName, subProcessId }) =>
            ProcessMasterService.updateSubProcess(processId, subProcessName, subProcessId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: processMasterKeys.all });
        },
    });
};
