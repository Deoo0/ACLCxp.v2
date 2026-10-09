// UI integration with synthetic APIs and a denied camera; no physical device used.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    let scannerRequests = 0;
    page.on('request', request => { if (request.url().includes('html5-qrcode')) scannerRequests++; });
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Synthetic denied camera', 'NotAllowedError'); };
    });
    await page.goto('http://127.0.0.1:5174/register');
    await page.getByRole('button', { name: 'Scan Ticket QR Code', exact: true }).waitFor();
    assert.equal(scannerRequests, 0, 'Registration downloaded the scanner before opening it');
    await page.getByRole('button', { name: 'Scan Ticket QR Code', exact: true }).click();
    await page.getByText('Camera unavailable', { exact: true }).waitFor();
    assert(scannerRequests > 0);
    await page.getByRole('button', { name: 'Cancel / enter manually' }).click();
    await page.getByRole('button', { name: 'Enter Ticket Number', exact: true }).waitFor();
    await page.close();

    const staff = await browser.newPage({ viewport: { width: 375, height: 812 } });
    let cameraCalls = 0, release;
    const blockedImport = new Promise(resolve => { release = resolve; });
    await staff.addInitScript(() => {
      localStorage.setItem('access_token', 'synthetic-ui-test');
      navigator.mediaDevices.getUserMedia = async () => {
        await window.reportCameraCall();
        throw new DOMException('Synthetic denied camera', 'NotAllowedError');
      };
    });
    await staff.exposeFunction('reportCameraCall', () => cameraCalls++);
    await staff.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      const json = path === '/api/auth/me/' ? { data: { user: { id: 1, role: 'STAFF', full_name: 'QA staff', is_active: true } } }
        : { events: [{ id: 1, title: 'QA event', points: 5, registration_required: false }] };
      return route.fulfill({ json });
    });
    let staffScannerRequests = 0;
    await staff.route('**/*html5-qrcode*', async route => { staffScannerRequests++; await blockedImport; await route.continue(); });
    await staff.goto('http://127.0.0.1:5174/staff/attendance');
    await staff.getByRole('button', { name: 'Scan once for the day', exact: true }).waitFor();
    assert.equal(staffScannerRequests, 0, 'Staff attendance eagerly downloaded the scanner');
    await staff.getByRole('button', { name: 'Scan once for the day', exact: true }).click();
    await staff.getByRole('button', { name: 'Close camera', exact: true }).click();
    release();
    // Reopening creates a new effect; the cancelled import must not start a camera.
    await staff.getByRole('button', { name: 'Scan once for the day', exact: true }).click();
    await staff.getByRole('alert').waitFor();
    assert.equal(cameraCalls, 1, 'Cancelled scanner started a camera after unmount');
    assert(staffScannerRequests > 0);
    console.log('PASS: registration and attendance defer scanner loading; cancelled imports do not start cameras.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
