const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge' });
 try {
  const page = await browser.newPage({ viewport: { width: 320, height: 812 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  let reservations = [], reserveWrites = 0, cancelWrites = 0, failReserve = true;
  const events = [
   { id: 1, title: 'Full chess event', available_slots: 0, allow_waitlist: true, registration_required: true, attendance_mode: 'PER_EVENT' },
   { id: 2, title: 'Open house activities', registration_required: false, attendance_mode: 'DAILY' },
   { id: 3, title: 'No-scan exhibit', registration_required: false, attendance_mode: 'NONE' },
   { id: 4, title: 'Student sports event', registration_required: true, attendance_mode: 'PER_EVENT' },
   { id: 5, title: 'Completed art event', status: 'COMPLETED', registration_required: false, attendance_mode: 'NONE' },
   { id: 6, title: 'Cancelled trip', status: 'CANCELLED', registration_required: true, attendance_mode: 'PER_EVENT' },
  ].map(event => ({ available_slots: 5, allow_waitlist: false, event_date: '2099-01-01', start_time: '10:00:00', end_time: null, status: 'PUBLISHED', venue: 'School hall', category_name: 'Campus activity', participation_points: 5, description: 'A student-friendly activity.', teams: [], ...event }));
  const attendance = [
   { id: 4, event_title: 'Verified sports', status: 'ATTENDED', signed_by: 'School staff', scanned_at: '2026-10-09T02:00:00Z', validation_notes: 'Confirmed in person' },
   { id: 2, event_title: 'Open house activities', status: 'PENDING' },
   { id: 3, event_title: 'Review exhibit', status: 'INVALID', validation_notes: 'Ask the organizer for review' },
  ].map(row => ({ category: 'Campus activity', event_date: '2026-12-31', start_time: '18:00:00', signed_by: null, scanned_at: null, validation_notes: '', detail: 'School attendance record', ...row }));
  const points = [{ id: 1, points: 30, reason: 'Sports award', event: 4, event_title: 'Student sports event', transaction_type: 'PERFORMANCE', created_at: '2026-10-09T02:00:00Z' }, { id: 2, points: -5, reason: 'Approved correction', event: null, event_title: null, transaction_type: 'PENALTY', created_at: '2026-10-09T03:00:00Z' }];
  await page.addInitScript(() => localStorage.setItem('access_token', 'synthetic-ui-test'));
  await page.route('**/api/**', async route => {
   const request = route.request(), url = new URL(request.url()), method = request.method();
   let json = { data: [], count: 0, next: null, previous: null };
   if (url.pathname === '/api/auth/me/') json = { data: { user: { id: 1, role: 'STUDENT', is_active: true, first_name: 'Alex', full_name: 'Alex Student', student_id: 'QA001' } } };
   if (url.pathname === '/api/seasons/access/') json = { can_access: true };
   if (url.pathname === '/api/portal/event-pass/') json = { student: { full_name: 'Alex Student', student_id: 'QA001', house_name: 'Azul' }, image: 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/></svg>').toString('base64') };
   if (url.pathname === '/api/portal/attendance-overview/') {
    const selected = attendance.filter(row => (!url.searchParams.get('status') || row.status === url.searchParams.get('status')) && row.event_title.toLowerCase().includes((url.searchParams.get('search') || '').toLowerCase()));
    const second = url.searchParams.get('page') === '2';
    json = { data: second ? [attendance[2]] : selected, count: selected.length ? 21 : 0, next: second || !selected.length ? null : '/api/portal/attendance-overview/?page=2', previous: second ? '/api/portal/attendance-overview/?page=1' : null, summary: { attended: 2, pending: 1, absent: 1, invalid: 1, total: 5, points: 25, rate: 40, season: 'Current school season' } };
   }
   if (url.pathname === '/api/portal/merit/') {
    const data = points.filter(row => row.reason.toLowerCase().includes((url.searchParams.get('search') || '').toLowerCase()));
    json = { data, count: data.length, previous: null, next: null };
   }
   if (url.pathname === '/api/events/') {
    const filtered = events.filter(event => (!url.searchParams.get('status') || event.status === url.searchParams.get('status')) && (url.searchParams.get('upcoming') !== 'true' || ['PUBLISHED', 'ONGOING'].includes(event.status)));
    json = { data: filtered.map(event => ({ ...event, registration_status: reservations.find(row => row.event === event.id)?.status || null })), count: filtered.length, next: null, previous: null };
   }
   if (url.pathname === '/api/events/my-registrations/') { const data = reservations.filter(row => row.event_title.toLowerCase().includes((url.searchParams.get('search') || '').toLowerCase())); json = { data, count: data.length, previous: null, next: null }; }
   const detail = url.pathname.match(/^\/api\/events\/(\d+)\/$/);
   if (detail) {
    const event = events.find(row => row.id === Number(detail[1]));
    if (!event) return route.fulfill({ status: 404, json: { detail: 'This event is not available.' } });
    json = { ...event, registration_status: reservations.find(row => row.event === event.id)?.status || null };
   }
   const action = url.pathname.match(/^\/api\/events\/(\d+)\/(register|cancel-registration)\/$/);
   if (action && method === 'POST') {
    const id = Number(action[1]), event = events.find(row => row.id === id);
    if (action[2] === 'register') {
     reserveWrites++;
     if (id === 4 && failReserve) { failReserve = false; return route.fulfill({ status: 409, json: { detail: 'Registration temporarily unavailable. Try again.' } }); }
     const row = { id, event: id, event_title: event.title, status: id === 1 ? 'WAITLISTED' : 'REGISTERED', waitlist_position: id === 1 ? 3 : null, registered_at: '2026-10-09T02:00:00Z', cancellation_reason: '' };
     reservations = reservations.filter(item => item.event !== id).concat(row); json = { data: row };
    } else { cancelWrites++; const row = reservations.find(row => row.event === id); row.status = 'CANCELLED'; row.cancellation_reason = 'Cancelled by student'; json = { data: row }; }
   }
   await route.fulfill({ json });
  });
  const noOverflow = async () => {
   const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
   assert(size.scroll <= size.width, JSON.stringify(size));
   const modal = page.getByRole('dialog'); if (await modal.count()) assert(await modal.first().evaluate(el => el.scrollWidth <= el.clientWidth), 'Dialog overflows');
  };
  await page.goto('http://127.0.0.1:5174/merit');
  await page.getByRole('heading', { name: 'My attendance', exact: true }).waitFor();
  await page.getByText('Verified sports', { exact: true }).waitFor(); await noOverflow();
  await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: path.join(os.tmpdir(), 'aclcxp-student-merit-320.png'), fullPage: true });
  assert(await page.getByRole('list').getByText('Needs review', { exact: true }).isVisible());
  assert(await page.getByText(/Jan 1, 2027/).first().isVisible());
  await page.getByRole('button', { name: /^Attended/ }).click();
  assert.equal(await page.getByRole('combobox', { name: 'Filter attendance status' }).inputValue(), 'ATTENDED');
  await page.getByRole('button', { name: 'Clear attendance filters', exact: true }).click();
  await page.getByRole('button', { name: 'Next attendance page', exact: true }).click();
  await page.getByRole('button', { name: 'Previous attendance page', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Previous attendance page', exact: true }).click();
  await page.getByRole('navigation', { name: 'Merit views' }).getByRole('link', { name: 'Points history', exact: true }).click();
  await page.getByText('Sports award', { exact: true }).waitFor(); assert(await page.getByText('-5', { exact: false }).isVisible());
  await page.getByLabel('Search points history').fill('correction'); await page.getByText('Approved correction', { exact: true }).waitFor();
  await page.waitForFunction(() => !Array.from(document.querySelectorAll('h3')).some(el => el.textContent === 'Sports award'));
  await page.getByRole('button', { name: 'My QR pass', exact: true }).click(); await page.getByRole('dialog', { name: 'My event pass', exact: true }).waitFor(); await page.keyboard.press('Escape');
  await page.goto('http://127.0.0.1:5174/events');
  await page.getByRole('button', { name: 'View event: Full chess event', exact: true }).click();
  await page.getByRole('button', { name: 'Join waitlist', exact: true }).waitFor(); await noOverflow();
  await page.screenshot({ path: path.join(os.tmpdir(), 'aclcxp-student-event-details-320.png') });
  await page.getByRole('button', { name: 'Join waitlist', exact: true }).click(); await page.getByText(/You joined the waitlist/).waitFor(); assert.equal(reserveWrites, 1);
  await page.getByRole('button', { name: 'Close event details', exact: true }).click();
  await page.getByRole('navigation', { name: 'Event views' }).getByRole('link', { name: 'My reservations', exact: true }).click();
  await page.getByText('Waitlist order: #3.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'View event', exact: true }).click(); await page.getByRole('button', { name: 'Cancel reservation', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Cancel reservation', exact: true }).click(); assert.equal(cancelWrites, 0);
  await page.getByRole('button', { name: 'Keep reservation', exact: true }).click(); assert.equal(cancelWrites, 0);
  await page.getByRole('button', { name: 'Cancel reservation', exact: true }).click(); await page.getByRole('button', { name: 'Confirm cancellation', exact: true }).click();
  await page.getByText(/Your attendance reservation was cancelled/).waitFor(); assert.equal(cancelWrites, 1); await page.keyboard.press('Escape');
  await page.goto('http://127.0.0.1:5174/events?event=4');
  await page.getByRole('button', { name: 'Reserve attendance place', exact: true }).click(); await page.getByRole('alert').waitFor();
  await page.getByRole('button', { name: 'Reserve attendance place', exact: true }).click(); await page.getByText(/Your attendance reservation is confirmed/).waitFor();
  await page.getByRole('button', { name: 'Show my QR pass', exact: true }).click(); await page.getByRole('dialog', { name: 'My event pass', exact: true }).waitFor(); assert.equal(await page.getByRole('dialog').count(), 1); await page.keyboard.press('Escape');
  await page.goto('http://127.0.0.1:5174/events?event=2'); await page.getByRole('button', { name: 'Show my QR pass', exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Reserve attendance place', exact: true }).count(), 0); await page.keyboard.press('Escape');
  await page.goto('http://127.0.0.1:5174/events?event=3'); await page.getByText('No reservation or attendance scan is required.', { exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Show my QR pass', exact: true }).count(), 0); await page.keyboard.press('Escape');
  await page.goto('http://127.0.0.1:5174/events?event=999'); await page.getByRole('alert').waitFor(); await page.getByRole('button', { name: 'Close event details', exact: true }).click();
  await page.getByRole('combobox', { name: 'Filter event status' }).selectOption('COMPLETED'); await page.getByText('Event ended · Check your merit record', { exact: true }).waitFor();
  await page.getByRole('combobox', { name: 'Filter event status' }).selectOption('CANCELLED'); await page.getByText('Event cancelled · No new reservations', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'View event: Cancelled trip', exact: true }).click(); await page.getByText('This event was cancelled. No new reservations or check-ins are available.', { exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Reserve attendance place', exact: true }).count(), 0); await page.keyboard.press('Escape');
  for (const width of [320, 375, 768, 1440]) {
   await page.setViewportSize({ width, height: 900 });
   for (const url of ['/merit', '/merit?view=points', '/events', '/events?view=reservations', '/events?event=4']) {
    await page.goto('http://127.0.0.1:5174' + url);
    if (url.includes('event=4')) await page.getByRole('button', { name: 'Show my QR pass', exact: true }).waitFor();
    else await page.getByRole('heading', { level: 1 }).waitFor();
    await noOverflow();
    if (width === 1440 && url === '/events') await page.screenshot({ path: path.join(os.tmpdir(), 'aclcxp-student-events-1440.png'), fullPage: true });
   }
  }
  assert.deepEqual(errors, []);
  console.log('PASS: student Merit and Events at 320-1440px, status filters, points and deductions, pagination, Philippine times, reservations/waitlist, cancellation confirmation, API errors, direct event links, and QR access. Synthetic APIs.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
