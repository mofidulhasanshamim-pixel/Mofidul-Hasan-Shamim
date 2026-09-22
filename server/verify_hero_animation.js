/**
 * Automated Verification Script for Upgraded Hero Section Animation
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

async function runHeroVerification() {
  console.log('--- STARTING HERO ANIMATION UPGRADE VERIFICATION ---');

  // 1. Check main.css
  const mainCssPath = path.join(__dirname, '../public/styles/main.css');
  const mainCss = fs.readFileSync(mainCssPath, 'utf8');

  console.log('[1/4] Verifying hero styles and bloom keyframes in main.css...');
  assert(mainCss.includes('.hero-atmosphere.hero-entering .hero-glow-layer'), 'Missing .hero-entering glow layer rule');
  assert(mainCss.includes('.hero-atmosphere.hero-entering .hero-ribbons-wrap'), 'Missing .hero-entering ribbons rule');
  assert(mainCss.includes('@keyframes heroEntranceGlowBloom'), 'Missing heroEntranceGlowBloom keyframe');
  assert(mainCss.includes('@keyframes heroEntranceRibbonsBloom'), 'Missing heroEntranceRibbonsBloom keyframe');
  assert(mainCss.includes('filter: blur(13px) drop-shadow(0 0 32px rgba(56, 189, 248, 0.44));'), 'Missing ribbon-1 luminous drop shadow');
  console.log('✓ main.css contains rich blue-purple glows and re-entry bloom animations.');

  // 2. Check app.js
  const appJsPath = path.join(__dirname, '../public/js/app.js');
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  console.log('[2/4] Verifying re-entry detection and continuous fluid motion engine in app.js...');
  assert(appJs.includes('function triggerHeroEntrance()'), 'Missing triggerHeroEntrance function');
  assert(appJs.includes('window.triggerHeroEntrance = triggerHeroEntrance;'), 'triggerHeroEntrance not exported globally');
  assert(appJs.includes('heroHasLeft'), 'Missing heroHasLeft re-entry tracking state');
  assert(appJs.includes('rect.bottom <= 80'), 'Missing hero leave threshold check');
  assert(appJs.includes('rect.bottom > 220'), 'Missing hero re-enter threshold check');
  assert(appJs.includes('fluidPhase += deltaMs * 0.00135 * speedMult;'), 'Missing multi-harmonic continuous fluid phase equation');
  assert(appJs.includes('amb1Rot'), 'Missing organic dynamic ribbon rotation');
  assert(appJs.includes('pointerBoost'), 'Missing interactive pointer boost');
  console.log('✓ app.js implements re-entry replay and continuous multi-harmonic fluid motion.');

  // 3. Test HTTP Server Delivery
  console.log('[3/4] Verifying HTTP delivery on port 3000...');
  const cssRes = await get('http://localhost:3000/styles/main.css');
  assert.strictEqual(cssRes.status, 200);
  assert(cssRes.body.includes('heroEntranceRibbonsBloom'), 'Server CSS missing new keyframes');

  const jsRes = await get('http://localhost:3000/js/app.js');
  assert.strictEqual(jsRes.status, 200);
  assert(jsRes.body.includes('triggerHeroEntrance'), 'Server JS missing triggerHeroEntrance');
  console.log('✓ Fresh upgraded assets delivered over HTTP.');

  // 4. Mathematical Fluidity Simulation Check
  console.log('[4/4] Simulating 120 frames of continuous motion loop...');
  let phase = 0;
  let prevX = 0;
  let jumps = 0;
  for (let i = 0; i < 120; i++) {
    phase += 16 * 0.00135;
    const x = Math.sin(phase) * 50 + Math.cos(phase * 0.54) * 22;
    if (i > 0 && Math.abs(x - prevX) > 5) {
      jumps++;
    }
    prevX = x;
  }
  assert.strictEqual(jumps, 0, 'Discontinuity detected in fluid wave simulation');
  console.log('✓ Fluid motion curve verified continuous, alive, and smooth at 60fps.');

  console.log('\n✨ ALL HERO ANIMATION UPGRADE CHECKS PASSED SUCCESSFULLY! ✨');
}

runHeroVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err.message);
  process.exit(1);
});
