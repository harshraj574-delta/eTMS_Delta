import { describe, it, expect, vi } from 'vitest';
import { canOpenPage, fetchMyAccess, hasPermission, normalisePage } from '../myAccess';

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

    it('fails loudly when the server refuses', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });
        await expect(fetchMyAccess(fetchImpl)).rejects.toThrow(/401/);
    });
});
