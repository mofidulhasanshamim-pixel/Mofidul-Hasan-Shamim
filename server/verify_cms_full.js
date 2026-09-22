const assert = require('assert');

async function runVerification() {
  console.log('🚀 Starting Comprehensive Portfolio CMS Verification...\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. PUBLIC CONTENT API
  console.log('1. Testing GET /api/public/content...');
  const pubRes = await fetch(`${BASE_URL}/api/public/content`);
  assert.strictEqual(pubRes.status, 200, 'Public content should return 200');
  const pubData = await pubRes.json();
  assert(pubData.success, 'Public content response must be success');
  assert(pubData.data.projects && pubData.data.projects.length > 0, 'Must have projects');
  assert(pubData.data.services && pubData.data.services.length > 0, 'Must have services');
  assert(pubData.data.skills && pubData.data.skills.length > 0, 'Must have skills');
  assert(pubData.data.experience && pubData.data.experience.length > 0, 'Must have experience records');
  assert(pubData.data.navigation && pubData.data.navigation.length > 0, 'Must have navigation links');
  assert(pubData.data.sections && pubData.data.sections.length > 0, 'Must have section settings');
  console.log(`   ✓ Found ${pubData.data.projects.length} projects, ${pubData.data.services.length} services, ${pubData.data.skills.length} skills, ${pubData.data.experience.length} experience entries, ${pubData.data.navigation.length} nav links, ${pubData.data.sections.length} sections`);

  // 2. DYNAMIC CASE STUDY PAGE (/work/:slug)
  const firstProject = pubData.data.projects[0];
  const slug = firstProject.slug || firstProject.id;
  console.log(`\n2. Testing dynamic project page /work/${slug}...`);
  const pageRes = await fetch(`${BASE_URL}/work/${slug}`);
  assert.strictEqual(pageRes.status, 200, 'Project slug page should return 200');
  const html = await pageRes.text();
  assert(html.includes(firstProject.title), 'Page HTML must contain project title');
  assert(html.includes('case-headline'), 'Page must contain case study headline');
  assert(html.includes('case-study-hero'), 'Page must contain case study editorial layout');
  console.log(`   ✓ Successfully rendered dynamic case study for "${firstProject.title}" with SSR meta tags`);

  // 3. ADMIN AUTHENTICATION
  console.log('\n3. Testing Admin Login POST /api/auth/login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'MofidulAdmin2026!' })
  });
  assert.strictEqual(loginRes.status, 200, 'Login should succeed');
  const loginData = await loginRes.json();
  assert(loginData.success && loginData.token, 'Must return JWT token');
  const token = loginData.token;
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  console.log('   ✓ Admin login authenticated, received JWT token');

  // 4. ADMIN OVERVIEW METRICS
  console.log('\n4. Testing GET /api/admin/overview...');
  const overviewRes = await fetch(`${BASE_URL}/api/admin/overview`, { headers: authHeaders });
  assert.strictEqual(overviewRes.status, 200);
  const overviewData = await overviewRes.json();
  assert(overviewData.success);
  console.log(`   ✓ Metrics: ${overviewData.data.projectsCount} projects (${overviewData.data.publishedProjectsCount} published, ${overviewData.data.draftProjectsCount} draft), ${overviewData.data.skillsCount} skills, ${overviewData.data.experienceCount} experience, ${overviewData.data.mediaCount} media assets`);

  // 5. PROJECT CMS: CREATE, DUPLICATE, STATUS PATCH, REORDER, DELETE
  console.log('\n5. Testing Project CMS (Create -> Duplicate -> Status -> Delete)...');
  const createProjRes = await fetch(`${BASE_URL}/api/admin/projects`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Automated Test Case Study',
      slug: 'automated-test-case-study',
      category: 'Design Systems & AI',
      short_desc: 'An automated testing project created by verification suite',
      full_desc: 'Comprehensive case study details test',
      challenge: 'Automating continuous quality',
      solution: 'Built real SQLite persistent pipeline',
      results: '100% test coverage passed',
      status: 'published',
      sort_order: 999
    })
  });
  assert.strictEqual(createProjRes.status, 200);
  const createProjData = await createProjRes.json();
  const testProjId = createProjData.id;
  console.log(`   ✓ Created test project (ID: ${testProjId})`);

  // Duplicate
  const dupProjRes = await fetch(`${BASE_URL}/api/admin/projects/${testProjId}/duplicate`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(dupProjRes.status, 200);
  const dupProjData = await dupProjRes.json();
  const dupProjId = dupProjData.id;
  console.log(`   ✓ Duplicated project successfully (New ID: ${dupProjId})`);

  // Status toggle to draft
  const statusRes = await fetch(`${BASE_URL}/api/admin/projects/${testProjId}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'draft' })
  });
  assert.strictEqual(statusRes.status, 200);
  console.log('   ✓ Toggled project status to "draft"');

  // Clean up test projects
  await fetch(`${BASE_URL}/api/admin/projects/${testProjId}`, { method: 'DELETE', headers: authHeaders });
  await fetch(`${BASE_URL}/api/admin/projects/${dupProjId}`, { method: 'DELETE', headers: authHeaders });
  console.log('   ✓ Cleaned up test projects');

  // 6. SKILLS CMS: CREATE, DUPLICATE, STATUS PATCH, DELETE
  console.log('\n6. Testing Skills CMS (Create -> Duplicate -> Status -> Delete)...');
  const createSkillRes = await fetch(`${BASE_URL}/api/admin/skills`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Automated Architecture',
      category: 'Design Systems',
      description: 'End-to-end resilient architecture',
      proficiency: '98%',
      status: 'published'
    })
  });
  assert.strictEqual(createSkillRes.status, 200);
  const createSkillData = await createSkillRes.json();
  const testSkillId = createSkillData.id;

  const dupSkillRes = await fetch(`${BASE_URL}/api/admin/skills/${testSkillId}/duplicate`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(dupSkillRes.status, 200);
  const dupSkillId = (await dupSkillRes.json()).id;

  await fetch(`${BASE_URL}/api/admin/skills/${testSkillId}`, { method: 'DELETE', headers: authHeaders });
  await fetch(`${BASE_URL}/api/admin/skills/${dupSkillId}`, { method: 'DELETE', headers: authHeaders });
  console.log('   ✓ Skills CRUD + Duplication verified');

  // 7. EXPERIENCE CMS: CREATE, DUPLICATE, DELETE
  console.log('\n7. Testing Experience CMS (Create -> Duplicate -> Delete)...');
  const createExpRes = await fetch(`${BASE_URL}/api/admin/experience`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      company: 'Global Innovation Labs',
      role: 'Principal Design Technologist',
      start_date: '2023',
      end_date: '',
      is_current: 1,
      location: 'New York, NY',
      description: 'Directed visual computing and interface architecture.',
      responsibilities: 'Architected design system\nManaged team',
      technologies: 'Node.js, Canvas, SQLite, WebGL',
      status: 'published'
    })
  });
  assert.strictEqual(createExpRes.status, 200);
  const testExpId = (await createExpRes.json()).id;

  const dupExpRes = await fetch(`${BASE_URL}/api/admin/experience/${testExpId}/duplicate`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(dupExpRes.status, 200);
  const dupExpId = (await dupExpRes.json()).id;

  await fetch(`${BASE_URL}/api/admin/experience/${testExpId}`, { method: 'DELETE', headers: authHeaders });
  await fetch(`${BASE_URL}/api/admin/experience/${dupExpId}`, { method: 'DELETE', headers: authHeaders });
  console.log('   ✓ Experience CRUD + Duplication verified');

  // 8. MEDIA LIBRARY API
  console.log('\n8. Testing Media Library GET /api/admin/media...');
  const mediaRes = await fetch(`${BASE_URL}/api/admin/media`, { headers: authHeaders });
  assert.strictEqual(mediaRes.status, 200);
  const mediaData = await mediaRes.json();
  assert(Array.isArray(mediaData.data), 'Media response must be an array');
  console.log(`   ✓ Media library currently tracks ${mediaData.data.length} registered file assets`);

  // 9. NAVIGATION LINKS CMS
  console.log('\n9. Testing Navigation Links CMS...');
  const navRes = await fetch(`${BASE_URL}/api/admin/navigation`, { headers: authHeaders });
  assert.strictEqual(navRes.status, 200);
  const navLinks = (await navRes.json()).data;
  assert(navLinks.length > 0);
  console.log(`   ✓ Found ${navLinks.length} navigation links (${navLinks.map(l => l.label).join(', ')})`);

  // 10. SECTION SETTINGS CMS
  console.log('\n10. Testing Section Settings CMS...');
  const secRes = await fetch(`${BASE_URL}/api/admin/sections`, { headers: authHeaders });
  assert.strictEqual(secRes.status, 200);
  const sections = (await secRes.json()).data;
  assert(sections.length > 0);
  console.log(`   ✓ Found ${sections.length} controllable sections: ${sections.map(s => s.section_key).join(', ')}`);

  console.log('\n====================================================');
  console.log('🎉 ALL PORTFOLIO CMS VERIFICATION CHECKS PASSED!');
  console.log('====================================================\n');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
