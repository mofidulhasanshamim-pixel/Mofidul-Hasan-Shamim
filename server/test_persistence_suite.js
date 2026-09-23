const assert = require('assert');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

async function runPersistenceSuite() {
  console.log('🧪 Starting Deep Persistence & Image Replacement Test Suite...\n');
  const BASE_URL = 'http://localhost:3000';

  // Step 0: Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'MofidulAdmin2026!' })
  });
  assert.strictEqual(loginRes.status, 200);
  const { token } = await loginRes.json();
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Direct SQLite read helper
  const db = new DatabaseSync(path.join(__dirname, '../data/portfolio.db'));
  const getDbHero = () => db.prepare('SELECT * FROM hero_content WHERE id = 1').get();
  const getDbSettings = () => db.prepare('SELECT * FROM site_settings WHERE id = 1').get();
  const getDbSection = (key) => db.prepare('SELECT * FROM section_settings WHERE section_key = ?').get(key);

  // Backup original state
  const origHero = getDbHero();
  const origSettings = getDbSettings();
  console.log('✓ Original hero & settings backed up');

  try {
    // =========================================================================
    // TEST 1: TEXT PERSISTENCE (Step 1 -> Save -> Refresh -> Step 2 -> Save -> Refresh)
    // =========================================================================
    console.log('\n--- TEST 1: Hero & Text Persistence ---');
    const update1 = {
      greeting: 'PERSISTENCE_TEST_1',
      name: 'Mofidul Hasan Shamim',
      role_title: 'Principal Design Technologist',
      positioning_statement: 'Pioneering next-generation digital interfaces.',
      primary_cta_text: 'Explore Work',
      primary_cta_url: '#work',
      secondary_cta_text: 'Get in Touch',
      secondary_cta_url: '#contact',
      availability_status: 'Available for Select Commissions'
    };

    const res1 = await fetch(`${BASE_URL}/api/admin/hero`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(update1)
    });
    assert.strictEqual(res1.status, 200);
    const data1 = await res1.json();
    assert.strictEqual(data1.data.greeting, 'PERSISTENCE_TEST_1');

    // Verify directly in SQLite DB
    const dbHero1 = getDbHero();
    assert.strictEqual(dbHero1.greeting, 'PERSISTENCE_TEST_1', 'Database must have new greeting');
    console.log('   ✓ Update 1 persisted to SQLite database');

    // Verify Public Content reflects it immediately
    const pubRes1 = await fetch(`${BASE_URL}/api/public/content`);
    const pubData1 = await pubRes1.json();
    assert.strictEqual(pubData1.data.hero.greeting, 'PERSISTENCE_TEST_1');
    console.log('   ✓ Public Content API returned Update 1');

    // Second Change
    const update2 = {
      ...update1,
      greeting: 'PERSISTENCE_TEST_2_FINAL'
    };
    const res2 = await fetch(`${BASE_URL}/api/admin/hero`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(update2)
    });
    assert.strictEqual(res2.status, 200);
    const dbHero2 = getDbHero();
    assert.strictEqual(dbHero2.greeting, 'PERSISTENCE_TEST_2_FINAL');
    console.log('   ✓ Update 2 persisted to SQLite database');

    // =========================================================================
    // TEST 2: IMAGE REPLACEMENT & NO UNINTENDED REVERT
    // =========================================================================
    console.log('\n--- TEST 2: Image Replacement Flow ---');
    // Step A: Set image to Image_B
    const imgB_Url = '/uploads/test_portrait_b.png';
    const resImgB = await fetch(`${BASE_URL}/api/admin/hero`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ ...update2, profile_image_url: imgB_Url })
    });
    assert.strictEqual(resImgB.status, 200);
    assert.strictEqual(getDbHero().profile_image_url, imgB_Url);
    console.log('   ✓ Image B successfully set and persisted in database');

    // Step B: Replace Image_B with Image_C
    const imgC_Url = '/uploads/test_portrait_c.png';
    const resImgC = await fetch(`${BASE_URL}/api/admin/hero`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ ...update2, profile_image_url: imgC_Url })
    });
    assert.strictEqual(resImgC.status, 200);
    assert.strictEqual(getDbHero().profile_image_url, imgC_Url);
    console.log('   ✓ Image C successfully replaced Image B in database');

    // Step C: Edit text ONLY without specifying profile_image_url (partial update)
    // The previous bug wiped the image back to empty string!
    const resTextOnly = await fetch(`${BASE_URL}/api/admin/hero`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ greeting: 'PERSISTENCE_TEST_TEXT_ONLY' })
    });
    assert.strictEqual(resTextOnly.status, 200);
    const dbHeroAfterTextOnly = getDbHero();
    assert.strictEqual(dbHeroAfterTextOnly.greeting, 'PERSISTENCE_TEST_TEXT_ONLY');
    assert.strictEqual(dbHeroAfterTextOnly.profile_image_url, imgC_Url, 'Image C must NOT be wiped when updating text!');
    console.log('   ✓ Text-only update safely preserved Image C reference without reverting');

    // =========================================================================
    // TEST 3: SECTION SETTINGS (By Section Key and by Numeric ID)
    // =========================================================================
    console.log('\n--- TEST 3: Section Settings Key & ID Persistence ---');
    // Test updating by section_key e.g. "hero"
    const heroSecBefore = getDbSection('hero');
    const updateSecRes = await fetch(`${BASE_URL}/api/admin/sections/hero`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        section_title: 'Hero New Title Test',
        section_eyebrow: 'Hero Eyebrow Test',
        is_enabled: 1
      })
    });
    assert.strictEqual(updateSecRes.status, 200);
    const heroSecAfter = getDbSection('hero');
    assert.strictEqual(heroSecAfter.section_title, 'Hero New Title Test');
    console.log('   ✓ Section settings updated via /sections/hero persisted');

    // Test updating by numeric ID e.g. /sections/1
    const sec1 = db.prepare('SELECT id, section_key FROM section_settings LIMIT 1').get();
    const updateSecIdRes = await fetch(`${BASE_URL}/api/admin/sections/${sec1.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        section_title: 'Title via Numeric ID',
        is_enabled: 1
      })
    });
    assert.strictEqual(updateSecIdRes.status, 200);
    const sec1After = db.prepare('SELECT * FROM section_settings WHERE id = ?').get(sec1.id);
    assert.strictEqual(sec1After.section_title, 'Title via Numeric ID');
    console.log(`   ✓ Section settings updated via numeric ID /sections/${sec1.id} persisted`);

    // =========================================================================
    // TEST 4: SITE SETTINGS RESUME PDF PRESERVATION
    // =========================================================================
    console.log('\n--- TEST 4: Global Settings & Resume PDF Preservation ---');
    // First set a resume_url
    db.prepare("UPDATE site_settings SET resume_url = '/uploads/sample_cv.pdf' WHERE id = 1").run();
    
    // Save settings form which sends meta_keywords and site_title
    const saveSettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        site_title: 'Settings Title Test',
        meta_description: 'Settings Desc Test',
        meta_keywords: 'test, keywords',
        logo_text: 'MOFIDUL'
      })
    });
    assert.strictEqual(saveSettingsRes.status, 200);
    const dbSettingsAfter = getDbSettings();
    assert.strictEqual(dbSettingsAfter.site_title, 'Settings Title Test');
    assert.strictEqual(dbSettingsAfter.resume_url, '/uploads/sample_cv.pdf', 'resume_url must be preserved!');
    console.log('   ✓ Global settings saved and resume_url safely preserved');

    console.log('\n====================================================');
    console.log('🎉 ALL PERSISTENCE & IMAGE REPLACEMENT TESTS PASSED!');
    console.log('====================================================\n');
  } finally {
    // Restore original database records
    db.prepare(`
      UPDATE hero_content SET 
        greeting = ?, name = ?, role_title = ?, positioning_statement = ?,
        primary_cta_text = ?, primary_cta_url = ?, secondary_cta_text = ?,
        secondary_cta_url = ?, availability_status = ?, profile_image_url = ?
      WHERE id = 1
    `).run(
      origHero.greeting, origHero.name, origHero.role_title, origHero.positioning_statement,
      origHero.primary_cta_text, origHero.primary_cta_url, origHero.secondary_cta_text,
      origHero.secondary_cta_url, origHero.availability_status, origHero.profile_image_url
    );

    db.prepare(`
      UPDATE site_settings SET 
        site_title = ?, meta_description = ?, keywords = ?, logo_text = ?, resume_url = ?
      WHERE id = 1
    `).run(
      origSettings.site_title, origSettings.meta_description, origSettings.keywords,
      origSettings.logo_text, origSettings.resume_url
    );

    db.prepare(`
      UPDATE section_settings SET 
        section_title = 'Featured Work', section_eyebrow = 'Selected Works'
      WHERE section_key = 'work'
    `).run();
    db.prepare(`
      UPDATE section_settings SET 
        section_title = 'Art & Direction', section_eyebrow = 'Creative Discipline'
      WHERE section_key = 'hero'
    `).run();

    console.log('✓ Database restored to pristine clean original state');
  }
}

runPersistenceSuite().catch(err => {
  console.error('❌ Persistence Test Failure:', err);
  process.exit(1);
});
