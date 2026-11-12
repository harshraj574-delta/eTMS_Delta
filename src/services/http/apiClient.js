import sessionManager from "../../utils/SessionManager";

/**
 * Single source of truth for how the app reaches the backend.
 *
 * VITE_API_BASE
 *   /api/api/v1  (default) - straight to the legacy ASP.NET API, unauthenticated (today)
 *   /legacy                - through etms-api, which authenticates and authorizes every call
 *
 * VITE_AUTH_MODE (only used when going through etms-api)
 *   dev     - send `x-dev-user-id` from the session (etms-api AUTH_MODE=dev, local only)
 *   cognito - send `Authorization: Bearer <token>` from the registered token provider (Phase 2)
 */
export const API_BASE = import.meta.env.VITE_API_BASE || "/api/api/v1";
export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || "dev";
export const USES_GATEWAY = API_BASE.startsWith("/legacy");

/** Absolute API path for fetch() callers: apiUrl("sp_getRoutedEmpGeocode"). */
export const apiUrl = (endpoint) => `${API_BASE}/${String(endpoint).replace(/^\/+/, "")}`;

// Returns the current access token (or null). Defaults to Cognito, loaded on first
// use so Amplify is only downloaded in Cognito mode; tests can swap it out.
let accessTokenProvider = null;
export const setAccessTokenProvider = (provider) => {
  accessTokenProvider = provider;
};

async function currentAccessToken() {
  if (!accessTokenProvider) {
    const { getAccessToken } = await import("../auth/cognitoAuth");
    accessTokenProvider = getAccessToken;
  }
  return accessTokenProvider();
}

/** Identity headers for the current user; empty when talking to the legacy API directly. */
export async function getAuthHeaders() {
  if (!USES_GATEWAY) return {};
  if (AUTH_MODE === "cognito") {
    const token = await currentAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  const userId = sessionManager.getUserSession().ID;
  return userId && userId !== "null" ? { "x-dev-user-id": String(userId) } : {};
}

const newRequestId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

/**
 * Attach auth + error handling to an axios instance.
 *   401 -> the session is gone or invalid: log out.
 *   403 -> the user lacks a permission: reject so the caller can show it; do NOT log out.
 */
export function attachAuth(instance) {
  instance.interceptors.request.use(async (config) => {
    const headers = await getAuthHeaders();
    Object.entries(headers).forEach(([name, value]) => config.headers.set(name, value));
    if (USES_GATEWAY && !config.headers.has("X-Request-Id")) {
      config.headers.set("X-Request-Id", newRequestId());
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        try {
          // Dynamic import avoids a circular dependency with the store.
          const { default: useSessionStore } = await import("../../store/useSessionStore");
          useSessionStore.getState().logout();
        } catch (e) {
          console.error("Error during logout interceptor:", e);
        }
      } else if (error.response?.status === 403 && USES_GATEWAY) {
        // A refusal may mean the user's rights changed: re-read them so the menus
        // and buttons match what the server allows now.
        import("../../store/useSessionStore")
          .then(({ default: useSessionStore }) => useSessionStore.getState().refreshRights(true))
          .catch((e) => console.error("Error refreshing access after 403:", e));
      }
      return Promise.reject(error);
    }
  );
  return instance;
}

/** Message for a 403 from etms-api ({ error: { message } }), or null. */
export const forbiddenMessage = (error) =>
  error?.response?.status === 403 ? error.response.data?.error?.message || "You don't have permission for this action." : null;
