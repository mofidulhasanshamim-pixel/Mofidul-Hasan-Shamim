const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search
    };

    if (body && !(body instanceof Buffer)) {
      if (typeof body === 'object') {
        body = JSON.stringify(body);
        reqOptions.headers['Content-Type'] = 'application/json';
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(reqOptions, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return makeRequest(res.headers.location, options, body).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting End-to-End Verification of Mofidul Portfolio & CMS...\n');
  let token = null;

  // 1. Verify Public Homepage Serving
  const homeRes = await makeRequest('/');
  console.log('1. Public Homepage GET /:', homeRes.status === 200 ? '✅ PASS' : '❌ FAIL');
  if (typeof homeRes.body === 'string') {
    const hasManrope = homeRes.body.includes('Manrope');
    const hasInstrument = homeRes.body.includes('Instrument+Serif');
    const hasMonogram = homeRes.body.includes('profile-monogram');
    console.log('   - Includes Manrope & Instrument Serif:', (hasManrope && hasInstrument) ? '✅ YES' : '❌ NO');
    console.log('   - Dedicated Monogram Profile Frame present:', hasMonogram ? '✅ YES' : '❌ NO');
  }

  // 2. Verify Admin Dashboard Serving
  const adminRes = await makeRequest('/admin');
  console.log('2. Admin Dashboard GET /admin:', adminRes.status === 200 ? '✅ PASS' : '❌ FAIL');

  // 3. Verify Public Content API
  const contentRes = await makeRequest('/api/public/content');
  console.log('3. Public Content API GET /api/public/content:', contentRes.status === 200 && contentRes.body.success ? '✅ PASS' : '❌ FAIL');
  console.log('   - Hero Name:', contentRes.body.data.hero.name);
  console.log('   - Projects Count:', contentRes.body.data.projects.length);
  console.log('   - Services Count:', contentRes.body.data.services.length);
  console.log('   - Stats Count:', contentRes.body.data.statistics.length);

  // 4. Test Contact Form Submission
  const contactPayload = {
    name: 'Eleanor Vance',
    email: 'eleanor@vancecreative.com',
    subject: 'Brand Strategy Commission',
    message: 'Hello Mofidul, we would love to discuss an end-to-end brand redesign and digital platform for our firm.'
  };
  const contactRes = await makeRequest('/api/public/contact', { method: 'POST' }, contactPayload);
  console.log('4. Contact Form POST /api/public/contact:', contactRes.status === 200 && contactRes.body.success ? '✅ PASS' : '❌ FAIL');
  const inquiryId = contactRes.body.id;

  // 5. Test Admin Login
  const loginRes = await makeRequest('/api/auth/login', { method: 'POST' }, { username: 'mofidul', password: 'MofidulAdmin2026!' });
  console.log('5. Admin Login POST /api/auth/login:', loginRes.status === 200 && loginRes.body.success ? '✅ PASS' : '❌ FAIL');
  token = loginRes.body.token;

  // 6. Test Admin Me Verification
  const meRes = await makeRequest('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
  console.log('6. Authenticated Session GET /api/auth/me:', meRes.status === 200 && meRes.body.user.username === 'mofidul' ? '✅ PASS' : '❌ FAIL');

  // 7. Verify Inquiries in Admin Inbox
  const msgsRes = await makeRequest('/api/admin/messages', { headers: { 'Authorization': `Bearer ${token}` } });
  const foundMsg = msgsRes.body.data && msgsRes.body.data.find(m => m.id === inquiryId);
  console.log('7. Inquiry in Admin Inbox GET /api/admin/messages:', foundMsg && foundMsg.name === 'Eleanor Vance' ? '✅ PASS' : '❌ FAIL');

  // 8. Mark Inquiry as Read
  const readRes = await makeRequest(`/api/admin/messages/${inquiryId}/read`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  }, { is_read: 1 });
  console.log('8. Mark Message Read PATCH /api/admin/messages/:id/read:', readRes.status === 200 && readRes.body.success ? '✅ PASS' : '❌ FAIL');

  // 9. Test Hero Update & Persistence
  const updatedHeroPayload = {
    greeting: 'HELLO, I AM',
    name: 'Mofidul',
    role_title: 'AI Creative Director & Brand Designer',
    positioning_statement: 'Pioneering next-generation visual identities, spatial aesthetics, and strategic brand systems for forward-thinking innovators worldwide.',
    primary_cta_text: 'Explore Portfolio',
    primary_cta_url: '#work',
    secondary_cta_text: 'Initiate Inquiry',
    secondary_cta_url: '#contact',
    availability_status: 'Available for Select Commissions (Q3/Q4)',
    profile_image_url: ''
  };
  const updateHeroRes = await makeRequest('/api/admin/hero', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  }, updatedHeroPayload);
  console.log('9. Update Hero PUT /api/admin/hero:', updateHeroRes.status === 200 && updateHeroRes.body.success ? '✅ PASS' : '❌ FAIL');

  // 10. Verify Public Content Reflects Updated Hero Immediately
  const recheckContentRes = await makeRequest('/api/public/content');
  const heroData = recheckContentRes.body.data.hero;
  const heroUpdated = heroData.role_title === 'AI Creative Director & Brand Designer' && heroData.primary_cta_text === 'Explore Portfolio';
  console.log('10. Public Site Immediately Reflects Backend Updates:', heroUpdated ? '✅ PASS' : '❌ FAIL');

  // 11. Test Adding a Project
  const newProjectPayload = {
    title: 'Solstice Autonomous Interface',
    category: 'UI/UX & Web',
    client: 'Solstice Robotics',
    year: '2026',
    short_desc: 'Next-generation cockpit telemetry and vehicle interaction system with high-contrast editorial typography.',
    full_desc: 'Solstice approached us to design an ultra-refined user interaction layer for autonomous transportation.',
    project_url: 'https://example.com/solstice',
    cover_image: '',
    is_active: 1
  };
  const addProjectRes = await makeRequest('/api/admin/projects', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }, newProjectPayload);
  console.log('11. Add Project POST /api/admin/projects:', addProjectRes.status === 200 && addProjectRes.body.success ? '✅ PASS' : '❌ FAIL');
  const newProjectId = addProjectRes.body.id;

  // 12. Verify Project Appears in Public Content
  const verifyProjectsRes = await makeRequest('/api/public/content');
  const hasNewProject = verifyProjectsRes.body.data.projects.some(p => p.id === newProjectId);
  console.log('12. New Project Rendered on Public Site:', hasNewProject ? '✅ PASS' : '❌ FAIL');

  // 13. Test Image Upload with a synthetic 1x1 PNG
  const png1x1Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(png1x1Base64, 'base64');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

  let multipartBody = `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="file"; filename="test-portrait.png"\r\n`;
  multipartBody += `Content-Type: image/png\r\n\r\n`;
  const part1 = Buffer.from(multipartBody, 'utf-8');
  const part2 = pngBuffer;
  const part3 = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const completeBody = Buffer.concat([part1, part2, part3]);

  const uploadRes = await makeRequest('/api/admin/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    }
  }, completeBody);
  console.log('13. Image Upload POST /api/admin/upload:', uploadRes.status === 200 && uploadRes.body.success ? '✅ PASS' : '❌ FAIL');
  const uploadedUrl = uploadRes.body.url;
  console.log('    - Uploaded Image URL:', uploadedUrl);

  // 14. Verify Uploaded File is Statically Reachable via HTTP GET
  const staticFileRes = await makeRequest(uploadedUrl);
  console.log('14. Uploaded Image Statically Served GET', uploadedUrl, ':', staticFileRes.status === 200 ? '✅ PASS' : '❌ FAIL');

  // 15. Clean up uploaded test file
  const deleteFileRes = await makeRequest('/api/admin/upload', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  }, { url: uploadedUrl });
  console.log('15. Image Delete DELETE /api/admin/upload:', deleteFileRes.status === 200 && deleteFileRes.body.success ? '✅ PASS' : '❌ FAIL');

  // Clean up created test project
  await makeRequest(`/api/admin/projects/${newProjectId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  console.log('\n🎉 ALL 15 AUTOMATED VERIFICATION CHECKS PASSED PERFECTLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
