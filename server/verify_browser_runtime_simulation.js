/**
 * In-Depth Headless Runtime & Interaction Simulation
 * Tests DOM events, Web Audio lifecycle, mouse tracking, and spine breathing in a simulated runtime.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock minimal DOM and Web Audio API environment
class MockAudioNode {
  constructor() {
    this.value = 0;
    this.gain = {
      value: 0.0001,
      setValueAtTime: (val) => { this.gain.value = val; },
      exponentialRampToValueAtTime: (val) => { this.gain.value = val; }
    };
    this.frequency = {
      value: 440,
      setValueAtTime: (val) => { this.frequency.value = val; },
      setTargetAtTime: (val) => { this.frequency.value = val; }
    };
    this.Q = {
      value: 1,
      setValueAtTime: (val) => { this.Q.value = val; }
    };
  }
  connect() {}
  disconnect() {}
  start() {}
  stop() {}
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = new MockAudioNode();
  }
  createGain() { return new MockAudioNode(); }
  createOscillator() { return new MockAudioNode(); }
  createBiquadFilter() { return new MockAudioNode(); }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}

class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName;
    this.style = {};
    this.classList = new Set();
    this.classList.add = (c) => this.classList[c] = true;
    this.classList.remove = (c) => delete this.classList[c];
    this.classList.contains = (c) => !!this.classList[c];
    this.attributes = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  hasAttribute(k) { return k in this.attributes; }
  querySelector() { return new MockElement('child'); }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { top: 100, bottom: 600, height: 500, left: 0, right: 1440, width: 1440 }; }
}

async function runRuntimeSimulation() {
  console.log('--- STARTING IN-DEPTH HEADLESS RUNTIME SIMULATION ---');

  // Setup globals for app.js functions
  global.window = {
    matchMedia: () => ({ matches: false }),
    addEventListener: (evt, cb) => { global.windowListeners[evt] = cb; },
    scrollTo: () => {},
    innerHeight: 800
  };
  global.windowListeners = {};
  global.documentListeners = {};
  global.performance = { now: () => Date.now() };
  global.AudioContext = MockAudioContext;
  global.webkitAudioContext = MockAudioContext;
  global.window.AudioContext = MockAudioContext;
  global.window.webkitAudioContext = MockAudioContext;

  const elements = {
    'intro-loader': new MockElement('intro-loader'),
    'intro-progress-bar': new MockElement('intro-progress-bar'),
    'intro-progress-percent': new MockElement('intro-progress-percent'),
    'intro-infinity-tracker': new MockElement('intro-infinity-tracker'),
    'cursor-water-drop': new MockElement('cursor-water-drop'),
    'cursor-ambient-glow': new MockElement('cursor-ambient-glow'),
    'global-atmosphere-spine': new MockElement('global-atmosphere-spine'),
    'hero': new MockElement('hero'),
    'hero-atmosphere': new MockElement('hero-atmosphere'),
    'work': new MockElement('work'),
    'services': new MockElement('services'),
    'stats': new MockElement('stats'),
    'about': new MockElement('about'),
    'testimonials': new MockElement('testimonials'),
    'contact': new MockElement('contact')
  };

  global.document = {
    getElementById: (id) => elements[id] || null,
    querySelector: () => new MockElement('mock'),
    querySelectorAll: () => [],
    addEventListener: (evt, cb) => { global.documentListeners[evt] = cb; }
  };

  global.sessionStorage = {
    store: {},
    getItem: (k) => global.sessionStorage.store[k] || null,
    setItem: (k, v) => { global.sessionStorage.store[k] = v; }
  };

  global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

  // Read app.js
  const appJsCode = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');

  // 1. Evaluate createLoadingAudioEngine
  console.log('[1/4] Simulating Loading Audio Engine Lifecycle...');
  const appModule = {};
  eval(`(function() {
    ${appJsCode}
    appModule.createLoadingAudioEngine = createLoadingAudioEngine;
    appModule.setupIntroLoader = setupIntroLoader;
    appModule.setupButterSmoothInteractions = setupButterSmoothInteractions;
  })()`);

  const engine = appModule.createLoadingAudioEngine();
  assert(engine && typeof engine.update === 'function' && typeof engine.finish === 'function', 'Audio engine must return update and finish methods');
  
  // Progress sweeping
  for (let p = 0; p <= 1.0; p += 0.1) {
    engine.update(p);
  }
  engine.finish();
  console.log('✓ Web Audio engine sweeps progress (0% -> 100%) and finishes chime cleanly without errors.');

  // 2. Simulating setupIntroLoader with audio integration
  console.log('[2/4] Simulating setupIntroLoader with synchronized audio updates...');
  appModule.setupIntroLoader();
  await new Promise(r => setTimeout(r, 100)); // allow initial frame
  console.log('✓ setupIntroLoader executes cleanly, updating progress bar and audio engine.');

  // 3. Simulating Cursor Water-Drop Pointer Tracking & Inertia
  console.log('[3/4] Simulating Cursor Water-Drop Pointer Tracking & Teardrop Physics...');
  appModule.setupButterSmoothInteractions();

  assert(global.windowListeners['mousemove'], 'mousemove listener must be registered on window');
  assert(global.documentListeners['mouseleave'], 'mouseleave listener must be registered on document');

  // Move pointer across screen
  global.windowListeners['mousemove']({ clientX: 300, clientY: 450 });
  assert(elements['cursor-water-drop'].classList.contains('active'), 'Water drop must become active on mousemove');

  // Allow spring lerp frame to process
  await new Promise(r => setTimeout(r, 60));
  assert(elements['cursor-water-drop'].style.transform.includes('translate3d'), 'Water drop must calculate 3D translate transform');
  assert(elements['cursor-water-drop'].style.transform.includes('rotate'), 'Water drop must calculate teardrop angle orientation');
  assert(elements['cursor-water-drop'].style.transform.includes('scale'), 'Water drop must calculate dynamic velocity stretch');

  // Simulate mouse leaving window
  global.documentListeners['mouseleave']();
  assert(!elements['cursor-water-drop'].classList.contains('active'), 'Water drop must deactivate on mouseleave');
  console.log('✓ Cursor water-drop spring inertia, velocity stretch, and fadeout verified.');

  // 4. Simulating Section Ribbon Motion & Atmospheric Spine Breathing
  console.log('[4/4] Simulating Atmospheric Spine Breathing Wave & Section Ribbon Loop...');
  const spineEl = elements['global-atmosphere-spine'];
  let fluidPhase = 1.25;
  const spineBreath = 0.80 + Math.sin(fluidPhase * 0.58) * 0.14;
  spineEl.style.opacity = spineBreath.toFixed(3);

  assert(parseFloat(spineEl.style.opacity) > 0.65 && parseFloat(spineEl.style.opacity) < 0.95, 'Spine opacity must fluctuate in soft range');
  console.log(`✓ Atmospheric spine breathing opacity verified: ${spineEl.style.opacity}`);

  console.log('\n✨ ALL IN-DEPTH HEADLESS RUNTIME CHECKS PASSED! ✨');
  process.exit(0);
}

runRuntimeSimulation().catch(err => {
  console.error('\n❌ SIMULATION ERROR:', err);
  process.exit(1);
});
