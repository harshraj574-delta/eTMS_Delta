import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiService } from '../services/api';
import { isEqual } from 'lodash';
import { USES_GATEWAY } from '../services/http/apiClient';
import { canOpenPage, fetchMyAccess, hasPermission } from '../services/auth/myAccess';

const menuPaths = (menuItems) =>
    menuItems
        .map((item) => (item.MenuURL || "").trim().replace(/^\/+/, ""))
        .filter((path) => path !== "" && path !== "#");

const useSessionStore = create(
    persist(
        (set, get) => ({
            user: null,
            allowedPaths: [],
            menuItems: [],
            isAuthenticated: false,
            lastValidationTime: 0,
            // Through etms-api: what the server says this user may do (GET /api/v1/me).
            // Decides page access and permission-gated buttons; null on the legacy path.
            access: null,

            login: (userData, menuItems, access = null) => {
                set({
                    user: userData,
                    allowedPaths: menuPaths(menuItems),
                    menuItems: menuItems,
                    access,
                    isAuthenticated: true,
                    lastValidationTime: Date.now(),
                });
            },

            /** UI check only; etms-api enforces every call itself. */
            hasPermission: (permission) => hasPermission(get().access, permission),

            updateDisclaimerStatus: (status) => {
                const { user } = get();
                if (user) {
                    set({ user: { ...user, DisclaimerStatus: status } });
                }
            },

            // ── Guided tour state ──────────────────────────────────────────────
            // tourPending: true while the tour is in progress (first login or replay).
            // tourPage: which section's steps to show ('profile' | 'schedule').
            // Stored in sessionStorage so it survives in-SPA navigation and page
            // refreshes within the same browser tab. Cleared automatically on logout
            // because logout() calls sessionStorage.clear().
            tourPending: false,
            tourPage: 'profile',

            // Called in App.jsx after the user accepts the disclaimer for the first time.
            startTour: () => set({ tourPending: true, tourPage: 'profile' }),

            // Called by useProfileTour when the user moves to the next page.
            advanceTour: (page) => set({ tourPage: page }),

            // Called when the tour finishes or the user explicitly closes it.
            completeTour: () => set({ tourPending: false, tourPage: 'profile' }),

            // Allows any component (e.g. Help menu) to replay the tour on demand.
            replayTour: () => set({ tourPending: true, tourPage: 'profile' }),
            // ──────────────────────────────────────────────────────────────────

            logout: () => {
                set({
                    user: null,
                    allowedPaths: [],
                    menuItems: [],
                    access: null,
                    isAuthenticated: false,
                    lastValidationTime: 0,
                    tourPending: false,
                    tourPage: 'profile',
                });
                if (import.meta.env.VITE_AUTH_MODE === 'cognito') {
                    // Revoke the refresh token at Cognito before the local session is wiped.
                    import('../services/auth/cognitoAuth')
                        .then((m) => m.cognitoSignOut())
                        .finally(() => sessionStorage.clear());
                } else {
                    sessionStorage.clear();
                }
            },

            checkAccess: (currentPath) => {
                const { allowedPaths, access } = get();
                if (USES_GATEWAY) return canOpenPage(access, currentPath);
                const cleanCurrentPath = (currentPath || "").trim().replace(/^\/+/, "");
                return allowedPaths.includes(cleanCurrentPath);
            },

            refreshRights: async (force = false) => {
                const { user, allowedPaths: currentAllowedPaths, lastValidationTime } = get();

                if (!user) return;

                // Optimization: If validated recently (e.g., within 2 seconds), skip API call unless forced
                const now = Date.now();
                if (!force && now - lastValidationTime < 2000) {
                    return;
                }

                try {
                    const userId = user.ID || user.EmpId || user.UserName;
                    if (!userId) return;

                    if (USES_GATEWAY) {
                        // The sidebar still comes from the menu list; access from etms-api.
                        const [menuItems, access] = await Promise.all([
                            apiService.Spr_GetMenuItem_V2({ userID: userId }),
                            fetchMyAccess(),
                        ]);
                        set({ allowedPaths: menuPaths(menuItems), menuItems, access, lastValidationTime: now });
                        return;
                    }

                    const menuItems = await apiService.Spr_GetMenuItem_V2({ userID: userId });

                    const newAllowedPaths = menuPaths(menuItems);

                    // Only update store if paths have changed
                    if (!isEqual(newAllowedPaths.sort(), currentAllowedPaths.sort())) {
                        set({ allowedPaths: newAllowedPaths, menuItems: menuItems, lastValidationTime: now });
                    } else {
                        set({ lastValidationTime: now });
                    }
                } catch (error) {
                    console.error("Rights refresh failed:", error);
                }
            },
        }),
        {
            name: 'session-storage',
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
);

export default useSessionStore;
