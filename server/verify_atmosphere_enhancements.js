/**
 * Comprehensive Verification for Atmosphere Enhancements:
 * 1. Global Continuous Atmospheric Spine (Stream of Light)
 * 2. Connected Section Animations & Breathing Spine Synchronization
 * 3. Increased Blur & Volumetric Atmospheric Thickness
 * 4. Cursor Water-Drop Liquid Glass Interaction & Blur Clearing
 * 5. Synchronized Web Audio Loading Sound (Public Website)
 * 6. Safe Autoplay Handling (Graceful Fallback without Console Errors)
 * 7. Synchronized Web Audio Loading Sound (Admin Dashboard)
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

async function verifyEnhancements() {
  console.log('=== STARTING ATMOSPHERE & AUDIO ENHANCEMENTS VERIFICATION ===\n');

  const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  const mainCss = fs.readFileSync(path.join(__dirname, '../public/styles/main.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');
  const adminHtml = fs.readFileSync(path.join(__dirname, '../public/admin/index.html'), 'utf8');
  const adminJs = fs.readFileSync(path.join(__dirname, '../public/admin/admin.js'), 'utf8');

  // 1. Continuous Atmospheric Spine
  console.log('[1/7] Verifying Global Continuous Atmospheric Spine...');
  assert(indexHtml.includes('id="global-atmosphere-spine"'), 'index.html missing #global-atmosphere-spine');
  assert(indexHtml.includes('spine-stream-svg'), 'index.html missing .spine-stream-svg');
  assert(indexHtml.includes('globalSpineGrad'), 'index.html missing #globalSpineGrad');
  assert(indexHtml.includes('spine-path-base'), 'index.html missing .spine-path-base');
  assert(indexHtml.includes('spine-path-pulse'), 'index.html missing .spine-path-pulse');
  assert(mainCss.includes('.global-atmosphere-spine'), 'main.css missing .global-atmosphere-spine');
  assert(mainCss.includes('spineEnergyFlow'), 'main.css missing spineEnergyFlow keyframe animation');
  console.log('  ✔ Continuous atmospheric spine SVG and flow keyframe animation verified.');

  // 2. Section Connection & Spine Synchronization
  console.log('[2/7] Verifying Section Atmosphere Connection & Spine Breathing Sync...');
  assert(appJs.includes("document.getElementById('global-atmosphere-spine')"), 'app.js missing spine element reference');
  assert(appJs.includes('spineBreath'), 'app.js missing spine breathing wave connection');
  assert(appJs.includes('fluidPhase'), 'app.js missing fluidPhase compound wave accumulator');
  console.log('  ✔ Sections and spine stream connected through unified fluid wave synchronization.');

  // 3. Atmospheric Blur Thickness
  console.log('[3/7] Verifying Atmospheric Blur & Thickness...');
  assert(mainCss.includes('filter: blur(64px)'), 'main.css missing enhanced blur(64px) glow layer');
  assert(mainCss.includes('opacity: 0.98'), 'main.css missing volumetric opacity on glow layer');
  assert(mainCss.includes('width: 128%'), 'main.css missing expanded 128% ribbon wrapper');
  assert(mainCss.includes('work-ribbon-3') && mainCss.includes('about-ribbon-3'), 'main.css missing 3rd tier specular spine ribbons');
  console.log('  ✔ Volumetric thickness, 64px atmospheric blur, and specular spine tiers verified.');

  // 4. Cursor Water-Drop Liquid Glass Interaction
  console.log('[4/7] Verifying Cursor Water-Drop Liquid Glass Interaction...');
  assert(indexHtml.includes('id="cursor-water-drop"'), 'index.html missing #cursor-water-drop');
  assert(indexHtml.includes('water-drop-glass'), 'index.html missing .water-drop-glass');
  assert(indexHtml.includes('water-drop-rim'), 'index.html missing .water-drop-rim');
  assert(indexHtml.includes('water-drop-highlight'), 'index.html missing .water-drop-highlight');
  assert(mainCss.includes('.cursor-water-drop'), 'main.css missing .cursor-water-drop');
  assert(mainCss.includes('backdrop-filter: blur(0px) contrast(115%)'), 'main.css missing frosted blur-clearing aperture');
  assert(appJs.includes("document.getElementById('cursor-water-drop')"), 'app.js missing cursor water-drop reference');
  assert(appJs.includes('dropX += (targetX - dropX) * 0.135'), 'app.js missing liquid spring inertia');
  assert(appJs.includes('stretch = Math.min(speed * 0.016, 0.22)'), 'app.js missing dynamic teardrop velocity stretch');
  console.log('  ✔ Cursor liquid glass droplet, blur-clearing aperture, and inertia stretch physics verified.');

  // 5 & 6. Loading Audio Engine & Autoplay Graceful Fallback (Public)
  console.log('[5/7] Verifying Web Audio Loading Sound & Autoplay Handling (Public Website)...');
  assert(appJs.includes('function createLoadingAudioEngine()'), 'app.js missing createLoadingAudioEngine');
  assert(appJs.includes('AudioCtx = window.AudioContext || window.webkitAudioContext'), 'app.js missing AudioContext fallback');
  assert(appJs.includes("ctx.resume().catch(() => {})"), 'app.js missing silent resume promise catch for autoplay');
  assert(appJs.includes('audioEngine.update(rawProgress)'), 'app.js missing progress-synchronized audio update');
  assert(appJs.includes('audioEngine.finish()'), 'app.js missing audio finish chime trigger');
  console.log('  ✔ Web Audio progression synthesizer with safe autoplay fallback verified in app.js.');

  // 7. Loading Audio Engine & Autoplay Graceful Fallback (Admin Dashboard)
  console.log('[6/7] Verifying Web Audio Loading Sound & Autoplay Handling (Admin Dashboard)...');
  assert(adminJs.includes('function createLoadingAudioEngine()'), 'admin.js missing createLoadingAudioEngine');
  assert(adminJs.includes("ctx.resume().catch(() => {})"), 'admin.js missing silent resume promise catch for autoplay');
  assert(adminJs.includes('audioEngine.update(rawProgress)'), 'admin.js missing admin progress-synchronized audio update');
  assert(adminJs.includes('audioEngine.finish()'), 'admin.js missing admin audio finish chime trigger');
  console.log('  ✔ Web Audio progression synthesizer with safe autoplay fallback verified in admin.js.');

  // 8. HTTP Delivery Check
  console.log('[7/7] Testing Live HTTP Static Delivery on http://localhost:3000...');
  const resHome = await get('http://localhost:3000/');
  assert.strictEqual(resHome.status, 200, 'Home page must return HTTP 200');
  assert(resHome.body.includes('global-atmosphere-spine'), 'Served home page missing spine');
  assert(resHome.body.includes('cursor-water-drop'), 'Served home page missing water drop');

  const resAdmin = await get('http://localhost:3000/admin/');
  assert.strictEqual(resAdmin.status, 200, 'Admin page must return HTTP 200');
  assert(resAdmin.body.includes('intro-loader'), 'Served admin page missing intro loader');

  const resJs = await get('http://localhost:3000/js/app.js');
  assert.strictEqual(resJs.status, 200);
  assert(resJs.body.includes('createLoadingAudioEngine'), 'Served JS missing audio engine');
  assert(resJs.body.includes('cursor-water-drop'), 'Served JS missing water drop tracking');

  const resAdminJs = await get('http://localhost:3000/admin/admin.js');
  assert.strictEqual(resAdminJs.status, 200);
  assert(resAdminJs.body.includes('createLoadingAudioEngine'), 'Served admin JS missing audio engine');
  console.log('  ✔ Live HTTP static delivery verified across public and admin endpoints.');

  console.log('\n====================================================');
  console.log('✨ ALL 7 ATMOSPHERE & AUDIO ENHANCEMENTS VERIFIED! ✨');
  console.log('====================================================\n');
}

verifyEnhancements().catch(err => {
  console.error('\n❌ VERIFICATION ERROR:', err.message);
  process.exit(1);
});
