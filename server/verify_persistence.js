const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function testPersistence() {
  console.log('🧪 Starting SQLite & CMS Persistence Verification Test...\n');
  const BASE_URL = 'http://localhost:3000';

  // 1. VERIFY CACHE-CONTROL HEADERS
  console.log('1. Verifying Cache-Control headers on API and HTML...');
  const pubRes = await fetch(`${BASE_URL}/api/public/content`);
  const pubCache = pubRes.headers.get('cache-control') || '';
  console.log('   Public API Cache-Control:', pubCache);
  assert(pubCache.includes('no-store'), 'Public API must return no-store');

  const adminRes = await fetch(`${BASE_URL}/admin`);
  const adminCache = adminRes.headers.get('cache-control') || '';
  console.log('   Admin HTML Cache-Control:', adminCache);
  assert(adminCache.includes('no-store'), 'Admin HTML must return no-store');
  console.log('   ✔ Zero-cache headers verified.');

  // 2. AUTHENTICATE AS ADMIN
  console.log('\n2. Authenticating as admin...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'MofidulAdmin2026!' })
  });
  assert.strictEqual(loginRes.status, 200, 'Admin login failed');
  const { token } = await loginRes.json();
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  console.log('   ✔ Admin login authenticated.');

  // 3. CREATE A UNIQUE PERSISTENT RECORD
  const testStamp = Date.now();
  const testTitle = `Permanent Showcase ${testStamp}`;
  const testSlug = `showcase-${testStamp}`;

  console.log(`\n3. Creating new test project "${testTitle}"...`);
  const createRes = await fetch(`${BASE_URL}/api/admin/projects`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: testTitle,
      slug: testSlug,
      category: 'Brand Direction',
      short_desc: 'Guaranteed persistent case study test',
      status: 'published',
      sort_order: 10
    })
  });
  assert.strictEqual(createRes.status, 200, 'Create project failed');
  const createData = await createRes.json();
  const createdId = createData.id;
  console.log(`   ✔ Project created with ID ${createdId}`);

  // Small delay to allow post-mutation checkpoint to complete
  await new Promise(r => setTimeout(r, 200));

  // 4. VERIFY DIRECTLY FROM DISK VIA RAW SQLITE (Without API)
  console.log('\n4. Verifying record directly from physical SQLite file on disk...');
  const { DatabaseSync } = require('node:sqlite');
  const dbFile = path.resolve(__dirname, '../data/portfolio.db');
  assert(fs.existsSync(dbFile), 'Database file must exist on disk');

  const diskDb = new DatabaseSync(dbFile);
  const row = diskDb.prepare('SELECT id, title, slug FROM projects WHERE id = ?').get(createdId);
  assert(row, `Record ID ${createdId} must exist directly in SQLite disk file`);
  assert.strictEqual(row.title, testTitle);
  console.log(`   ✔ Confirmed in physical DB: ID=${row.id}, Title="${row.title}", Slug="${row.slug}"`);
  diskDb.close();

  // 5. VERIFY FROM PUBLIC CONTENT ENDPOINT
  console.log('\n5. Verifying record appears in GET /api/public/content...');
  const pubContentRes = await fetch(`${BASE_URL}/api/public/content`);
  const pubContent = await pubContentRes.json();
  const foundInPublic = pubContent.data.projects.find(p => p.id === createdId);
  assert(foundInPublic, 'New project must be present in public content');
  assert.strictEqual(foundInPublic.title, testTitle);
  console.log(`   ✔ Confirmed present in public content API: "${foundInPublic.title}"`);

  // 6. CLEAN UP TEST RECORD
  console.log(`\n6. Cleaning up test record (ID: ${createdId})...`);
  const delRes = await fetch(`${BASE_URL}/api/admin/projects/${createdId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delRes.status, 200, 'Delete failed');
  console.log('   ✔ Test record cleaned up.');

  // Verify deletion on disk
  await new Promise(r => setTimeout(r, 200));
  const verifyDb = new DatabaseSync(dbFile);
  const deletedRow = verifyDb.prepare('SELECT id FROM projects WHERE id = ?').get(createdId);
  assert(!deletedRow, 'Record should no longer exist after deletion');
  verifyDb.close();
  console.log('   ✔ Confirmed record deleted and disk checkpointed.');

  console.log('\n====================================================');
  console.log('🎉 ALL PERSISTENCE CHECKS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');
}

testPersistence().catch(err => {
  console.error('\n❌ Persistence Verification Failed:', err);
  process.exit(1);
});
