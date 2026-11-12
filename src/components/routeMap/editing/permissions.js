import sessionManager from '../../../utils/SessionManager';
import { hasPermission } from '../../../services/auth/myAccess';

/** Permission etms-api requires for every route edit call. */
export const ROUTE_EDIT_PERMISSION = 'route.manage';

export const EDIT_MODES = ['off', 'admins', 'all'];

/**
 * Who may use RouteMap edit mode. Rollout is controlled by VITE_ROUTE_MAP_EDITING:
 *   off    - view only for everyone
 *   admins - ISadmin users only
 *   all    - any signed-in user (default; same people who can edit on Manage Route)
 *
 * Through etms-api (`access` = the user's /api/v1/me result) the server decides:
 * editing needs the Manage Route permission, the same one etms-api checks on every
 * edit call. `off` still works as a kill switch.
 *
 * This only decides what the UI offers. The backend must still authorize every
 * edit call: sessionStorage is user-controlled.
 *
 * @returns {{ canEdit: boolean, userId: number, reason: string | null }}
 */
export const getRouteEditAccess = ({ env = import.meta.env, session = sessionManager, access } = {}) => {
    const raw = String(env?.VITE_ROUTE_MAP_EDITING ?? 'all').toLowerCase();
    const mode = EDIT_MODES.includes(raw) ? raw : 'all';
    const userId = Number(session.getUserSession().ID) || 0;

    if (mode === 'off') {
        return { canEdit: false, userId, reason: 'Route editing on the map is not enabled for this environment.' };
    }
    if (!userId) {
        return { canEdit: false, userId, reason: 'Open this map from Manage Route while signed in to edit routes.' };
    }
    if (access !== undefined) {
        return hasPermission(access, ROUTE_EDIT_PERMISSION)
            ? { canEdit: true, userId, reason: null }
            : { canEdit: false, userId, reason: 'Editing routes needs the Manage Route access right. Ask an administrator to grant it.' };
    }
    if (mode === 'admins' && !session.isAdmin()) {
        return { canEdit: false, userId, reason: 'Only administrators can edit routes on the map.' };
    }
    return { canEdit: true, userId, reason: null };
};
