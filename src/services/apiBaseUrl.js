// Use the Netlify environment variable in production. Keeping the relative
// path as the fallback preserves the Vite development proxy locally.
export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || "/api/api/v1"
).replace(/\/+$/, "");
