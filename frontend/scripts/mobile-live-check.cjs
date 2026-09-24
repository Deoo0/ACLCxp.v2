// Start backend/scripts/mobile_qa_server.py and Vite on 5174 with VITE_API_URL=http://127.0.0.1:8001.
// Set QA_MANIFEST to the temporary file printed by the server. No request interception or auth bypass.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const qa = JSON.parse(readFileSync(process.env.QA_MANIFEST, 'utf8'));
assert(qa.database.startsWith('mobile_qa_'), 'Only use an isolated QA database');
const base = 'http://127.0.0.1:5174';
const widths = [320, 375, 390, 430, 768, 1440];
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  const failures = [];
  let apiResponses = 0;
  const settle = async page => {
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow: ${page.url()}`);
  };
  const login = async role => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(qa.api + '/api/')) {
        apiResponses++;
        if (response.status() >= 400) failures.push(`${response.status()} ${new URL(response.url()).pathname}`);
      }
    });
    await page.goto(base + '/login');
    await page.getByLabel('Student Number', { exact: true }).fill(qa[role]);
    await page.getByLabel('Password', { exact: true }).fill(qa.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL(base + (role === 'student' ? '/dashboard' : '/admin'));
    await settle(page);
    console.log(`PASS real ${role} sign-in`);
    return page;
  };
  try {
    const student = await login('student');
    for (const width of widths) {
      await student.setViewportSize({ width, height: 850 });
      for (const route of ['/dashboard', '/events', '/merit', '/stats', '/profile']) {
        await student.goto(base + route);
        await student.locator('main').waitFor();
        await settle(student);
        assert.equal(await student.getByRole('alert').count(), 0, `Student error on ${route}`);
      }
      await student.getByRole('button', { name: 'Open event pass', exact: true }).click();
      const qr = student.getByRole('img', { name: 'Your scannable student event pass' });
      await qr.waitFor();
      assert(await qr.evaluate(img => img.complete && img.naturalWidth > 0), 'Real QR image loaded');
      const dimensions = await qr.boundingBox();
      assert(Math.abs(dimensions.width - dimensions.height) < 1, 'QR remains square');
      await student.keyboard.press('Escape');
      console.log(`PASS live student pages and QR: ${width}px`);
    }
    await student.setViewportSize({ width: 320, height: 740 });
    await student.goto(base + '/events');
    await student.getByRole('button').filter({ has: student.getByRole('heading', { name: 'Mobile QA Campus Chess' }) }).click();
    const registerResponse = student.waitForResponse(r => r.url().endsWith(`/events/${qa.eventId}/register/`) && r.request().method() === 'POST');
    await student.getByRole('button', { name: 'Register to attend', exact: true }).click();
    assert.equal((await registerResponse).status(), 201);
    await student.getByText(/Your attendance reservation is confirmed/).waitFor();
    await student.keyboard.press('Escape');
    await student.reload();
    await student.getByRole('button').filter({ has: student.getByRole('heading', { name: 'Mobile QA Campus Chess' }) }).click();
    const cancelResponse = student.waitForResponse(r => r.url().endsWith(`/events/${qa.eventId}/cancel-registration/`) && r.request().method() === 'POST');
    await student.getByRole('button', { name: 'Cancel registration', exact: true }).click();
    assert.equal((await cancelResponse).status(), 200);
    await student.getByText('Your registration has been cancelled.').waitFor();
    console.log('PASS real registration persisted across reload, then cancellation');
    await student.goto(base + '/profile');
    await student.getByRole('button', { name: 'Edit contact information' }).click();
    await student.getByLabel('Emergency contact name', { exact: true }).fill('QA Contact');
    await student.getByRole('button', { name: 'Save changes', exact: true }).click();
    await student.getByRole('dialog').waitFor({ state: 'hidden' });
    await student.reload();
    await student.getByRole('button', { name: 'Edit contact information' }).click();
    assert.equal(await student.getByLabel('Emergency contact name', { exact: true }).inputValue(), 'QA Contact');
    await student.keyboard.press('Escape');
    console.log('PASS real profile form save persisted across reload');

    const admin = await login('admin');
    for (const width of widths) {
      await admin.setViewportSize({ width, height: 850 });
      for (const route of ['/admin', '/admin/events', '/admin/users', '/admin/attendance', '/admin/settings']) {
        await admin.goto(base + route);
        await admin.locator('main').waitFor();
        await settle(admin);
        assert.equal(await admin.getByRole('alert').count(), 0, `Admin error on ${route}`);
      }
      if (width < 1024) {
        await admin.getByRole('button', { name: 'Open admin navigation' }).click();
        await admin.getByRole('dialog').getByRole('link', { name: 'Events', exact: true }).click();
        await admin.waitForURL(base + '/admin/events');
        await admin.getByRole('dialog').waitFor({ state: 'hidden' });
      }
      console.log(`PASS live admin pages and navigation: ${width}px`);
    }
    await admin.setViewportSize({ width: 320, height: 740 });
    await admin.goto(base + '/admin/events');
    const row = admin.getByRole('row').filter({ hasText: 'Mobile QA Campus Chess' });
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await admin.getByLabel('Venue', { exact: false }).fill('Updated QA Hall');
    await admin.getByRole('button', { name: 'Save changes', exact: true }).click();
    await admin.getByRole('dialog').waitFor({ state: 'hidden' });
    await admin.reload();
    await admin.getByRole('row').filter({ hasText: 'Mobile QA Campus Chess' }).getByRole('button', { name: 'Edit', exact: true }).click();
    assert.equal(await admin.getByLabel('Venue', { exact: false }).inputValue(), 'Updated QA Hall');
    await admin.keyboard.press('Escape');
    console.log('PASS real admin event edit persisted across reload');
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    assert.deepEqual(failures, [], 'No failing API responses');
    console.log(`PASS ${apiResponses} real API responses; zero mocked responses or injected tokens`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
