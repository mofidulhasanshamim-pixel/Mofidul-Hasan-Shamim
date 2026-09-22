/**
 * Automated Verification Script for Portfolio Scrolling System Fix
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

async function runVerification() {
  console.log('--- STARTING SCROLLING SYSTEM VERIFICATION ---');

  // 1. Static file checks: app.js
  const appJsPath = path.join(__dirname, '../public/js/app.js');
  const appJsContent = fs.readFileSync(appJsPath, 'utf8');

  console.log('[1/5] Checking public/js/app.js content...');
  assert(!appJsContent.includes('setupSmoothScroll()'), 'FAIL: setupSmoothScroll() still found in app.js');
  assert(!appJsContent.includes("addEventListener('wheel'"), 'FAIL: wheel event listener still found in app.js');
  assert(!appJsContent.includes('smoothScrollLoop'), 'FAIL: smoothScrollLoop still found in app.js');
  assert(appJsContent.includes('currentScrollY += (targetScrollY - currentScrollY) * 0.22;'), 'FAIL: responsive parallax scroll interpolation missing');
  assert(appJsContent.includes('if (entry.isIntersecting) {'), 'FAIL: clean entrance reveal trigger missing');
  console.log('✓ app.js is 100% free of wheel hijacking and has optimized responsive scroll tracking.');

  // 2. Static file checks: main.css
  const mainCssPath = path.join(__dirname, '../public/styles/main.css');
  const mainCssContent = fs.readFileSync(mainCssPath, 'utf8');

  console.log('[2/5] Checking public/styles/main.css content...');
  assert(!mainCssContent.includes('backdrop-filter: blur(1px)'), 'FAIL: body::after backdrop-filter blur still present in main.css');
  assert(mainCssContent.includes('will-change: opacity, transform;'), 'FAIL: .reveal-init will-change optimization missing');
  console.log('✓ main.css compositor optimizations verified (no fullscreen blur overhead).');

  // 3. HTTP Server Endpoints
  console.log('[3/5] Testing HTTP server static asset delivery on port 3000...');
  const indexRes = await get('http://localhost:3000/');
  assert.strictEqual(indexRes.status, 200, `Expected 200 from /, got ${indexRes.status}`);
  assert(indexRes.body.includes('Mofidul'), 'Expected index.html to contain brand text');

  const cssRes = await get('http://localhost:3000/styles/main.css');
  assert.strictEqual(cssRes.status, 200, `Expected 200 from main.css, got ${cssRes.status}`);

  const jsRes = await get('http://localhost:3000/js/app.js');
  assert.strictEqual(jsRes.status, 200, `Expected 200 from app.js, got ${jsRes.status}`);
  assert(!jsRes.body.includes('setupSmoothScroll()'), 'Server served app.js contains old smooth scroll code');
  console.log('✓ HTTP static delivery verified: fresh assets served with HTTP 200.');

  // 4. API Endpoints
  console.log('[4/5] Testing public content API endpoint...');
  const apiRes = await get('http://localhost:3000/api/public/content');
  assert.strictEqual(apiRes.status, 200, `Expected 200 from /api/public/content, got ${apiRes.status}`);
  const apiData = JSON.parse(apiRes.body);
  assert(apiData.success, 'Expected success=true');
  assert(apiData.data.hero, 'Expected hero data');
  assert(apiData.data.projects, 'Expected projects data');
  console.log('✓ Public CMS content API operational and healthy.');

  // 5. Section Scroll Structure Integrity
  console.log('[5/5] Checking Section IDs and Navigation targets in index.html...');
  const indexHtmlPath = path.join(__dirname, '../public/index.html');
  const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  const expectedSections = ['hero', 'work', 'services', 'stats', 'about', 'contact'];
  for (const sec of expectedSections) {
    assert(indexHtmlContent.includes(`id="${sec}"`), `Missing section with id="${sec}"`);
    if (sec !== 'hero') {
      assert(indexHtmlContent.includes(`href="#${sec}"`), `Missing nav link pointing to #${sec}`);
    }
  }
  console.log('✓ All navigation targets and sections match perfectly.');

  console.log('\n✨ ALL 5 VERIFICATION CHECKS PASSED SUCCESSFULLY! ✨');
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err.message);
  process.exit(1);
});
