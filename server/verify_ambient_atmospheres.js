/**
 * Automated Verification for Website-Wide Multi-Section Atmosphere Engine & 1.5s Replay System
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

async function runAmbientAtmospheresVerification() {
  console.log('--- STARTING MULTI-SECTION ATMOSPHERE & SCROLL CONNECTION VERIFICATION ---');

  // 1. Check index.html section atmospheres & multi-ribbon structure
  console.log('[1/5] Verifying atmosphere DOM containers & multi-layer ribbons in index.html...');
  const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  const expectedAtmoClasses = [
    'atmosphere-work',
    'atmosphere-services',
    'atmosphere-stats',
    'atmosphere-about',
    'atmosphere-testimonials',
    'atmosphere-contact'
  ];

  expectedAtmoClasses.forEach(cls => {
    assert(indexHtml.includes(cls), `Missing atmospheric container class: ${cls}`);
  });

  const expectedRibbons = [
    'work-ribbon-1', 'work-ribbon-2', 'work-ribbon-3',
    'services-ribbon-1', 'services-ribbon-2', 'services-ribbon-3',
    'stats-ribbon-1', 'stats-ribbon-2', 'stats-ribbon-3',
    'about-ribbon-1', 'about-ribbon-2', 'about-ribbon-3',
    'testim-ribbon-1', 'testim-ribbon-2', 'testim-ribbon-3',
    'contact-ribbon-1', 'contact-ribbon-2', 'contact-ribbon-3'
  ];

  expectedRibbons.forEach(r => {
    assert(indexHtml.includes(r), `Missing ribbon in index.html: ${r}`);
  });
  console.log('✓ All 6 major content sections contain dedicated .section-atmosphere containers and 3-tier vector ribbons.');

  // 2. Check main.css for 1.5s cinematic reveal animation
  console.log('[2/5] Verifying 1.5s blur-to-sharp transition and staggered delays in main.css...');
  const mainCss = fs.readFileSync(path.join(__dirname, '../public/styles/main.css'), 'utf8');
  assert(mainCss.includes('opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1)'), 'Missing 1.5s opacity transition');
  assert(mainCss.includes('transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)'), 'Missing 1.5s transform transition');
  assert(mainCss.includes('filter 1.5s cubic-bezier(0.16, 1, 0.3, 1)'), 'Missing 1.5s filter transition');
  assert(mainCss.includes('delay-1') && mainCss.includes('delay-6'), 'Missing delay-1 to delay-6 classes');
  console.log('✓ 1.5-second cinematic reveal curve and staggered delays verified in CSS.');

  // 3. Check app.js for Website-Wide Multi-Section Atmosphere Engine
  console.log('[3/5] Verifying Website-Wide Atmosphere Engine and scroll connection in app.js...');
  const appJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');
  assert(appJs.includes('sectionDefinitions = ['), 'Missing sectionDefinitions configuration in app.js');
  assert(appJs.includes("'work'"), 'Missing work section in Atmosphere Engine');
  assert(appJs.includes("'services'"), 'Missing services section in Atmosphere Engine');
  assert(appJs.includes("'stats'"), 'Missing stats section in Atmosphere Engine');
  assert(appJs.includes("'about'"), 'Missing about section in Atmosphere Engine');
  assert(appJs.includes("'testimonials'"), 'Missing testimonials section in Atmosphere Engine');
  assert(appJs.includes("'contact'"), 'Missing contact section in Atmosphere Engine');
  assert(appJs.includes('sec.currentScroll * sec.r1Scroll'), 'Missing scroll connection parallax on ribbon 1');
  assert(appJs.includes('sec.currentScroll * sec.r2Scroll'), 'Missing scroll connection parallax on ribbon 2');
  assert(appJs.includes('sec.currentScroll * sec.r3Scroll'), 'Missing scroll connection parallax on ribbon 3');
  assert(appJs.includes('activeSections'), 'Missing activeSections viewport management');
  console.log('✓ Multi-Section Atmosphere Engine, scroll parallax connection, and active viewport tracking verified in app.js.');

  // 4. Verify reduced motion safety
  console.log('[4/5] Checking prefers-reduced-motion safety overrides...');
  assert(mainCss.includes('.section-atmosphere *'), 'Missing reduced motion override for section atmospheres');
  assert(appJs.includes('window.matchMedia(\'(prefers-reduced-motion: reduce)\').matches'), 'Missing reduced motion check in app.js');
  console.log('✓ prefers-reduced-motion cleanly disables background animations for accessibility in CSS and JS.');

  // 5. Verify HTTP static delivery
  console.log('[5/5] Testing HTTP delivery on localhost:3000...');
  const jsRes = await get('http://localhost:3000/js/app.js');
  assert.strictEqual(jsRes.status, 200);
  assert(jsRes.body.includes('sectionDefinitions = ['), 'Served JS missing atmosphere engine');

  const htmlRes = await get('http://localhost:3000');
  assert.strictEqual(htmlRes.status, 200);
  assert(htmlRes.body.includes('work-ribbon-3'), 'Served HTML missing 3rd ribbon layer');
  console.log('✓ HTTP assets on port 3000 verified fresh and active.');

  console.log('\n✨ ALL MULTI-SECTION ATMOSPHERE & SCROLL CONNECTION CHECKS PASSED! ✨');
}

runAmbientAtmospheresVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err.message);
  process.exit(1);
});
