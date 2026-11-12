import { getAuthHeaders } from "../http/apiClient";

/**
 * What the signed-in user may do, as decided by etms-api (GET /api/v1/me).
 *
 * Only used when the app goes through etms-api (VITE_API_BASE=/legacy). The UI uses
 * it to decide which pages and buttons to offer; etms-api still checks every call,
 * so nothing here is a security boundary on its own.
 *
 * @typedef {{ userId: number, isAdmin: boolean, active: boolean,
 *             facilityIds: number[] | 'all', permissions: string[], pages: string[] }} MyAccess
 */

export const ME_URL = "/api/v1/me";

/** "/MySchedule", "MySchedule.jsx" and "myschedule" all name the same page (same rule as etms-api). */
export const normalisePage = (path) =>
  String(path ?? "")
    .trim()
    .replace(/^\/+/, "")
    .split(/[/?#]/)[0]
    .toLowerCase()
    .replace(/\.(aspx|jsx)$/, "");

/** Same matching as etms-api: exact, `*`, or a `resource.*` wildcard. */
export const hasPermission = (access, required) => {
  const granted = access?.permissions ?? [];
  if (granted.includes("*") || granted.includes(required)) return true;
  const parts = String(required).split(".");
  for (let i = parts.length - 1; i > 0; i--) {
    if (granted.includes(`${parts.slice(0, i).join(".")}.*`)) return true;
  }
  return false;
};

/** May the user open this page? */
export const canOpenPage = (access, path) => {
  if (!access?.active) return false;
  const page = normalisePage(path);
  const pages = access.pages ?? [];
  // "*" = every page (etms-api permission sources without page data, e.g. dev)
  return Boolean(page) && (pages.includes("*") || pages.includes(page));
};

/**
 * Menu rows (MenuID, Text, NavigateUrl, ParentID, Description, RowNo) to the shape the
 * sidebar uses. Same mapping for the legacy menu call and /me.
 */
export const toMenuItems = (rows) =>
  (Array.isArray(rows) ? rows : []).map((item) => ({
    MenuId: item.MenuID,
    MenuName: item.Text,
    MenuURL: item.NavigateUrl || "#",
    ParentId: item.ParentID ?? 0,
    IconClass: item.Description || "",
    IsActive: true,
    OrderNo: item.RowNo || 0,
  }));

/**
 * Everything the app needs to start a session, in one call:
 *   access    - permissions, pages and facility scope
 *   user      - the user's details, in the shape sessionManager stores (Spr_GetuserId's)
 *   menuItems - the sidebar
 *
 * Pass the last `etag` to get `{ notModified: true }` when nothing changed.
 *
 * @returns {Promise<{ notModified: boolean, etag?: string | null, access?: MyAccess,
 *                     user?: Record<string, unknown> | null, menuItems?: object[] }>}
 */
export async function fetchSession(fetchImpl = fetch, { etag } = {}) {
  const headers = { ...(await getAuthHeaders()), ...(etag ? { "If-None-Match": etag } : {}) };
  // no-store: the app handles the version itself, so a 304 reaches this code.
  const response = await fetchImpl(ME_URL, { headers, cache: "no-store" });
  if (response.status === 304) return { notModified: true };
  if (!response.ok) {
    const error = new Error(`Could not load your access (${response.status})`);
    error.status = response.status;
    throw error;
  }
  const me = await response.json();
  return {
    notModified: false,
    etag: response.headers?.get?.("ETag") ?? null,
    access: {
      userId: Number(me.userId) || 0,
      isAdmin: Boolean(me.isAdmin),
      active: Boolean(me.active),
      facilityIds: me.facilityIds === "all" ? "all" : (me.facilityIds ?? []).map(Number),
      permissions: me.permissions ?? [],
      pages: (me.pages ?? []).map(normalisePage),
    },
    user: me.user ?? null,
    menuItems: toMenuItems(me.menu),
  };
}

/** @returns {Promise<MyAccess>} */
export async function fetchMyAccess(fetchImpl = fetch) {
  return (await fetchSession(fetchImpl)).access;
}
