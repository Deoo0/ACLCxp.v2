// Real QR decoding + real API, using synthetic QR camera frames in an isolated QA database.
// Start mobile_qa_server.py and Vite as documented in docs/mobile-live-validation.md.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const qa = JSON.parse(fs.readFileSync(process.env.QA_MANIFEST, 'utf8'));
assert(qa.database.startsWith('mobile_qa_'));
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ticket-qr-check-'));
const python = path.resolve(__dirname, '../../backend/venv/Scripts/python.exe');
const videoScript = `
import sys
import qrcode
from PIL import Image
qr=qrcode.make(sys.argv[2], box_size=6, border=4).convert('L')
canvas=Image.new('L',(480,480),255)
canvas.paste(qr,((480-qr.width)//2,(480-qr.height)//2))
y=canvas.point(lambda value:16+value*219//255).tobytes()
chroma=bytes([128])*(240*240*2)
with open(sys.argv[1],'wb') as output:
    output.write(b'YUV4MPEG2 W480 H480 F10:1 Ip A1:1 C420jpeg\\n')
    for frame in range(20): output.write(b'FRAME\\n'+y+chroma)
`;
(async () => {
  try {
    const cases = [
      ['12-digit text QR', qa.scanTicketNumber, 'ticket_number', qa.scanTicketNumber, 200],
      ['6-digit text QR', qa.scanShortTicketNumber, 'ticket_number', qa.scanShortTicketNumber, 200],
      ['text QR with surrounding whitespace', '  ' + qa.scanTicketNumber + '\n', 'ticket_number', qa.scanTicketNumber, 200],
      ['official token QR', qa.scanQrToken, 'qr_token', qa.scanQrToken, 200],
      ['unknown ticket QR', '000000000000', 'ticket_number', '000000000000', 400],
      ['already-used ticket QR', '999888777666', 'ticket_number', '999888777666', 409],
    ];
    for (const [index, [name, content, field, expected, status]] of cases.entries()) {
      const video = path.join(directory, `${index}.y4m`);
      const result = spawnSync(python, ['-c', videoScript, video, content], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      const browser = await chromium.launch({ channel: 'msedge', args: [
        '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
        `--use-file-for-fake-video-capture=${video}`,
      ] });
      try {
        const context = await browser.newContext({ viewport: { width: 375, height: 812 }, permissions: ['camera'] });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('http://127.0.0.1:5174/register');
        const responsePromise = page.waitForResponse(r => r.url().endsWith('/api/auth/registration/verify-ticket/'));
        await page.getByRole('button', { name: 'Scan Ticket QR Code', exact: true }).click();
        const response = await responsePromise;
        assert.deepEqual(response.request().postDataJSON(), { [field]: expected }, name);
        assert.equal(response.status(), status, name);
        if (status === 200) {
          await page.getByRole('heading', { name: 'Verify Student Identity' }).waitFor();
        } else {
          await page.getByRole('alert').waitFor();
          // A rejected scan can restart the camera without reloading the page.
          const retry = page.waitForResponse(r => r.url().endsWith('/api/auth/registration/verify-ticket/'));
          await page.getByRole('button', { name: 'Scan Ticket QR Code', exact: true }).click();
          assert.equal((await retry).status(), status);
          await page.getByRole('button', { name: 'Enter Ticket Number', exact: true }).click();
          await page.getByLabel('Ticket Number').fill(qa.scanTicketNumber);
          await page.getByRole('button', { name: 'Verify Ticket', exact: true }).click();
          await page.getByRole('heading', { name: 'Verify Student Identity' }).waitFor();
        }
        assert.deepEqual(errors, [], name);
        console.log(`PASS ${name}: decoded, correct request, API validation${status !== 200 ? ', retry and manual recovery' : ''}`);
      } finally { await browser.close(); }
    }
  } finally {
    const relative = path.relative(path.resolve(os.tmpdir()), path.resolve(directory));
    assert(relative.startsWith('ticket-qr-check-') && !relative.includes(path.sep), 'Cleanup stays inside the generated temp directory');
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
