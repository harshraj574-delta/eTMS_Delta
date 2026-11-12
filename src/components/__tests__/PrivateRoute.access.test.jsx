import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Through etms-api: the route guard must never refuse on possibly old access.
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
vi.mock('../common/Loader', () => ({ default: () => <div>loading</div> }));

const { default: useSessionStore } = await import('../../store/useSessionStore');
const { fetchSession } = await import('../../services/auth/myAccess');
const { default: PrivateRoute } = await import('../PrivateRoute');

const access = (pages) => ({ userId: 1, isAdmin: false, active: true, facilityIds: [1], permissions: [], pages });
const menu = (urls) => urls.map((url, i) => ({ MenuId: i + 1, MenuURL: url }));

const renderAt = (path) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/AdminSchedule" element={<PrivateRoute element={<div>admin schedule page</div>} />} />
                <Route path="/MySchedule" element={<PrivateRoute element={<div>my schedule page</div>} />} />
                <Route path="/Unauthorized" element={<div>unauthorized page</div>} />
            </Routes>
        </MemoryRouter>,
    );

describe('PrivateRoute through etms-api', () => {
    beforeEach(() => {
        fetchSession.mockReset();
        // The app reloaded with the access it saved before Admin Schedule was granted.
        useSessionStore.getState().login({ ID: '1' }, menu(['MySchedule']), access(['myschedule']), 'W/"v1"');
        useSessionStore.setState({ lastValidationTime: 0 });
    });
    afterEach(cleanup);

    it('opens a page granted since the saved access instead of refusing it', async () => {
        fetchSession.mockResolvedValue({
            notModified: false, etag: 'W/"v2"',
            access: access(['myschedule', 'adminschedule']), menuItems: menu(['MySchedule', 'AdminSchedule']),
        });
        renderAt('/AdminSchedule');
        expect(await screen.findByText('admin schedule page')).toBeTruthy();
        expect(fetchSession).toHaveBeenCalledTimes(1);
    });

    it('refuses only after the fresh check confirms it', async () => {
        fetchSession.mockResolvedValue({ notModified: true });
        renderAt('/AdminSchedule');
        expect(screen.getByText('loading')).toBeTruthy();
        expect(await screen.findByText('unauthorized page')).toBeTruthy();
    });

    it('shows an allowed page at once and checks in the background', async () => {
        fetchSession.mockResolvedValue({ notModified: true });
        renderAt('/MySchedule');
        expect(screen.getByText('my schedule page')).toBeTruthy();
    });
});
