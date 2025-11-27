import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiService } from '../services/api';
import { isEqual } from 'lodash';

const useSessionStore = create(
    persist(
        (set, get) => ({
            user: null,
            allowedPaths: [],
            menuItems: [],
            isAuthenticated: false,
            lastValidationTime: 0,

            login: (userData, menuItems) => {
                const allowedPaths = menuItems.map(item => {

                    return (item.MenuURL || "").trim().replace(/^\/+/, "");
                }).filter(path => path !== "" && path !== "#");

                set({
                    user: userData,
                    allowedPaths: allowedPaths,
                    menuItems: menuItems,
                    isAuthenticated: true,
                    lastValidationTime: Date.now(),
                });
            },

            logout: () => {
                set({
                    user: null,
                    allowedPaths: [],
                    menuItems: [],
                    isAuthenticated: false,
                    lastValidationTime: 0,
                });
                sessionStorage.clear();
            },

            checkAccess: (currentPath) => {
                const { allowedPaths } = get();
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

                    const menuItems = await apiService.Spr_GetMenuItem_V2({ userID: userId });

                    const newAllowedPaths = menuItems.map(item => {
                        return (item.MenuURL || "").trim().replace(/^\/+/, "");
                    }).filter(path => path !== "" && path !== "#");

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
