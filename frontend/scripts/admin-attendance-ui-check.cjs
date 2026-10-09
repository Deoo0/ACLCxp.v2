const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge' });
 try {
  const page = await browser.newPage({ viewport: { width: 320, height: 812 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  let dailyWrites = 0, eventWrites = 0, corrections = 0, exported, previewRelease, previewStarted;
  let dailyAvailable = true, ongoing = true;
  const student = { full_name: 'Alex Student', student_id: 'QA001', house_name: 'Azul', identity_proof: 'qa-proof' };
  const chess = { id: 7, title: 'Chess check-in', venue: 'School hall', event_date: '2026-10-09', status: 'ONGOING', attendance_mode: 'PER_EVENT', participation_points: 5, registration_required: false };
  const row = { id: 1, event: 7, event_title: chess.title, student_id: 'QA001', student_name: student.full_name, scanned_at: '2026-10-09T02:00:00Z', is_valid: true };
  await page.addInitScript(() => localStorage.setItem('access_token', 'synthetic-ui-test'));
  await page.route('**/api/**', async route => {
   const url = new URL(route.request().url()), request = route.request(), method = request.method(); let json = { data: [], count: 0, next: null, previous: null };
   if (url.pathname === '/api/auth/me/') json = { data: { user: { id: 1, role: 'ADMIN', full_name: 'QA Administrator', is_active: true } } };
   if (url.pathname === '/api/admin/users/filter-options/') json = { houses: [{ id: 1, name: 'Azul' }], programs: ['BSIT'], year_levels: [1], roles: [] };
   if (url.pathname === '/api/events/filter-options/') json = { years: [2026] };
   if (url.pathname === '/api/admin/field-limits/') json = {};
   if (url.pathname === '/api/attendance/daily/') {
    if (method === 'GET') json = { events: dailyAvailable ? [{ id: 2, title: 'Daily sports', registration_required: false, points: 5 }] : [] };
    else { dailyWrites++; assert.equal(request.postDataJSON().identity_proof, 'qa-proof'); json = { student_name: student.full_name, approved: [{ id: 2, title: 'Daily sports' }], already_recorded: [], skipped: [] }; }
   }
   if (url.pathname === '/api/events/') {
    if (url.searchParams.get('status') === 'ONGOING') assert.equal(url.searchParams.get('attendance_mode'), 'PER_EVENT');
    const second = url.searchParams.get('page') === '2';
    json = { count: 13, data: [{ ...chess, id: second ? 8 : 7, title: second ? 'Volleyball check-in' : chess.title }], next: second ? null : '/api/events/?page=2', previous: second ? '/api/events/?page=1' : null };
   }
   if (url.pathname === '/api/events/7/') json = { ...chess, status: ongoing ? 'ONGOING' : 'COMPLETED' };
   if (url.pathname === '/api/attendance/preview/') { if (previewRelease) { previewStarted(); await previewRelease; previewRelease = null; } json = student; }
   if (url.pathname === '/api/admin/attendance/check_in/') { eventWrites++; assert.equal(request.postDataJSON().event, 7); assert.equal(request.postDataJSON().identity_proof, 'qa-proof'); json = row; }
   if (url.pathname === '/api/admin/attendance/') json = { count: 1, data: [row], next: null, previous: null };
   if (url.pathname === '/api/admin/attendance/1/correct/') { corrections++; const body = request.postDataJSON(); assert.equal(body.is_valid, false); assert.equal(body.reason, 'Confirmed absence'); row.is_valid = false; json = row; }
   if (url.pathname === '/api/admin/attendance/export/') { exported = url; return route.fulfill({ contentType: 'text/csv', body: 'Student,Event\nAlex Student,Chess\n' }); }
   await route.fulfill({ json });
  });
  const noOverflow = async () => {
   const overflow = await page.evaluate(() => ({ width: window.innerWidth, scroll: document.documentElement.scrollWidth, url: location.href, elements: Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 12).map(el => ({ tag: el.tagName, cls: el.className, right: el.getBoundingClientRect().right })) }));
   assert(overflow.scroll <= overflow.width, JSON.stringify(overflow));
  };
  await page.goto('http://127.0.0.1:5174/admin/attendance');
  await page.getByRole('heading', { name: 'Daily attendance approval' }).waitFor();
  assert(await page.getByRole('link', { name: 'Open attendance', exact: true }).isVisible());
  assert.equal(await page.getByRole('button', { name: 'Download CSV', exact: true }).count(), 0);
  await noOverflow(); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(os.tmpdir(), 'aclcxp-attendance-daily-320.png'), fullPage: true });
  await page.getByLabel('Or enter a student number').fill('QA001');
  let release; previewRelease = new Promise(resolve => { release = resolve; }); const started = new Promise(resolve => { previewStarted = resolve; });
  await page.getByRole('button', { name: 'Find student', exact: true }).click(); await started;
  assert(await page.getByLabel('Attendance date', { exact: true }).isDisabled());
  assert(await page.getByRole('button', { name: 'Scan once for the day' }).isDisabled());
  release();
  const dialog = page.getByRole('dialog', { name: 'Verify student identity', exact: true }); await dialog.waitFor();
  assert.equal(dailyWrites, 0);
  assert(await dialog.getByRole('button', { name: 'Cancel', exact: true }).evaluate(el => el === document.activeElement));
  await page.keyboard.press('Tab'); assert(await dialog.evaluate(el => el.contains(document.activeElement)));
  await noOverflow(); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(os.tmpdir(), 'aclcxp-attendance-identity-320.png') });
  await page.keyboard.press('Escape'); assert.equal(dailyWrites, 0);
  await page.getByRole('button', { name: 'Find student', exact: true }).click(); await dialog.waitFor();
  await dialog.getByRole('button', { name: /Identity verified/ }).click();
  await page.getByText('Attendance approved', { exact: true }).waitFor(); assert.equal(dailyWrites, 1);
  await page.getByText('Review approval results', { exact: true }).click(); await page.getByText('Approved: Daily sports', { exact: true }).waitFor();
  assert(await page.getByRole('button', { name: 'Scan next student', exact: true }).isVisible());
  dailyAvailable = false; await page.getByRole('button', { name: 'Refresh events', exact: true }).click();
  await page.getByText('0 events available', { exact: true }).waitFor(); assert(await page.getByRole('button', { name: 'Scan once for the day' }).isDisabled());
  await page.getByRole('navigation', { name: 'Attendance workflows' }).getByRole('link', { name: /Event check-in/ }).click();
  await page.getByRole('button', { name: /Chess check-in/ }).waitFor(); await page.getByRole('button', { name: 'More events' }).click();
  await page.getByRole('button', { name: /Volleyball check-in/ }).waitFor(); await page.getByRole('button', { name: 'Previous events' }).click();
  await page.getByRole('button', { name: /Chess check-in/ }).click(); await page.getByRole('button', { name: 'Find student', exact: true }).waitFor();
  await page.getByLabel('Or enter a student number').fill('QA001'); await page.getByRole('button', { name: 'Find student', exact: true }).click(); await dialog.waitFor();
  assert.equal(eventWrites, 0); await dialog.getByRole('button', { name: /Identity verified/ }).click(); await page.getByText('Attendance confirmed', { exact: true }).waitFor(); assert.equal(eventWrites, 1);
  ongoing = false; await page.getByRole('button', { name: 'Refresh event', exact: true }).click(); await page.getByText(/This event is no longer available/).waitFor(); assert(await page.getByRole('button', { name: 'Scan QR pass', exact: true }).isDisabled());
  await page.getByRole('navigation', { name: 'Attendance workflows' }).getByRole('link', { name: /Records/ }).click();
  await page.getByRole('button', { name: 'Manage Alex Student', exact: true }).filter({ visible: true }).waitFor();
  await noOverflow(); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(os.tmpdir(), 'aclcxp-attendance-records-320.png'), fullPage: true });
  await page.getByPlaceholder('Student name, number, or event').fill('QA001');
  await page.locator('summary').filter({ hasText: 'Filters' }).click();
  await page.getByRole('combobox', { name: /House/ }).selectOption('1'); await page.getByRole('combobox', { name: /Attendance status/ }).selectOption('true');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download CSV', exact: true }).click()]);
  assert(download.suggestedFilename().endsWith('.csv')); assert.equal(exported.searchParams.get('search'), 'QA001'); assert.equal(exported.searchParams.get('house'), '1'); assert.equal(exported.searchParams.get('is_valid'), 'true');
  await page.getByRole('button', { name: 'Manage Alex Student', exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'Void attendance', exact: true }).click();
  await page.getByLabel('Reason for correction').fill('Confirmed absence'); await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).waitFor(); assert.equal(corrections, 1);
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  for (const width of [320, 375, 768, 1440]) {
   await page.setViewportSize({ width, height: 900 }); await noOverflow();
   await page.goto('http://127.0.0.1:5174/admin/attendance?view=event'); await page.getByRole('heading', { name: 'Event check-in', exact: true }).waitFor(); await noOverflow();
   if (width === 1440) await page.screenshot({ path: path.join(os.tmpdir(), 'aclcxp-attendance-event-1440.png'), fullPage: true });
   await page.goto('http://127.0.0.1:5174/admin/attendance?view=records'); await page.getByRole('heading', { name: 'Attendance records', exact: true }).waitFor(); await noOverflow();
  }
  assert.deepEqual(errors, []);
  console.log('PASS: 320-1440px layout, attendance shortcut, modes, busy guards, keyboard/cancel/confirm identity, daily/event check-in, pagination, unavailable events, filtered export, and correction. Synthetic APIs.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
