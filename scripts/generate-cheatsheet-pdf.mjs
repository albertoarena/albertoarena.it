import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import puppeteer from 'puppeteer';

const PORT = 4323;
const BASE_URL = `http://localhost:${PORT}`;
const PAGE_PATH = '/cheatsheets/spatie-event-sourcing/';
const OUTPUT_PATH = join(process.cwd(), 'public', 'downloads', 'spatie-event-sourcing-cheatsheet.pdf');

function waitForServer(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() > deadline) {
            reject(new Error(`Timed out waiting for ${url}`));
          } else {
            setTimeout(attempt, 300);
          }
        });
    };
    attempt();
  });
}

console.log('Building site...');
execSync('npx astro build', { stdio: 'inherit' });

console.log('Starting preview server...');
const preview = spawn('npx', ['astro', 'preview', '--port', String(PORT)], {
  stdio: ['ignore', 'pipe', 'inherit'],
});

let browser;
try {
  await waitForServer(BASE_URL);

  console.log('Printing cheat sheet to PDF...');
  browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulateMediaType('print');
  await page.goto(`${BASE_URL}${PAGE_PATH}`, { waitUntil: 'networkidle0' });

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  await page.pdf({
    path: OUTPUT_PATH,
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
  });

  console.log(`PDF written to ${OUTPUT_PATH}`);
  console.log('Open it and check page count / overflow before committing.');
} finally {
  if (browser) await browser.close();
  preview.kill();
}
