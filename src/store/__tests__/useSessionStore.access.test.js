import { describe, it, expect, vi, beforeEach } from 'vitest';

// The access check through etms-api: one /me call with the last version.
vi.mock('../../services/http/apiClient', () => ({
    USES_GATEWAY: true,
    API_BASE: '/legacy',
    getAuthHeaders: async () => ({}),
    attachAuth: (instance) => instance,
}));
vi.mock('../../services/auth/myAccess', async (importOriginal) => ({
    ...(await importOriginal()),
    fetchSession: vi.fn(),
}));

const { default: useSessionStore } = await import('../useSessionStore');
const { fetchSession } = await import('../../services/auth/myAccess');

const access = (pages) => ({ userId: 1, isAdmin: false, active: true, facilityIds: [1], permissions: [], pages });
const menu = (urls) => urls.map((url, i) => ({ MenuId: i + 1, MenuURL: url }));

const signIn = () => {
    useSessionStore.getState().login({ ID: '1' }, menu(['MySchedule', 'ManageRoute']), access(['myschedule', 'manageroute']), 'W/"v1"');
    useSessionStore.setState({ lastValidationTime: 0 });
};

describe('access check through etms-api', () => {
    beforeEach(() => {
        fetchSession.mockReset();
        signIn();
    });

    it('keeps everything when the server says nothing changed', async () => {
        fetchSession.mockResolvedValue({ notModified: true });
        await useSessionStore.getState().refreshRights();
        expect(fetchSession).toHaveBeenCalledWith(expect.any(Function), { etag: 'W/"v1"' });
        expect(useSessionStore.getState().checkAccess('/ManageRoute')).toBe(true);
        expect(useSessionStore.getState().accessEtag).toBe('W/"v1"');
    });

    it('takes a revoked page away on the next check', async () => {
        fetchSession.mockResolvedValue({ notModified: false, etag: 'W/"v2"', access: access(['myschedule']), menuItems: menu(['MySchedule']) });
        await useSessionStore.getState().refreshRights();
        const state = useSessionStore.getState();
        expect(state.checkAccess('/ManageRoute')).toBe(false);
        expect(state.checkAccess('/MySchedule')).toBe(true);
        expect(state.menuItems.map((m) => m.MenuURL)).toEqual(['MySchedule']);
        expect(state.accessEtag).toBe('W/"v2"');
    });

    it('shares one request between simultaneous triggers', async () => {
        let release;
        fetchSession.mockReturnValue(new Promise((resolve) => { release = resolve; }));
        const a = useSessionStore.getState().refreshRights(true);
        const b = useSessionStore.getState().refreshRights(true);
        release({ notModified: true });
        await Promise.all([a, b]);
        expect(fetchSession).toHaveBeenCalledTimes(1);
    });

    it('skips checks closer together than two seconds unless forced', async () => {
        fetchSession.mockResolvedValue({ notModified: true });
        await useSessionStore.getState().refreshRights();
        await useSessionStore.getState().refreshRights();
        expect(fetchSession).toHaveBeenCalledTimes(1);
        await useSessionStore.getState().refreshRights(true);
        expect(fetchSession).toHaveBeenCalledTimes(2);
    });

    it('signs the user out when the session is gone', async () => {
        fetchSession.mockRejectedValue(Object.assign(new Error('401'), { status: 401 }));
        await useSessionStore.getState().refreshRights();
        expect(useSessionStore.getState().isAuthenticated).toBe(false);
    });
});
