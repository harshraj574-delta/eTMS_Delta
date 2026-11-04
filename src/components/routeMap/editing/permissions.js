import sessionManager from '../../../utils/SessionManager';

export const EDIT_MODES = ['off', 'admins', 'all'];

/**
 * Who may use RouteMap edit mode. Rollout is controlled by VITE_ROUTE_MAP_EDITING:
 *   off    - view only for everyone
 *   admins - ISadmin users only
 *   all    - any signed-in user (default; same people who can edit on Manage Route)
 *
 * This only decides what the UI offers. The backend must still authorize every
 * edit call: sessionStorage is user-controlled.
 *
 * @returns {{ canEdit: boolean, userId: number, reason: string | null }}
 */
export const getRouteEditAccess = ({ env = import.meta.env, session = sessionManager } = {}) => {
    const raw = String(env?.VITE_ROUTE_MAP_EDITING ?? 'all').toLowerCase();
    const mode = EDIT_MODES.includes(raw) ? raw : 'all';
    const userId = Number(session.getUserSession().ID) || 0;

    if (mode === 'off') {
        return { canEdit: false, userId, reason: 'Route editing on the map is not enabled for this environment.' };
    }
    if (!userId) {
        return { canEdit: false, userId, reason: 'Open this map from Manage Route while signed in to edit routes.' };
    }
    if (mode === 'admins' && !session.isAdmin()) {
        return { canEdit: false, userId, reason: 'Only administrators can edit routes on the map.' };
    }
    return { canEdit: true, userId, reason: null };
};
