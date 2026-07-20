import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../../services/api';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const myFeedbackKeys = {
    all: ['myFeedback'],
    list: ['myFeedback', 'list'],
    replies: (ticketNo) => ['myFeedback', 'replies', ticketNo],
    categories: (facId) => ['myFeedback', 'categories', facId],
    complaintTypes: (categoryId) => ['myFeedback', 'complaintTypes', categoryId],
    tripIds: (date, empId) => ['myFeedback', 'tripIds', date, empId],
    counts: (empId) => ['myFeedback', 'counts', empId],
};

export const useFeedbackListQuery = () => {
    return useQuery({
        queryKey: myFeedbackKeys.list,
        queryFn: async () => toArray(await apiService.Spr_sprSelectFeedBack({})),
        meta: { errorMessage: 'Failed to load feedback data. Please try again.' },
    });
};

// Read-only conversation thread of one ticket
export const useTicketRepliesQuery = (ticketNo) => {
    return useQuery({
        queryKey: myFeedbackKeys.replies(ticketNo),
        queryFn: async () => toArray(await apiService.Spr_sprSelectReply({ ticketNo })),
        enabled: !!ticketNo,
        staleTime: 1000 * 30,
        meta: { silent: true },
    });
};

export const useCategoriesQuery = (facId) => {
    return useQuery({
        queryKey: myFeedbackKeys.categories(facId),
        queryFn: async () => toArray(await apiService.Spr_GetComplaintCategory({ facID: facId })),
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });
};

// Cascades off the category chosen in the Raise Feedback form
export const useComplaintTypesQuery = (categoryId) => {
    return useQuery({
        queryKey: myFeedbackKeys.complaintTypes(categoryId),
        queryFn: async () =>
            toArray(await apiService.Spr_GetComplaintType({ ComplaintCategoryID: categoryId })),
        enabled: !!categoryId,
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });
};

// Cascades off the travel date chosen in the Raise Feedback form
export const useTripIdsQuery = (date, empId) => {
    return useQuery({
        queryKey: myFeedbackKeys.tripIds(date, empId),
        queryFn: async () =>
            toArray(await apiService.sprSearchRouteId({ raiseddate: date, empid: empId })),
        enabled: !!date,
        meta: { silent: true },
    });
};

// KPI cards — fixed one-year window ending today
export const useFeedbackCountsQuery = (empId) => {
    return useQuery({
        queryKey: myFeedbackKeys.counts(empId),
        queryFn: async () => {
            const endDate = new Date();
            const startDate = new Date(endDate);
            startDate.setFullYear(endDate.getFullYear() - 1);
            const sDate = `${startDate.toISOString().split('T')[0]} 00:00:00.000`;
            const eDate = `${endDate.toISOString().split('T')[0]} 00:00:00.000`;

            const resultArr = toArray(
                await apiService.getFeedbackcount({ empid: empId, sdate: sDate, edate: eDate })
            );
            const result = resultArr[0] || {};
            return {
                total: result.Totolfeedback || 0, // spelling exactly as in API response
                open: result.OpenCount || 0,
                closed: result.ClosedCount || 0,
            };
        },
        enabled: !!empId,
        meta: { silent: true },
    });
};

// ── Mutations (both refresh the list, counts, and open thread) ───────────────

export const useSubmitFeedbackMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => apiService.sprInsertFeedBackDetails(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: myFeedbackKeys.all });
        },
    });
};

export const useReopenTicketMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => apiService.Spr_sprInsertReopen(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: myFeedbackKeys.all });
        },
    });
};
