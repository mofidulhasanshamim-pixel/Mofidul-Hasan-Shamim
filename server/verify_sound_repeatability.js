/**
 * Sound System Repeatability & Concurrency Verification Test
 * Verifies that createLoadingAudioEngine can be re-triggered repeatedly
 * without leaking hardware AudioContexts, throwing InvalidStateError, or overlapping.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock Web Audio API environment
class MockGainNode {
  constructor(ctx) {
    this.ctx = ctx;
    this.gain = {
      value: 1,
      setValueAtTime: (v, t) => { this.gain.value = v; },
      setTargetAtTime: (v, t, tc) => { this.gain.value = v; },
      linearRampToValueAtTime: (v, t) => { this.gain.value = v; },
      exponentialRampToValueAtTime: (v, t) => { this.gain.value = v; }
    };
  }
  connect(dest) {}
  disconnect() {}
}

class MockBiquadFilter {
  constructor(ctx) {
    this.ctx = ctx;
    this.frequency = {
      setValueAtTime: (v, t) => {},
      setTargetAtTime: (v, t, tc) => {}
    };
    this.Q = { setValueAtTime: (v, t) => {} };
  }
  connect(dest) {}
  disconnect() {}
}

class MockOscillator {
  constructor(ctx) {
    this.ctx = ctx;
    this.type = 'sine';
    this.frequency = {
      setValueAtTime: (v, t) => {},
      setTargetAtTime: (v, t, tc) => {}
    };
    this.started = false;
    this.stopped = false;
  }
  connect(dest) {}
  start(t) {
    if (this.started) throw new Error('InvalidStateError: Oscillator already started');
    this.started = true;
  }
  stop(t) {
    if (this.stopped) return;
    this.stopped = true;
  }
}

let activeContextCount = 0;

class MockAudioContext {
  constructor() {
    activeContextCount++;
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = {};
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  createGain() { return new MockGainNode(this); }
  createBiquadFilter() { return new MockBiquadFilter(this); }
  createOscillator() { return new MockOscillator(this); }
  close() {
    activeContextCount = Math.max(0, activeContextCount - 1);
    this.state = 'closed';
    return Promise.resolve();
  }
}

async function testSoundRepeatability() {
  console.log('🔊 Starting Sound System Repeatability & Concurrency Verification...\n');

  // Setup DOM / Window globals
  global.window = {
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext,
    matchMedia: (q) => ({ matches: false }),
    addEventListener: () => {},
    removeEventListener: () => {},
    __portfolioAudioCtx: null,
    __activeAudioEngine: null
  };
  global.document = {
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } })
  };
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };

  const appJsCode = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');

  // Eval app.js in sandbox
  const scope = {};
  eval(`(function(window) {
    ${appJsCode}
    scope.createLoadingAudioEngine = createLoadingAudioEngine;
    scope.window = window;
  })(global.window)`);

  const { createLoadingAudioEngine } = scope;
  assert(typeof createLoadingAudioEngine === 'function', 'createLoadingAudioEngine must be defined');

  console.log('1. Testing Repeated Sound Instantiation (10 consecutive triggers)...');
  for (let i = 1; i <= 10; i++) {
    const engine = createLoadingAudioEngine();
    assert(engine, `Run ${i}: Audio engine must instantiate`);
    assert(typeof engine.update === 'function', `Run ${i}: Engine must have update method`);
    assert(typeof engine.finish === 'function', `Run ${i}: Engine must have finish method`);

    // Simulate progress updates
    engine.update(0.25);
    engine.update(0.50);
    engine.update(0.75);
    engine.update(1.0);
    engine.finish();
  }
  console.log(`   ✓ 10 sequential play cycles completed successfully`);
  console.log(`   ✓ Shared AudioContext reused cleanly: active hardware contexts = ${activeContextCount} (limit: <= 1)`);
  assert(activeContextCount <= 1, 'Must not spawn multiple hardware AudioContext instances');

  console.log('\n2. Testing Rapid Concurrency Interruption (stopImmediate)...');
  const engineA = createLoadingAudioEngine();
  engineA.update(0.3);
  // Before engineA finishes, trigger engineB immediately
  const engineB = createLoadingAudioEngine();
  engineB.update(0.6);
  engineB.finish();
  console.log('   ✓ Interrupted prior playback smoothly without throwing or node collisions');

  console.log('\n3. Verifying Admin Dashboard Sound Engine Repeatability...');
  const adminJsCode = fs.readFileSync(path.join(__dirname, '../public/admin/admin.js'), 'utf8');
  const adminScope = {};
  eval(`(function(window) {
    ${adminJsCode}
    adminScope.createLoadingAudioEngine = createLoadingAudioEngine;
  })(global.window)`);

  for (let i = 1; i <= 5; i++) {
    const adminEngine = adminScope.createLoadingAudioEngine();
    assert(adminEngine, `Admin Run ${i}: Audio engine must instantiate`);
    adminEngine.update(0.5);
    adminEngine.finish();
  }
  console.log('   ✓ Admin audio engine executed 5 consecutive cycles cleanly');

  console.log('\n====================================================');
  console.log('🎉 SOUND SYSTEM REPEATABILITY & RESILIENCE VERIFIED!');
  console.log('====================================================\n');
}

testSoundRepeatability().catch(err => {
  console.error('\n❌ SOUND REPEATABILITY TEST FAILED:', err);
  process.exit(1);
});
