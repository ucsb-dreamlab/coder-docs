#!/usr/bin/env node
/**
 * Automated WCAG 2.1 AA accessibility checker using axe-core and Playwright.
 *
 * Scans all rendered HTML pages in build/ (excluding build/site_libs/) across
 * desktop and mobile viewports against WCAG 2.0 & 2.1 Level A and AA rules.
 *
 * Usage:
 *   node scripts/check-a11y.mjs [--render]
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axe from 'axe-core';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 375, height: 812 }
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function findChromeExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function findHtmlFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === 'site_libs') continue;
      files = files.concat(
        findHtmlFiles(path.join(dir, entry.name), path.posix.join(base, entry.name))
      );
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(path.posix.join(base, entry.name));
    }
  }
  return files.sort();
}

function startStaticServer(dir) {
  const server = http.createServer((req, res) => {
    const rawUrl = decodeURIComponent((req.url || '/').split('?')[0]);
    const safeRel = path.normalize(rawUrl).replace(/^(\.\.(\/|\\|$))+/, '');
    let filePath = path.join(dir, safeRel === '/' ? 'index.html' : safeRel);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
    });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  const shouldRender =
    process.argv.includes('--render') || !fs.existsSync(buildDir);

  if (shouldRender) {
    console.log('Rendering Quarto site...');
    execSync('quarto render', { cwd: rootDir, stdio: 'inherit' });
  }

  if (!fs.existsSync(buildDir)) {
    console.error(`Error: Build directory not found at ${buildDir}`);
    process.exit(1);
  }

  const pages = findHtmlFiles(buildDir);
  if (pages.length === 0) {
    console.error(`Error: No HTML files found in ${buildDir}`);
    process.exit(1);
  }

  const server = await startStaticServer(buildDir);
  const { port } = server.address();
  const executablePath = findChromeExecutable();

  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  let totalViolations = 0;
  const failedChecks = [];

  console.log(
    `Checking ${pages.length} pages across ${VIEWPORTS.length} viewports against WCAG 2.1 AA (${WCAG_TAGS.join(', ')})...\n`
  );

  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();

      for (const relPath of pages) {
        const url = `http://127.0.0.1:${port}/${relPath}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.addScriptTag({ content: axe.source });

        const results = await page.evaluate(async (tags) => {
          return await window.axe.run(document, {
            runOnly: {
              type: 'tag',
              values: tags
            }
          });
        }, WCAG_TAGS);

        const count = results.violations.length;
        if (count === 0) {
          console.log(`  PASS  [${viewport.name}] ${relPath}`);
        } else {
          totalViolations += count;
          failedChecks.push({
            page: relPath,
            viewport: viewport.name,
            violations: results.violations
          });
          console.log(
            `  FAIL  [${viewport.name}] ${relPath} (${count} rule violation${count === 1 ? '' : 's'})`
          );
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (failedChecks.length > 0) {
    console.error('\nAccessibility Violations Found (WCAG 2.1 AA):');
    for (const entry of failedChecks) {
      console.error(`\n--- ${entry.page} (${entry.viewport}) ---`);
      for (const v of entry.violations) {
        console.error(
          `  [${v.impact || 'unknown'}] ${v.id}: ${v.help} (${v.nodes.length} element${v.nodes.length === 1 ? '' : 's'})`
        );
        console.error(`  Help: ${v.helpUrl}`);
        for (const node of v.nodes) {
          console.error(`    Target: ${JSON.stringify(node.target)}`);
          console.error(`    HTML:   ${node.html}`);
          if (node.failureSummary) {
            console.error(
              `    Detail: ${node.failureSummary.replace(/\n\s*/g, ' ')}`
            );
          }
        }
      }
    }
    console.error(
      `\nFailed: ${totalViolations} violation(s) across ${failedChecks.length} page/viewport check(s).`
    );
    process.exit(1);
  }

  console.log(
    `\nSuccess: All ${pages.length} pages passed WCAG 2.1 AA accessibility checks across all viewports.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
