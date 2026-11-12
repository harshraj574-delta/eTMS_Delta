import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiService } from '../services/api';
import { isEqual } from 'lodash';
import { USES_GATEWAY } from '../services/http/apiClient';
import { canOpenPage, fetchSession, hasPermission } from '../services/auth/myAccess';

/** Through etms-api: how old the user's access may get before it is re-read. */
export const ACCESS_MAX_AGE_MS = 5 * 60 * 1000;
/** On tab focus, re-read when the last check is older than this. */
export const ACCESS_FOCUS_AGE_MS = 60 * 1000;

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

            /**
             * Re-read the user's rights. `maxAgeMs` is how old the last check may be:
             * through etms-api one /api/v1/me call refreshes access and menu, so it runs
             * every few minutes, when the tab regains focus, or after a 403 (force)
             * instead of on every navigation.
             */
            refreshRights: async (force = false, maxAgeMs = USES_GATEWAY ? ACCESS_MAX_AGE_MS : 2000) => {
                const { user, allowedPaths: currentAllowedPaths, lastValidationTime } = get();

                if (!user) return;

                // Optimization: If validated recently, skip the API call unless forced
                const now = Date.now();
                if (!force && now - lastValidationTime < maxAgeMs) {
                    return;
                }

                try {
                    const userId = user.ID || user.EmpId || user.UserName;
                    if (!userId) return;

                    if (USES_GATEWAY) {
                        set({ lastValidationTime: now }); // one refresh at a time
                        const { access, menuItems } = await fetchSession();
                        set({ allowedPaths: menuPaths(menuItems), menuItems, access, lastValidationTime: Date.now() });
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
