import { describe, it, expect, vi } from 'vitest';
import { canOpenPage, fetchMyAccess, fetchSession, hasPermission, normalisePage, toMenuItems } from '../myAccess';

const access = (overrides = {}) => ({
    userId: 7,
    isAdmin: false,
    active: true,
    facilityIds: [1],
    permissions: ['roster.view', 'route.*'],
    pages: ['myschedule', 'routemap'],
    ...overrides,
});

describe('normalisePage', () => {
    it('treats paths, file names and letter case alike', () => {
        expect(normalisePage('/MySchedule')).toBe('myschedule');
        expect(normalisePage('MySchedule.jsx')).toBe('myschedule');
        expect(normalisePage('/RouteMap?routeId=5')).toBe('routemap');
        expect(normalisePage('/ManageRoute/edit')).toBe('manageroute');
    });
});

describe('hasPermission', () => {
    it('matches exact grants and wildcards like etms-api', () => {
        expect(hasPermission(access(), 'roster.view')).toBe(true);
        expect(hasPermission(access(), 'route.manage')).toBe(true);
        expect(hasPermission(access(), 'roster.manage')).toBe(false);
        expect(hasPermission(access({ permissions: ['*'] }), 'anything.at.all')).toBe(true);
    });

    it('grants nothing without access', () => {
        expect(hasPermission(null, 'roster.view')).toBe(false);
    });
});

describe('canOpenPage', () => {
    it('allows the pages the server listed', () => {
        expect(canOpenPage(access(), '/MySchedule')).toBe(true);
        expect(canOpenPage(access(), '/RouteMap')).toBe(true);
        expect(canOpenPage(access(), '/AccessRights')).toBe(false);
    });

    it('treats "*" as every page (dev permissions)', () => {
        expect(canOpenPage(access({ pages: ['*'] }), '/AdminSchedule')).toBe(true);
    });

    it('refuses everything for an inactive or missing profile', () => {
        expect(canOpenPage(access({ active: false }), '/MySchedule')).toBe(false);
        expect(canOpenPage(null, '/MySchedule')).toBe(false);
    });
});

describe('fetchMyAccess', () => {
    it('reads /api/v1/me and normalises the pages', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ userId: '7', isAdmin: false, active: true, facilityIds: ['1'], permissions: ['roster.view'], pages: ['/MySchedule'] }),
        });
        const result = await fetchMyAccess(fetchImpl);
        expect(fetchImpl).toHaveBeenCalledWith('/api/v1/me', expect.any(Object));
        expect(result).toEqual({ userId: 7, isAdmin: false, active: true, facilityIds: [1], permissions: ['roster.view'], pages: ['myschedule'] });
    });

    it('keeps "all" facilities for admins', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ userId: 1, isAdmin: true, active: true, facilityIds: 'all', permissions: ['*'], pages: [] }) });
        expect((await fetchMyAccess(fetchImpl)).facilityIds).toBe('all');
    });

    it('returns the user details and the menu in the shape the app already uses', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                userId: 1, active: true, permissions: [], pages: [],
                user: { ID: '1', empCode: 'tmp123', ISadmin: 'Y' },
                menu: [
                    { MenuID: 1, Text: 'My TMS', Description: 'switch_account', ParentID: null, NavigateUrl: null, RowNo: 0 },
                    { MenuID: 9, Text: 'My Schedule', Description: null, ParentID: 1, NavigateUrl: 'MySchedule', RowNo: 2 },
                ],
            }),
        });
        const session = await fetchSession(fetchImpl);
        expect(session.user).toEqual({ ID: '1', empCode: 'tmp123', ISadmin: 'Y' });
        expect(session.menuItems).toEqual([
            { MenuId: 1, MenuName: 'My TMS', MenuURL: '#', ParentId: 0, IconClass: 'switch_account', IsActive: true, OrderNo: 0 },
            { MenuId: 9, MenuName: 'My Schedule', MenuURL: 'MySchedule', ParentId: 1, IconClass: '', IsActive: true, OrderNo: 2 },
        ]);
    });

    it('copes with an older server that sends no details or menu', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ userId: 1, active: true }) });
        const session = await fetchSession(fetchImpl);
        expect(session.user).toBeNull();
        expect(session.menuItems).toEqual([]);
        expect(toMenuItems(undefined)).toEqual([]);
    });

    it('sends the last version and reports "not modified" on a 304', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 304 });
        expect(await fetchSession(fetchImpl, { etag: 'W/"abc"' })).toEqual({ notModified: true });
        const [, options] = fetchImpl.mock.calls[0];
        expect(options.headers['If-None-Match']).toBe('W/"abc"');
        expect(options.cache).toBe('no-store');
    });

    it('returns the new version with changed access', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true, status: 200,
            headers: { get: (name) => (name === 'ETag' ? 'W/"v2"' : null) },
            json: async () => ({ userId: 1, active: true, permissions: [], pages: [] }),
        });
        const session = await fetchSession(fetchImpl, { etag: 'W/"v1"' });
        expect(session).toMatchObject({ notModified: false, etag: 'W/"v2"' });
    });

    it('marks a 401 so the app can sign the user out', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });
        await expect(fetchSession(fetchImpl)).rejects.toMatchObject({ status: 401 });
    });

    it('fails loudly when the server refuses', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });
        await expect(fetchMyAccess(fetchImpl)).rejects.toThrow(/401/);
    });
});
