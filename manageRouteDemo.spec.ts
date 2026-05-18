/**
 * manageRouteDemo.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Playwright demo / intro-video automation for the eTMS "Manage Route" flow.
 *
 * What this records:
 *   1. Opens the app and logs in
 *   2. Navigates via sidebar: Transport → Manage Route
 *   3. Selects today's date, Facility = WTC, Trip Type = Pick, Shift = 1200
 *   4. Clicks Search → confirmation modal appears → clicks Yes
 *   5. Watches the route-generation progress dialog (async background job)
 *   6. Closes the dialog, pauses for a clean video outro
 *
 * Setup:
 *   npm install --save-dev @playwright/test
 *   npx playwright install chromium
 *
 * Credentials (pick either approach):
 *   Option A — env vars (recommended):
 *     $env:DEMO_USERNAME = "your_username"
 *     $env:DEMO_PASSWORD = "your_password"
 *   Option B — edit the constants below directly.
 *
 * Run:
 *   npx playwright test manageRouteDemo.spec.ts
 *
 * Video lands in: ./videos/<test-name>/video.webm
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';

// ── Credentials ──────────────────────────────────────────────────────────────
const DEMO_USERNAME = process.env.DEMO_USERNAME ?? 'mph0002';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'mph@123';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Selects a value in a PrimeReact Dropdown.
 * Clicks the dropdown wrapper, optionally types in the filter, then clicks the matching item.
 *
 * @param wrapperId  The `id` attribute on the <Dropdown> component (e.g. "#facility")
 * @param optionText The visible label text of the option to select (e.g. "WTC")
 * @param filterText Text to type into the dropdown filter (defaults to optionText)
 */
async function selectPrimeDropdown(
  page: import('@playwright/test').Page,
  wrapperId: string,
  optionText: string,
  filterText: string = optionText
): Promise<void> {
  // Open the dropdown
  await page.locator(wrapperId).click();
  await page.waitForTimeout(400);

  // If the dropdown has a filter input, use it to narrow down options
  const filterInput = page.locator('.p-dropdown-panel:visible .p-dropdown-filter');
  if (await filterInput.isVisible()) {
    await filterInput.fill(filterText);
    await page.waitForTimeout(400);
  }

  // Click the first matching option in the visible panel
  await page
    .locator('.p-dropdown-panel:visible .p-dropdown-item', { hasText: optionText })
    .first()
    .click();
}

// ── Demo Test ─────────────────────────────────────────────────────────────────

test.describe('eTMS – Manage Route Demo', () => {
  test('Generate Routes Walkthrough', async ({ page }) => {

    // ── Step 1: Open the app ─────────────────────────────────────────────────
    // Navigate to the root — this shows the login page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500); // Let the login page render fully before recording begins

    // ── Step 2: Login ────────────────────────────────────────────────────────
    // Fill in username
    await page.locator('input[name="username"]').click();
    await page.locator('input[name="username"]').fill(DEMO_USERNAME);
    await page.waitForTimeout(500);

    // Fill in password
    await page.locator('input[name="password"]').click();
    await page.locator('input[name="password"]').fill(DEMO_PASSWORD);
    await page.waitForTimeout(500);

    // Submit login form
    await page.locator('button[type="submit"]').click();

    // ── Step 3: Handle Consent/Disclaimer modal (shown on first login or after updates) ──
    // Waits up to 5 s; silently skips if the modal does not appear for this session
    try {
      await page.locator('.consent-agree-btn').waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(1000); // Pause so viewers can see the modal
      await page.locator('.consent-agree-btn').click();
      await page.waitForTimeout(1200);
    } catch {
      // Consent modal was not shown — continue normally
    }

    // ── Step 4: Wait for post-login page to be fully loaded ──────────────────
    // The sidebar is the reliable "authenticated" landmark across all post-login pages
    await page.locator('.sidebar').waitFor({ state: 'visible', timeout: 30_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Dramatic pause — let the dashboard settle on screen

    // ── Step 5: Navigate via sidebar — Transport → Manage Route ───────────────
    // Expand the "Transport" parent accordion menu in the left sidebar
    await page
      .locator('.sidebar .accordion-button', { hasText: 'Transport' })
      .click();
    await page.waitForTimeout(1200); // Wait for submenu slide-down animation

    // Click the "Manage Route" submenu link
    // React Router <Link to="/ManageRoute"> renders as <a href="/ManageRoute">
    await page.locator('.sidebar .submenu a', { hasText: 'Manage Route' }).click();

    // ── Step 6: Wait for Manage Route page to fully load ─────────────────────
    await page.waitForURL('**/ManageRoute', { timeout: 15_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Pause — let the empty state + filter panel settle

    // ── Step 7: Shift Date is already today (default) ────────────────────────
    // PrimeReact Calendar wraps the input inside a <span class="p-calendar">;
    // the date defaults to today so we just hover to highlight the field for the demo.
    const dateInputEl = page.locator('.custom-calendar-wrapper input').first();
    await dateInputEl.click().catch(() => {}); // soft click — non-fatal if overlay blocks it
    await page.keyboard.press('Escape');        // dismiss picker if it opened
    await page.waitForTimeout(800);

    // ── Step 8: Select Facility Name = WTC ───────────────────────────────────
    // PrimeReact Dropdown — id="facility" is on the wrapper <div>
    await selectPrimeDropdown(page, '#facility', 'WTC');
    await page.waitForTimeout(1200); // Pause — let viewer see the selection

    // ── Step 9: Trip Type is already "Pick" (default value "P") ─────────────
    // Re-click to confirm selection for demo clarity — no change required
    await selectPrimeDropdown(page, '#tripType', 'Pick');
    await page.waitForTimeout(1200);

    // ── Step 10: Select Shift = 1200 ─────────────────────────────────────────
    // Shift values come from the API (e.g. "1200", "0900") — both label and value are the time string
    await selectPrimeDropdown(page, '#shift', '1200');
    await page.waitForTimeout(1200);

    // ── Step 11: Click the Search button ─────────────────────────────────────
    // ReportButton renders a PrimeReact <Button> with class "report-button"
    await page.locator('button.report-button').click();

    // Wait for the API validation call to complete (networkidle may not fire quickly,
    // so we also rely on the modal appearing in step 12)
    await page.waitForTimeout(1500);

    // ── Step 12: Confirmation modal — "Are you sure?" ────────────────────────
    // This dialog appears when the roster validation returns result = 0
    // (routes have not been generated yet for this date/facility/shift).
    const confirmDialogTitle = page.locator('.p-dialog-title', { hasText: 'Are you sure?' });
    await confirmDialogTitle.waitFor({ state: 'visible', timeout: 20_000 });

    await page.waitForTimeout(2000); // Hold on dialog — let viewers read the confirmation message

    // ── Step 13: Click "Yes" to kick off route generation ────────────────────
    // The footer contains two PrimeReact Buttons: "No" and "Yes"
    await page.locator('.p-dialog-footer button', { hasText: 'Yes' }).click();
    await page.waitForTimeout(800);

    // ── Step 14: Route generation progress dialog ─────────────────────────────
    // After clicking Yes, the confirmation dialog closes and the OPTIMAR progress
    // dialog appears. It has a header with "OPTIMAR Routing Engine" and a progress bar.
    const progressDialog = page.locator('.p-dialog', { hasText: 'OPTIMAR Routing Engine' });
    await progressDialog.waitFor({ state: 'visible', timeout: 10_000 });

    // ── Step 15: Wait for "Job queued" state to appear ───────────────────────
    // The message "Job queued. Generating routes..." confirms the async job was
    // submitted to the backend. We pause briefly so viewers can read it.
    await page.locator('.p-dialog p', { hasText: 'queued' })
      .waitFor({ state: 'visible', timeout: 8_000 })
      .catch(() => { /* message text may vary — proceed anyway */ });
    await page.waitForTimeout(2500); // Hold so viewers read "queued" + background note

    // ── Step 16: Close the progress dialog ───────────────────────────────────
    // Route generation continues in the background — no need to keep this open.
    // The custom close button in the header has aria-label="Close".
    await progressDialog.locator('button[aria-label="Close"]').click();
    await page.waitForTimeout(1200);

    // ── Step 17: Smooth outro pause — end of demo recording ──────────────────
    await page.waitForTimeout(2500);

    // Assert we are still on ManageRoute (sanity check)
    await expect(page).toHaveURL(/ManageRoute/);
  });
});
