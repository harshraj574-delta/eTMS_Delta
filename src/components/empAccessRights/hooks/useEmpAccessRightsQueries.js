import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmpAccessRightsService from '../../../services/compliance/EmpAccessRightsService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const empAccessRightsKeys = {
    all: ['empAccessRights'],
    menuAccessCounts: (locationId) => ['empAccessRights', 'menuAccessCounts', locationId],
    empSearch: (locationId, text) => ['empAccessRights', 'empSearch', locationId, text],
    mainMenus: (isAdmin) => ['empAccessRights', 'mainMenus', isAdmin],
    userRights: (empId) => ['empAccessRights', 'userRights', empId],
    menuUsers: (locationId, parentMenuId) => ['empAccessRights', 'menuUsers', locationId, parentMenuId],
    accessLog: (empId, from, to) => ['empAccessRights', 'accessLog', empId, from, to],
};

// Access-count cards: reactive so the save/copy mutations refresh them
export const useMenuAccessCountsQuery = (locationId) => {
    return useQuery({
        queryKey: empAccessRightsKeys.menuAccessCounts(locationId),
        queryFn: async () =>
            toArray(await EmpAccessRightsService.GetMenuAccessDetails({ locationid: locationId })),
        staleTime: 1000 * 60,
        meta: { errorMessage: 'Error loading menu access data' },
    });
};

// ── Imperative reads (searches return picklists; rights become editable) ──────

export const fetchEmpSearch = (queryClient, { locationId, text, isAdmin }) =>
    queryClient.fetchQuery({
        queryKey: empAccessRightsKeys.empSearch(locationId, text),
        queryFn: async () =>
            toArray(
                await EmpAccessRightsService.EmpSearch({
                    locationid: locationId,
                    empidname: text,
                    IsAdmin: isAdmin,
                })
            ),
        staleTime: 0,
        meta: { silent: true },
    });

// The full rights tree for one employee: main menus (cached 5 min across
// selections) + a per-menu rights fan-out. Result seeds the editable
// checkbox tree, so this must never auto-refetch.
export const fetchUserRightsBundle = async (queryClient, { empId, isAdmin }) => {
    const menusList = await queryClient.fetchQuery({
        queryKey: empAccessRightsKeys.mainMenus(isAdmin),
        queryFn: async () =>
            toArray(await EmpAccessRightsService.SelectMainMenu({ IsAdmin: isAdmin })),
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });

    return queryClient.fetchQuery({
        queryKey: empAccessRightsKeys.userRights(empId),
        queryFn: async () => {
            const rightsResponses = await Promise.all(
                menusList.map((menu) =>
                    EmpAccessRightsService.GetUserRights({ empid: empId, menuid: menu.MenuID })
                )
            );
            const allRights = rightsResponses.flatMap((response) => toArray(response));
            return { menusList, allRights };
        },
        staleTime: 0,
        gcTime: 0,
        meta: { silent: true },
    });
};

export const fetchMenuUsers = (queryClient, { locationId, parentMenuId }) =>
    queryClient.fetchQuery({
        queryKey: empAccessRightsKeys.menuUsers(locationId, parentMenuId),
        queryFn: async () =>
            toArray(
                await EmpAccessRightsService.GetMenuUsersDetails({
                    locationid: locationId,
                    parentmenuid: parentMenuId,
                })
            ),
        staleTime: 1000 * 30,
        meta: { silent: true },
    });

export const fetchAccessLog = (queryClient, { empId, from, to }) =>
    queryClient.fetchQuery({
        queryKey: empAccessRightsKeys.accessLog(empId, from, to),
        queryFn: async () =>
            toArray(
                await EmpAccessRightsService.GetUserRightLogEmpWise({
                    SDate: from,
                    EDate: to,
                    FacilityId: 0,
                    Empid: empId,
                })
            ),
        staleTime: 0,
        meta: { silent: true },
    });

// ── Mutations (both change who-has-what, so the cards refresh) ───────────────

export const useSetUserRightsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => EmpAccessRightsService.SetUserRights(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: empAccessRightsKeys.all });
        },
    });
};

export const useCopyAccessMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => EmpAccessRightsService.CopyAccess(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: empAccessRightsKeys.all });
        },
    });
};
