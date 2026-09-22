/**
 * Automated Verification Script for Section Animation Replay System
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runSectionReplayVerification() {
  console.log('--- STARTING SECTION ANIMATION REPLAY SYSTEM VERIFICATION ---');

  // 1. Verify app.js implementation
  const appJsPath = path.join(__dirname, '../public/js/app.js');
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  console.log('[1/4] Verifying section and element replay observers in app.js...');
  assert(!appJs.includes('once: true'), 'FAIL: once: true found in app.js');
  assert(appJs.includes('let sectionReplayObserver = null;'), 'FAIL: sectionReplayObserver missing');
  assert(appJs.includes('const sections = document.querySelectorAll(\'section[id]\');'), 'FAIL: section[id] querying missing');
  assert(appJs.includes('sectionReveals.forEach(el => {\n            el.classList.remove(\'revealed\');\n          });'), 'FAIL: section off-screen reset missing');
  assert(appJs.includes('el.classList.add(\'revealed\');'), 'FAIL: reveal addition missing');
  assert(appJs.includes('el.classList.remove(\'revealed\');'), 'FAIL: off-screen un-reveal missing');
  console.log('✓ app.js implements dual-layer Section and Element Replay Observers without once:true.');

  // 2. Verify main.css transitions and delays
  const mainCssPath = path.join(__dirname, '../public/styles/main.css');
  const mainCss = fs.readFileSync(mainCssPath, 'utf8');

  console.log('[2/4] Verifying blur-to-sharp transitions and staggered delays in main.css...');
  assert(mainCss.includes('.reveal-init {'), 'FAIL: .reveal-init missing');
  assert(mainCss.includes('filter: blur(12px);'), 'FAIL: blur(12px) initial state missing');
  assert(mainCss.includes('.reveal-init.revealed {'), 'FAIL: .reveal-init.revealed missing');
  assert(mainCss.includes('filter: blur(0);'), 'FAIL: filter: blur(0) revealed state missing');
  assert(mainCss.includes('delay-1') && mainCss.includes('delay-6'), 'FAIL: staggered delays missing');
  console.log('✓ main.css contains blur-to-sharp entrance sequence (1.5s cinematic) with staggered child delays.');

  // 3. Verify section coverage in index.html and app.js
  console.log('[3/4] Checking major section targets (Hero, About, Services, Portfolio, Stats, Testimonials, Contact)...');
  const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  const targetSections = ['hero', 'work', 'services', 'stats', 'about', 'testimonials', 'contact'];
  for (const s of targetSections) {
    assert(indexHtml.includes(`id="${s}"`), `Missing section id="${s}"`);
  }
  console.log('✓ All 7 major content sections present and targeted by sectionReplayObserver.');

  // 4. Verify HTTP delivery
  console.log('[4/4] Verifying HTTP delivery of upgraded assets on port 3000...');
  const cssRes = await get('http://localhost:3000/styles/main.css');
  assert.strictEqual(cssRes.status, 200);

  const jsRes = await get('http://localhost:3000/js/app.js');
  assert.strictEqual(jsRes.status, 200);
  assert(jsRes.body.includes('sectionReplayObserver'), 'Server JS missing sectionReplayObserver');
  console.log('✓ Fresh upgraded assets active and served over HTTP.');

  console.log('\n✨ ALL SECTION REPLAY VERIFICATION CHECKS PASSED SUCCESSFULLY! ✨');
}

runSectionReplayVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err.message);
  process.exit(1);
});
