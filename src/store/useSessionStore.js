import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiService } from '../services/api';
import { isEqual } from 'lodash';
import { USES_GATEWAY } from '../services/http/apiClient';
import { canOpenPage, fetchSession, hasPermission } from '../services/auth/myAccess';

/**
 * Through etms-api the app checks its access on every navigation, when the tab
 * regains focus, after a 403, and on this interval while the tab is visible. Each
 * check sends the last version (ETag); an unchanged answer is a tiny 304.
 */
export const ACCESS_CHECK_INTERVAL_MS = 5 * 60 * 1000;
/** Checks closer together than this are merged (navigation + focus at once). */
const MIN_CHECK_GAP_MS = 2000;

// The access check in flight, so simultaneous triggers share one request.
let accessCheck = null;

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
            // Version (ETag) of `access`, sent back so an unchanged check is a 304.
            accessEtag: null,

            login: (userData, menuItems, access = null, accessEtag = null) => {
                set({
                    user: userData,
                    allowedPaths: menuPaths(menuItems),
                    menuItems: menuItems,
                    access,
                    accessEtag,
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
                    accessEtag: null,
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
             * Re-read the user's rights (skipped if checked within the last 2 s unless
             * forced). Through etms-api this is one /api/v1/me call carrying the last
             * version: unchanged -> 304, changed -> new access and menu, and
             * PrivateRoute moves the user off a page they lost.
             */
            refreshRights: async (force = false, maxAgeMs = MIN_CHECK_GAP_MS) => {
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
                        if (accessCheck) return accessCheck;
                        set({ lastValidationTime: now });
                        accessCheck = (async () => {
                            try {
                                const result = await fetchSession(fetch, { etag: get().accessEtag });
                                if (result.notModified) return;
                                set({
                                    allowedPaths: menuPaths(result.menuItems),
                                    menuItems: result.menuItems,
                                    access: result.access,
                                    accessEtag: result.etag,
                                    lastValidationTime: Date.now(),
                                });
                            } catch (error) {
                                // The session is gone (expired or revoked): sign out.
                                if (error?.status === 401) get().logout();
                                else console.error("Access check failed:", error);
                            } finally {
                                accessCheck = null;
                            }
                        })();
                        return accessCheck;
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
