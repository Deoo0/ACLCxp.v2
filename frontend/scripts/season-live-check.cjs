// Use mobile_qa_server.py --draft and Vite on 5174 with the isolated API on 8001.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const qa = JSON.parse(fs.readFileSync(process.env.QA_MANIFEST, 'utf8'));
assert(qa.database.startsWith('mobile_qa_'));
const base = 'http://127.0.0.1:5174';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const student = await browser.newPage({ viewport: { width: 375, height: 812 } });
    const admin = await browser.newPage();
    const signIn = async (page, role) => {
      await page.goto(base + '/login');
      await page.getByLabel('Student Number', { exact: true }).fill(qa[role]);
      await page.getByLabel('Password', { exact: true }).fill(qa.password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    };
    const request = (page, path, data) => page.evaluate(async ({api, path, data}) => {
      const response = await fetch(api + path, { method: data ? 'POST' : 'GET',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token'), 'Content-Type': 'application/json' },
        ...(data ? { body: JSON.stringify(data) } : {}) });
      return { status: response.status, data: await response.json() };
    }, {api: qa.api, path, data});
    await signIn(student, 'student');
    await student.getByRole('alert').filter({hasText: 'Student access is not open'}).waitFor();
    assert.equal(await student.evaluate(() => localStorage.getItem('access_token')), null);
    console.log('PASS Draft login denied with accurate message and no stored tokens');
    await signIn(admin, 'admin');
    await admin.waitForURL(base + '/admin');
    const transition = status => request(admin, `/api/seasons/${qa.seasonId}/transition/`, {status, adopt_existing: true});
    assert.equal((await transition('REGISTRATION')).status, 200);
    await signIn(student, 'student');
    await student.waitForURL(base + '/dashboard');
    await student.getByText('Season access', {exact:true}).waitFor();
    assert.equal(await student.getByRole('heading', {name:'Your student dashboard'}).count(), 0);
    assert.equal((await request(student, '/api/portal/summary/')).status, 403);
    assert.equal((await request(student, '/api/portal/event-pass/')).status, 403);
    console.log('PASS Registration is enrollment-only; direct API calls denied');
    assert.equal((await transition('ACTIVE')).status, 200);
    await student.reload();
    await student.getByRole('heading', {name:'Your student dashboard'}).waitFor();
    assert.equal((await request(student, '/api/portal/summary/')).status, 200);
    console.log('PASS Active season and valid ticket unlock workspace');
    const oldRefresh = await student.evaluate(() => localStorage.getItem('refresh_token'));
    assert.equal((await transition('CLOSED')).status, 200);
    assert.equal((await request(student, '/api/portal/summary/')).status, 403);
    const refreshResult = await student.request.post(qa.api + '/api/auth/token/refresh/', {data: {refresh: oldRefresh}});
    assert.equal(refreshResult.status(), 403);
    // The mounted gate polls the real access endpoint; stale cached content must disappear.
    await student.getByText('Season access', {exact:true}).waitFor({timeout: 40000});
    assert.equal(await student.getByRole('heading', {name:'Your student dashboard'}).count(), 0);
    await signIn(student, 'student');
    await student.getByRole('alert').filter({hasText: 'Student access is not open'}).waitFor();
    console.log('PASS Closed season blocks existing session, refresh, new login, and mounted workspace');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
