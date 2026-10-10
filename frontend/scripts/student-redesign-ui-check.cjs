const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge' });
 try {
  const page = await browser.newPage({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  let user = { id: 1, role: 'STUDENT', is_active: true, first_name: 'Alex', full_name: 'Alex Student', student_id: 'QA001', email: 'alex@example.test', program: 'Information Technology', year_level: 2, house_name: 'Azul', phone_number: '', contact_person: '', contact_number: '', bio: '', profile_photo: null };
  let summary = { points: 425, rank: 3, attendance: 4, registered: 2, houses: [{ id: 1, name: 'Azul', rank: 1, total_points: 800, member_count: 45, color_code: '#4488cc' }, { id: 2, name: 'Rojo', rank: 2, total_points: 500, member_count: 39, color_code: '#cc4455' }], settings: { merit_milestone: '300', announcement: '', support_email: 'support@example.test' } };
  let failSummary = false, emptyEvents = false, writes = 0;
  await page.addInitScript(() => localStorage.setItem('access_token', 'synthetic-ui-test'));
  await page.route('**/api/**', async route => {
   const request = route.request(), url = new URL(request.url());
   let json = { data: [], count: 0, next: null, previous: null };
   if (url.pathname === '/api/auth/me/') json = { data: { user } };
   if (url.pathname === '/api/seasons/access/') json = { can_access: true };
   if (url.pathname === '/api/portal/summary/') { if (failSummary) return route.fulfill({ status: 500, json: { detail: 'Unable to load your progress.' } }); json = summary; }
   if (url.pathname === '/api/events/') json = { data: emptyEvents ? [] : [{ id: 8, title: 'Campus creative challenge', event_date: '2026-10-12', start_time: '02:00:00', venue: 'School hall', category_name: 'Arts', teams: [] }], count: emptyEvents ? 0 : 1, next: null, previous: null };
   if (url.pathname === '/api/portal/event-pass/') json = { student: user, image: 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/></svg>').toString('base64') };
   if (url.pathname === '/api/users/1/' && request.method() === 'PATCH') { writes++; user = { ...user, ...request.postDataJSON() }; json = { data: user }; }
   await route.fulfill({ json });
  });
  const noOverflow = async () => { const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth })); assert(size.scroll <= size.width, JSON.stringify(size)); };
  const ready = async url => { await page.goto('http://127.0.0.1:5174' + url); await page.getByRole('heading', { level: 1 }).waitFor(); await page.locator('.xp-card').first().waitFor(); await noOverflow(); };
  await ready('/dashboard');
  assert.equal(await page.getByRole('progressbar', { name: 'Progress to next merit milestone' }).getAttribute('aria-valuenow'), '42');
  assert.equal(await page.getByRole('link', { name: /Campus creative challenge/ }).getAttribute('href'), '/events?event=8');
  await page.getByRole('button', { name: 'My event pass', exact: true }).click(); await page.getByRole('dialog', { name: 'My event pass', exact: true }).waitFor(); await page.keyboard.press('Escape');
  await ready('/stats');
  await page.getByRole('button', { name: 'My house', exact: true }).click(); assert.equal(await page.getByRole('list', { name: 'House standings' }).getByRole('listitem').count(), 1);
  await page.getByLabel('Search houses').fill('missing'); await page.getByText('No houses match your filters', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Clear house filters' }).click(); assert.equal(await page.getByRole('list', { name: 'House standings' }).getByRole('listitem').count(), 2);
  await page.getByText('How do the standings work?', { exact: true }).click(); assert(await page.getByText(/House standings use approved house points/).isVisible());
  await ready('/profile');
  await page.getByRole('button', { name: 'Complete my details' }).click(); await page.getByRole('dialog', { name: 'Contact information', exact: true }).waitFor();
  await page.getByLabel('Phone number', { exact: true }).fill('09123456789'); await page.getByLabel('About you', { exact: true }).fill('Campus explorer');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); await page.getByText('Campus explorer', { exact: true }).waitFor(); assert.equal(writes, 1);
  assert.equal(await page.getByRole('progressbar', { name: 'Profile completion' }).getAttribute('aria-valuenow'), '67');
  for (const width of [320, 375, 768, 1440]) {
   await page.setViewportSize({ width, height: 900 });
   for (const url of ['/dashboard', '/stats', '/profile']) { await ready(url); if ([375,1440].includes(width)) await page.screenshot({ path: path.join(process.env.STUDENT_REDESIGN_ARTIFACTS || os.tmpdir(), `aclcxp-${url.slice(1)}-${width}.png`), fullPage: true }); }
   await page.getByRole('button', { name: 'Edit contact information', exact: true }).click();
   const dialog = page.getByRole('dialog', { name: 'Contact information', exact: true });
   await dialog.waitFor(); assert(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), 'Profile editor overflows');
   await page.keyboard.press('Escape');
  }
  emptyEvents = true; summary = { ...summary, points: -5, rank: 0, attendance: 0, registered: 0, houses: [], settings: { ...summary.settings, merit_milestone: '-1' } };
  await ready('/dashboard'); await page.getByText('Your next adventure is on its way', { exact: true }).waitFor(); assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '0');
  await ready('/stats'); await page.getByText('The standings are taking shape', { exact: true }).waitFor();
  failSummary = true; await page.goto('http://127.0.0.1:5174/dashboard'); await page.getByRole('alert').waitFor(); failSummary = false; await page.getByRole('button', { name: 'Retry', exact: true }).click(); await page.getByText('Small steps. Great experiences.', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: dashboard, standings and profile at 320–1440px; milestone progress, house filters, event links, QR dialog, contact save and refresh, empty records, negative points, invalid milestone setting and API retry. Synthetic APIs.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
