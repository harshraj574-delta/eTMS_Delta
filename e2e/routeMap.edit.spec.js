import { test, expect } from '@playwright/test';

/**
 * RouteMap edit mode, end to end against the real API in read-only mode:
 * every write endpoint is aborted and each test fails if one was attempted.
 * Dialogs are always cancelled.
 *
 * Shift under test: E2E_ROUTEMAP_QUERY (needs 2+ routes, one with 3+ stops).
 */
const QUERY =
  process.env.E2E_ROUTEMAP_QUERY ||
  'sDate=2026-11-03&FacilityID=1&TripType=P&Shifttimes=2330&Direction=ASC&Routeid=';

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
  await page.locator('.route-summary').first().waitFor();
  await page.locator('img.leaflet-marker-icon').first().waitFor();
  await page.waitForTimeout(1500); // fitBounds + tile settle
};

const showAllAndEdit = async (page) => {
  await page.getByRole('switch', { name: 'Show all routes' }).click();
  await expect(page.locator('.route-summary.active')).toHaveCount(await page.locator('.route-summary').count());
  await page.waitForTimeout(1000);
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

test('is view-only without a signed-in session', async ({ page }) => {
  await openMap(page, { signedIn: false });
  await expect(page.getByRole('switch', { name: 'Edit mode' })).toHaveCount(0);
  await expect(page.getByText('View only')).toBeVisible();
});

test('edit mode makes stops selectable and offers stop actions', async ({ page }) => {
  await openMap(page);
  await showAllAndEdit(page);
  await page.locator('img.leaflet-marker-draggable').first().click();
  const bar = page.locator('.re-action-bar');
  await expect(bar).toContainText('1 selected');
  await bar.getByRole('button', { name: 'Split' }).click();
  await expect(dialog(page)).toContainText(/Split .* into new route/);
  await cancelDialog(page);
});

test('dragging a stop onto another route line asks to move it there', async ({ page }) => {
  await openMap(page);
  await showAllAndEdit(page);

  // A point on the first route's line and a marker belonging to a different route.
  const target = await page.evaluate(() => {
    const paths = [...document.querySelectorAll('path.leaflet-interactive')].filter((p) => !p.getAttribute('stroke-dasharray'));
    const p = paths[0];
    const pt = p.getPointAtLength(p.getTotalLength() * 0.35);
    const m = p.getScreenCTM();
    return { stroke: p.getAttribute('stroke'), x: pt.x * m.a + pt.y * m.c + m.e, y: pt.x * m.b + pt.y * m.d + m.f };
  });
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
