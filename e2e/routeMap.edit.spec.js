import { test, expect } from '@playwright/test';

/**
 * RouteMap edit mode, end to end against the real API in read-only mode:
 * every write endpoint is aborted and each test fails if one was attempted.
 * Dialogs are always cancelled.
 *
 * Shift under test: E2E_ROUTEMAP_QUERY (needs 2+ routes, one with 3+ stops).
 * E2E_GATEWAY=1 when the app runs with VITE_API_BASE=/legacy (through etms-api).
 */
const GATEWAY = process.env.E2E_GATEWAY === '1';
const QUERY =
  process.env.E2E_ROUTEMAP_QUERY ||
  'sDate=2026-11-05&FacilityID=1&TripType=P&Shifttimes=0800&Direction=ASC&Routeid=';

const WRITE_ENDPOINTS =
  /UpdateCutPaste|SplitRoute|MergeRoute|AddEmpToRoute|DeleteRoutes|updateRouteMapbased|save_routesMapBasedNew|BlockTransport|PushRouteToDashbaord|route-generation/i;

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.blockedWrites = [];
  testInfo.pageErrors = [];
  await page.route('**/*', (route) => {
    if (WRITE_ENDPOINTS.test(route.request().url())) {
      testInfo.blockedWrites.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  page.on('pageerror', (e) => {
    // MapLibre occasionally throws while evaluating the third-party OpenFreeMap
    // style on a cold load ("expression.evaluate is not a function"). Record it,
    // but only errors from our own code fail the test.
    if (/maplibre-gl/i.test(e.stack || '')) {
      testInfo.annotations.push({ type: 'third-party-error', description: e.message });
    } else {
      testInfo.pageErrors.push(e.message);
    }
  });
});

test.afterEach(async ({}, testInfo) => {
  expect(testInfo.blockedWrites, 'no write endpoint may be called').toEqual([]);
  expect(testInfo.pageErrors, 'no uncaught page errors').toEqual([]);
});

const openMap = async (page, { signedIn = true } = {}) => {
  if (signedIn) await page.addInitScript(() => sessionStorage.setItem('ID', '1'));
  await page.goto(`/RouteMap?${QUERY}`);
  // Initial load goes to the remote API; allow for a slow backend.
  await page.locator('.route-summary').first().waitFor({ timeout: 60_000 });
  await page.locator('img.leaflet-marker-icon').first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1500); // fitBounds + tile settle
};

const showAllAndEdit = async (page) => {
  await page.getByRole('switch', { name: 'Show all routes' }).click();
  await expect(page.locator('.route-summary.active')).toHaveCount(await page.locator('.route-summary').count());
  // Routes stream in behind a progress pill; the map re-fits once they've all arrived.
  await expect(page.locator('.rm-load-progress')).toHaveCount(0, { timeout: 120_000 });
  await page.waitForTimeout(1500);
  await page.getByRole('switch', { name: 'Edit mode' }).click();
  await expect(page.locator('img.leaflet-marker-draggable').first()).toBeVisible();
};

const dialog = (page) => page.locator('.p-dialog');
const cancelDialog = async (page) => {
  await dialog(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog(page)).toHaveCount(0);
};

const stopNames = (page) => page.locator('.re-stop-list li .re-stop-text strong').allInnerTexts();

/** Open the inspector on the route with the most stops. */
const openBiggestRoute = async (page) => {
  const counts = await page
    .locator('.route-summary')
    .evaluateAll((cards) => cards.map((c) => Number(c.querySelectorAll('.stat-value')[1]?.textContent) || 0));
  const index = counts.indexOf(Math.max(...counts));
  await page.locator('.route-summary').nth(index).getByRole('button', { name: 'Edit stops' }).click();
  await expect(page.locator('.re-stop-list li').first()).toBeVisible();
};

test('is view-only without a signed-in session (legacy API)', async ({ page }) => {
  test.skip(GATEWAY, 'through the gateway a signed-out visitor gets no data at all');
  await openMap(page, { signedIn: false });
  await expect(page.getByRole('switch', { name: 'Edit mode' })).toHaveCount(0);
  await expect(page.getByText('View only')).toBeVisible();
});

test('gets no route data without a signed-in session (gateway)', async ({ page }) => {
  test.skip(!GATEWAY, 'only meaningful through etms-api');
  const statuses = [];
  page.on('response', (r) => {
    if (r.url().includes('/legacy/GetRoutesByOrder')) statuses.push(r.status());
  });
  await page.goto(`/RouteMap?${QUERY}`);
  await expect.poll(() => statuses.length, { timeout: 30_000 }).toBeGreaterThan(0);
  expect(statuses.every((s) => s === 401)).toBe(true);
  await expect(page.locator('.route-summary')).toHaveCount(0);
});

test('edit mode makes stops selectable and offers stop actions', async ({ page }) => {
  await openMap(page);
  await showAllAndEdit(page);
  // Splitting needs a route with 2+ stops whose id doesn't already end in "S".
  const cards = await page.locator('.route-summary').evaluateAll((els) =>
    els.map((c) => ({
      id: c.querySelector('.route-name span')?.textContent.replace('Route ', '').trim(),
      stops: Number(c.querySelectorAll('.stat-value')[1]?.textContent) || 0,
    }))
  );
  const splittable = cards.findIndex((c) => c.stops >= 2 && !/S$/i.test(c.id));
  test.skip(splittable < 0, 'needs a splittable route (2+ stops, id not ending in S)');
  await page.locator('.route-summary').nth(splittable).getByRole('button', { name: 'Edit stops' }).click();
  await expect(page.locator('.re-stop-list li').first()).toBeVisible();
  await page.locator('.re-stop-list').getByRole('button', { name: /^Select .* on the map$/ }).first().click();
  const bar = page.locator('.re-action-bar');
  await expect(bar).toContainText('1 selected');
  await bar.getByRole('button', { name: 'Split' }).click();
  await expect(dialog(page)).toContainText(/Split .* into new route/);
  await cancelDialog(page);
});

test('dragging a stop onto another route line asks to move it there', async ({ page }) => {
  await openMap(page);
  await showAllAndEdit(page);

  // A point on some route's line that is in open map (not under the sidebar or
  // controls), and a marker belonging to a different route.
  const target = await page.evaluate(() => {
    const blockers = ['.sidebar-react', '.leaflet-control-container', '.re-recalc-banner']
      .flatMap((sel) => [...document.querySelectorAll(sel)])
      .map((el) => el.getBoundingClientRect());
    const free = (x, y) =>
      x > 40 && y > 40 && x < innerWidth - 80 && y < innerHeight - 120 &&
      !blockers.some((r) => x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 20 && y <= r.bottom + 20);
    const paths = [...document.querySelectorAll('path.leaflet-interactive')].filter((p) => !p.getAttribute('stroke-dasharray'));
    for (const p of paths) {
      const m = p.getScreenCTM();
      for (let f = 0.1; f <= 0.9; f += 0.05) {
        const pt = p.getPointAtLength(p.getTotalLength() * f);
        const x = pt.x * m.a + pt.y * m.c + m.e;
        const y = pt.x * m.b + pt.y * m.d + m.f;
        if (free(x, y)) return { stroke: p.getAttribute('stroke'), x, y };
      }
    }
    return null;
  });
  expect(target, 'a route line visible in open map area').not.toBeNull();
  const markerIndex = await page.evaluate((stroke) => {
    const imgs = [...document.querySelectorAll('img.leaflet-marker-draggable')];
    return imgs.findIndex((img) => !atob(img.src.split(',')[1]).includes(`fill="${stroke}"`));
  }, target.stroke);
  expect(markerIndex).toBeGreaterThanOrEqual(0);

  const marker = page.locator('img.leaflet-marker-draggable').nth(markerIndex);
  const home = await marker.boundingBox();
  const sx = home.x + home.width / 2;
  const sy = home.y + home.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let i = 1; i <= 15; i++) {
    await page.mouse.move(sx + ((target.x - sx) * i) / 15, sy + ((target.y - sy) * i) / 15);
  }
  // the hovered route line is highlighted while dragging
  await expect(page.locator(`path.leaflet-interactive[stroke="${target.stroke}"][stroke-width="9"]`)).toHaveCount(1);
  await page.mouse.up();

  await expect(dialog(page)).toContainText(/Move .* to route .* at stop \d+/);
  await cancelDialog(page);
  const after = await marker.boundingBox();
  expect(Math.abs(after.x - home.x)).toBeLessThan(2); // employee's home doesn't move
});

test('inspector: drag a stop to any position, preview, cancel restores', async ({ page }) => {
  await openMap(page);
  await showAllAndEdit(page);
  await openBiggestRoute(page);

  const before = await stopNames(page);
  test.skip(before.length < 3, 'needs a route with 3+ stops');

  const handles = page.locator('.re-stop-list .re-drag-handle');
  const first = await handles.first().boundingBox();
  const last = await handles.last().boundingBox();
  await page.mouse.move(first.x + 10, first.y + 14);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) await page.mouse.move(first.x + 10, first.y + 14 + ((last.y + 24 - first.y) * i) / 20);
  await expect(page.locator('.re-stop-overlay')).toContainText(`Stop ${before.length}`);
  await page.mouse.up();

  await expect(dialog(page)).toContainText(`Move ${before[0]} to stop ${before.length}`);
  expect(await stopNames(page)).toEqual([...before.slice(1), before[0]]); // preview
  await expect(page.locator('.re-stop-list li.is-moved')).toHaveCount(1);

  await cancelDialog(page);
  expect(await stopNames(page)).toEqual(before);
});

test('inspector: keyboard-only reorder', async ({ page }) => {
  await openMap(page);
  await showAllAndEdit(page);
  await openBiggestRoute(page);

  const before = await stopNames(page);
  test.skip(before.length < 2, 'needs a route with 2+ stops');

  await page.locator('.re-stop-list .re-drag-handle').last().focus();
  await page.keyboard.press('Space');
  for (let i = 0; i < before.length - 1; i++) {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(120);
  }
  await page.keyboard.press('Space');
  await expect(dialog(page)).toContainText(`Move ${before[before.length - 1]} to stop 1`);
  await cancelDialog(page);
});

test('shift+drag box-selects stops across routes', async ({ page }) => {
  await openMap(page);
  await showAllAndEdit(page);
  const map = await page.locator('.leaflet-container').boundingBox();
  await page.keyboard.down('Shift');
  await page.mouse.move(map.x + 330, map.y + 20);
  await page.mouse.down();
  await page.mouse.move(map.x + map.width - 70, map.y + map.height - 20, { steps: 12 });
  await page.mouse.up();
  await page.keyboard.up('Shift');
  await expect(page.locator('.re-action-bar')).toContainText(/\d+ selected/);
});
