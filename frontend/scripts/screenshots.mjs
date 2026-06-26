// Gera screenshots da aplicação para o README.
// Pré-requisitos: frontend em :4200, backend em :3333 e seed aplicado (demo@techx.com / demo123).
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../../docs/screenshots');
mkdirSync(outDir, { recursive: true });

const BASE = 'http://localhost:4200';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

async function shot(name) {
  await page.screenshot({ path: resolve(outDir, `${name}.png`) });
  console.log('saved', name);
}

// Login
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.waitForSelector('#email');
await shot('login');

await page.fill('#email', 'demo@techx.com');
await page.fill('#password', 'demo123');
await page.click('button[type="submit"]');

// Lista
await page.waitForURL('**/tasks', { timeout: 15000 });
await page.waitForSelector('.task-item', { timeout: 15000 });
await page.waitForTimeout(500);
await shot('list');

// Detalhes
await page.click('.task-body');
await page.waitForSelector('.modal', { timeout: 5000 });
await page.waitForTimeout(400);
await shot('details');
await page.keyboard.press('Escape');

// Kanban
await page.goto(`${BASE}/kanban`, { waitUntil: 'networkidle' });
await page.waitForSelector('.board', { timeout: 15000 });
await page.waitForTimeout(500);
await shot('kanban');

await browser.close();
console.log('Screenshots em', outDir);
