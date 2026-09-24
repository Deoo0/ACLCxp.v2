// Run against the local Vite server. PLAYWRIGHT_MODULE may point to a bundled installation.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://127.0.0.1:5173';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Deterministic error states; these are UI checks, not backend integration tests.
    await page.route('**/api/**', route => route.fulfill({ status: 503, json: { detail: 'Service temporarily unavailable. Please retry.' } }));
    for (const width of [320, 375, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 850 });
      for (const path of ['/', '/login', '/register', '/about', '/privacy', '/terms']) {
        await page.goto(base + path);
        await page.locator('h1:visible').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path}: overflow at ${width}`);
      }
      console.log(`PASS public routes: ${width}px`);
    }
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(base + '/');
    await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
    assert(await page.getByRole('menu').isVisible());
    await page.keyboard.press('Escape');
    await page.goto(base + '/login');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    assert(await page.getByRole('alert').isVisible());
    await page.getByRole('button', { name: 'Forgot password?' }).click();
    assert(await page.getByRole('dialog', { name: 'Reset your password' }).isVisible());
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      assert(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')));
    }
    await page.keyboard.press('Escape');
    assert(await page.locator('#forgot-password-trigger').evaluate(el => el === document.activeElement));
    assert(await page.locator('#support-panel').evaluate(el => el.inert));
    await page.getByRole('button', { name: 'Open support chat', exact: true }).click();
    await page.getByRole('textbox', { name: 'Your question' }).fill('Contact info');
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.waitForTimeout(800);
    await page.setViewportSize({ width: 320, height: 360 });
    await page.waitForFunction(() => { const r = document.getElementById('support-panel').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
    assert(await page.locator('#support-panel').evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
    await page.getByRole('textbox', { name: 'Your question' }).focus();
    await page.keyboard.press('Escape');
    assert(await page.getByRole('button', { name: 'Open support chat', exact: true }).evaluate(el => el === document.activeElement));
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(base + '/register');
    await page.getByRole('button', { name: 'Enter Ticket Number' }).click();
    await page.getByLabel('Ticket Number').fill('123');
    await page.getByRole('button', { name: 'Verify Ticket', exact: true }).click();
    assert(await page.getByRole('alert').isVisible());
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Ticket entry reflows at 200% text');
    console.log('PASS text resizing, menu, login validation, dialog focus trap/restore, chat, short viewport, ticket validation');
    // Test protected shells with explicit fixtures; never send writes to the real API.
    await page.addInitScript(() => localStorage.setItem('access_token', 'ui-test-fixture'));
    let role = 'STUDENT';
    await page.unroute('**/api/**');
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/auth/me/') return route.fulfill({ json: { data: { user: { id: 1, role, full_name: 'Mobile Test Student', first_name: 'Mobile', last_name: 'Student', student_id: '2026-12345' } } } });
      if (path === '/api/seasons/access/') return route.fulfill({ json: { can_access: true } });
      if (path === '/api/events/' || path === '/api/events/my-registrations/') return route.fulfill({ json: { data: [], count: 0, next: null, previous: null } });
      return route.fulfill({ status: 503, json: { detail: 'Test service unavailable.' } });
    });
    for (const width of [320, 375, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(base + '/events');
      await page.getByRole('heading', { name: 'Find your next event' }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `student overflow ${width}`);
      if (width < 1024) {
        await page.getByRole('button', { name: 'QR Code', exact: true }).click();
        await page.getByRole('dialog').waitFor();
        await page.keyboard.press('Escape');
      }
      role = 'ADMIN';
      await page.goto(base + '/admin');
      await page.getByText('Administrator', { exact: true }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `admin overflow ${width}`);
      if (width < 1024) {
        await page.getByRole('button', { name: 'Open admin navigation' }).click();
        await page.getByRole('dialog', { name: 'Admin navigation' }).waitFor();
        await page.keyboard.press('Escape');
      }
      role = 'STUDENT';
      console.log(`PASS student/admin fixture shells: ${width}px`);
    }
    assert.deepEqual(errors, [], 'No uncaught browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
