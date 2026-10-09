const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge' });
 try {
 const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
 let role = 'STUDENT', hidden = true, records = 0;
 const student = { full_name: 'Alex Student', student_id: 'QA001', house_name: 'Secret House' };
 const path = require('node:path');
 const { execFileSync } = require('node:child_process');
 const svg = execFileSync(path.resolve(__dirname, '../../backend/venv/Scripts/python.exe'), ['-c', 'import qrcode,qrcode.image.svg,sys; sys.stdout.buffer.write(qrcode.make("synthetic-student-pass-qa-token",image_factory=qrcode.image.svg.SvgPathImage,border=4).to_string())']);
 await page.addInitScript(() => localStorage.setItem('access_token', 'synthetic-ui-test'));
 await page.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname;
  let body = { data: [], count: 0 };
  if (path === '/api/auth/me/') body = { data: { user: { id: 1, ...student, role, first_name: 'Alex', last_name: 'Student', is_active: true } } };
  if (path === '/api/seasons/access/') body = { can_access: true };
  if (path === '/api/portal/summary/') body = { points: 12, rank: 3, attendance: 0, registered: 0, settings: {}, houses: hidden ? [{ id: -1, name: 'House at rank 1', rank: 1, total_points: 123, identity_hidden: true }] : [{ id: 42, name: 'Secret House', color_code: '#123456', logo_url: '', member_count: 50, rank: 1, total_points: 123 }] };
  if (path === '/api/portal/event-pass/') body = { student, image: 'data:image/svg+xml;base64,' + svg.toString('base64') };
  if (path === '/api/attendance/daily/') {
   if (route.request().method() === 'GET') body = { events: [{ id: 1, title: 'QA event', points: 5, registration_required: false }] };
   else { records++; assert.equal(route.request().postDataJSON().identity_proof, 'qa-preview-proof'); body = { student_name: student.full_name, approved: [{ id: 1, title: 'QA event' }], already_recorded: [], skipped: [] }; }
  }
  if (path === '/api/attendance/preview/') body = { ...student, identity_proof: 'qa-preview-proof' };
  await route.fulfill({ json: body });
 });
 await page.goto('http://127.0.0.1:5174/dashboard');
 await page.getByText('House at rank 1').waitFor();
 const leaderboard = page.locator('section, div').filter({ has: page.getByRole('heading', { name: 'House leaderboard', exact: true }) }).last();
 assert.equal(await leaderboard.locator('img').count(), 0);
 await page.getByRole('button', { name: 'QR Code', exact: true }).click();
 await page.getByRole('button', { name: 'Download QR card (PNG)' }).waitFor();
 assert(await page.getByRole('dialog').getByText('Secret House', { exact: true }).isVisible());
 const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download QR card (PNG)' }).click()]);
 assert.equal(download.suggestedFilename(), 'ACLCxp-student-pass.png');
 const output = process.env.QA_CARD_OUTPUT || path.join(require('node:os').tmpdir(), 'aclcxp-student-pass-qa.png');
 await download.saveAs(output);
 const image = fs.readFileSync(output);
 assert.equal(image.readUInt32BE(16), 900); assert.equal(image.readUInt32BE(20), 1200);
 const decoded = await page.evaluate(async base64 => {
  const module = await import('/node_modules/.vite/deps/html5-qrcode.js');
  const element = document.createElement('div'); element.id = 'qa-card-decoder'; document.body.append(element);
  const decoder = new (module.Html5Qrcode || module.default.Html5Qrcode)('qa-card-decoder');
  const blob = await (await fetch('data:image/png;base64,' + base64)).blob();
  try { return await decoder.scanFile(new File([blob], 'card.png', { type: 'image/png' }), false); }
  finally { decoder.clear(); element.remove(); }
 }, image.toString('base64'));
 assert.equal(decoded, 'synthetic-student-pass-qa-token');
 assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
 hidden = false;
 await page.getByRole('button', { name: 'Close event pass' }).click(); await page.reload();
 await page.getByRole('heading', { name: 'House leaderboard' }).waitFor();
 await page.getByLabel('Secret House logo unavailable').waitFor();
 role = 'STAFF'; await page.goto('http://127.0.0.1:5174/staff/attendance');
 await page.getByPlaceholder('For manual staff approval').fill('QA001');
 await page.getByRole('button', { name: 'Approve attendance for the day', exact: true }).click();
 await page.getByRole('dialog', { name: 'Verify student identity' }).waitFor();
 assert.equal(records, 0);
 await page.getByRole('button', { name: 'Cancel', exact: true }).click(); assert.equal(records, 0);
 await page.getByRole('button', { name: 'Approve attendance for the day', exact: true }).click();
 await page.getByRole('button', { name: 'Identity verified', exact: false }).click();
 await page.getByText('Approved: QA event', { exact: true }).waitFor(); assert.equal(records, 1);
 console.log('PASS: mobile PNG download, card dimensions, hidden/revealed house branding, preview/cancel/confirm attendance. Synthetic API fixtures.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
