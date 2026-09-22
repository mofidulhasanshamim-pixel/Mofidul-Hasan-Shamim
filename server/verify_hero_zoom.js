/**
 * Hero Profile Image Hover Zoom Verification Test
 * Verifies that the desktop hover zoom interaction is implemented with subtle scale,
 * smooth cubic-bezier transition, no overflow/layout shift, and touch isolation.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function testHeroZoom() {
  console.log('🖼️ Starting Hero Profile Image Hover Zoom Verification...\n');

  const cssPath = path.join(__dirname, '../public/styles/main.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // 1. Profile Frame Container Constraints
  console.log('1. Checking profile frame container layout & overflow constraints...');
  assert(css.includes('.profile-frame-container {'), 'Missing .profile-frame-container in main.css');
  assert(css.includes('overflow: hidden;'), 'profile-frame-container must enforce overflow: hidden to prevent layout shift');
  assert(css.includes('border-radius: var(--radius-lg);'), 'profile-frame-container must preserve border-radius');
  console.log('   ✓ Container preserves border-radius and prevents overflow/layout shift');

  // 2. Profile Image Element Transition & Scale
  console.log('\n2. Checking profile image transition & transform properties...');
  assert(css.includes('.profile-image-elem {'), 'Missing .profile-image-elem styles in main.css');
  assert(css.includes('transform-origin: center center;'), 'Image must scale smoothly from center');
  assert(css.includes('transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)'), 'Must use smooth editorial cubic-bezier transition');
  console.log('   ✓ Smooth 0.65s cubic-bezier transition verified');

  // 3. Desktop Hover Zoom Isolation
  console.log('\n3. Checking desktop hover zoom isolation from touch screens...');
  assert(css.includes('@media (hover: hover) and (pointer: fine)'), 'Must isolate hover zoom under @media (hover: hover) and (pointer: fine)');
  assert(css.includes('transform: scale(1.048);'), 'Hover zoom must use subtle, non-excessive scale (1.048)');
  console.log('   ✓ Desktop hover zoom restricted to fine pointer devices (touch devices will not get stuck in zoom state)');

  console.log('\n====================================================');
  console.log('🎉 HERO IMAGE HOVER ZOOM INTERACTION VERIFIED!');
  console.log('====================================================\n');
}

try {
  testHeroZoom();
} catch (err) {
  console.error('\n❌ HERO ZOOM VERIFICATION FAILED:', err.message);
  process.exit(1);
}
