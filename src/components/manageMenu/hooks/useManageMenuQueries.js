import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ManageMenuService from '../../../services/compliance/ManageMenuService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    if (Array.isArray(d)) return d;
    return d ? [d] : [];
};

// The insert/update endpoints answer with { result | Result | RESULT | status | Status }
// in various casings; normalize to a string ("0" = duplicate, "1" = ok) or null.
export const extractMenuResult = (resp) => {
    let parsed = parseMaybeJson(resp);
    if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];
    const result =
        parsed?.result ??
        parsed?.Result ??
        parsed?.RESULT ??
        parsed?.status ??
        parsed?.Status ??
        null;
    return result === null ? null : String(result);
};

export const manageMenuKeys = {
    all: ['manageMenu'],
    mainMenu: (isAdmin) => ['manageMenu', 'mainMenu', isAdmin],
    subMenus: (menuId) => ['manageMenu', 'subMenus', menuId],
};

export const useMainMenuQuery = (isAdmin = 'Y') => {
    return useQuery({
        queryKey: manageMenuKeys.mainMenu(isAdmin),
        queryFn: async () => toArray(await ManageMenuService.SelectMainMenu({ IsAdmin: isAdmin })),
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load the menu data. Please try again.' },
    });
};

// Reactive per-menu submenu list. Expanded rows are live observers, so the
// mutations' invalidation below refreshes them automatically after add/
// edit/delete — no manual cache bookkeeping in the component.
export const useSubMenusQuery = (menuId) => {
    return useQuery({
        queryKey: manageMenuKeys.subMenus(String(menuId)),
        queryFn: async () => toArray(await ManageMenuService.SelectSubMenu({ menuid: menuId })),
        enabled: !!menuId,
        staleTime: 1000 * 30,
        meta: { errorMessage: 'Could not load submenu data' },
    });
};

// ── Mutations (menu + submenu share the same endpoints) ──────────────────────

export const useInsertMenuMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageMenuService.InsertMenu(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageMenuKeys.all });
        },
    });
};

export const useUpdateMenuMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageMenuService.UpdateMenu(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageMenuKeys.all });
        },
    });
};

export const useDeleteMenuMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => ManageMenuService.DeleteMenu(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: manageMenuKeys.all });
        },
    });
};
