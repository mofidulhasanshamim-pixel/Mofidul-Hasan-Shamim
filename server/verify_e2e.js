const http = require('http');
const fs = require('fs');
const path = require('path');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextPath = res.headers.location;
        const newOptions = { ...options, path: nextPath };
        return request(newOptions, postData).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: data, json: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data, json: null });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Verification Test...');
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      testsFailed++;
    }
  }

  try {
    // 1. Test Public Home Page
    console.log('\n--- 1. Testing Public Home Page & Loader ---');
    const home = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
    assert(home.status === 200, 'GET / returns HTTP 200');
    assert(home.body.includes('id="intro-loader"'), 'Public page includes #intro-loader');
    assert(home.body.includes('id="intro-progress-bar"'), 'Public page includes #intro-progress-bar');
    assert(home.body.includes('id="intro-progress-percent"'), 'Public page includes #intro-progress-percent');
    assert(home.body.includes('id="project-modal"'), 'Public page includes #project-modal');
    assert(home.body.includes('id="image-lightbox-modal"'), 'Public page includes #image-lightbox-modal');

    // 2. Test Admin Portal Page
    console.log('\n--- 2. Testing Admin Portal Page & Loader ---');
    const admin = await request({ hostname: 'localhost', port: 3000, path: '/admin', method: 'GET' });
    assert(admin.status === 200, 'GET /admin returns HTTP 200');
    assert(admin.body.includes('id="intro-loader"'), 'Admin page includes #intro-loader');
    assert(admin.body.includes('id="intro-progress-bar"'), 'Admin page includes #intro-progress-bar');
    assert(admin.body.includes('id="modal-project"'), 'Admin page includes #modal-project');
    assert(admin.body.includes('id="gallery-batch-input"'), 'Admin page includes multi-image file input');
    assert(admin.body.includes('id="project-gallery-grid"'), 'Admin page includes gallery items grid');

    // 3. Test Public Content API
    console.log('\n--- 3. Testing Public Content API ---');
    const content = await request({ hostname: 'localhost', port: 3000, path: '/api/public/content', method: 'GET' });
    assert(content.status === 200, 'GET /api/public/content returns HTTP 200');
    assert(content.json && content.json.success === true, 'API payload indicates success');
    assert(Array.isArray(content.json.data.projects), 'Projects array returned');
    assert(content.json.data.projects.length > 0, `Returned ${content.json.data.projects.length} initial project(s)`);
    const p1 = content.json.data.projects[0];
    assert('services_used' in p1, 'Project includes services_used field');
    assert('technologies' in p1, 'Project includes technologies field');
    assert('challenge' in p1, 'Project includes challenge field');
    assert('solution' in p1, 'Project includes solution field');
    assert('results' in p1, 'Project includes results field');
    assert(Array.isArray(p1.gallery), 'Project includes gallery array');

    // 4. Test Admin Authentication
    console.log('\n--- 4. Testing Admin Authentication ---');
    const loginPayload = JSON.stringify({ username: 'mofidul', password: 'MofidulAdmin2026!' });
    const loginRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload)
      }
    }, loginPayload);

    assert(loginRes.status === 200, 'POST /api/auth/login returns HTTP 200');
    assert(loginRes.json && loginRes.json.success === true, 'Login successful');
    assert(!!loginRes.json.token, 'Received JWT auth token');
    const token = loginRes.json.token;

    // 5. Test Advanced Project Creation
    console.log('\n--- 5. Testing Advanced Project Creation ---');
    const newProjectPayload = JSON.stringify({
      title: 'E2E Test Case Study',
      category: 'Brand & Digital Craft',
      client: 'Acme Global Ventures',
      year: '2026',
      short_desc: 'A futuristic digital experience engineered with editorial precision and glassmorphism styling.',
      full_desc: 'Comprehensive full case study narrative detailing the brand overhaul, design system architecture, and interactive canvas components.',
      services_used: 'Creative Direction, Brand Identity, UI/UX Systems, Motion',
      technologies: 'Figma, WebGL, Node.js, SQLite',
      project_url: 'https://example.com/e2e-project',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags: 'Fintech, Glassmorphism, Luxury, 3D',
      challenge: 'The legacy identity lacked modern digital resonance and failed to convert enterprise leads.',
      solution: 'Crafted an obsidian dark theme with subtle violet glass surfaces, fluid micro-interactions, and tight typography.',
      results: '+180% engagement lift, featured in international design annuals, and unified cross-platform resonance.',
      additional_info: 'Honored with Design of the Month 2026.',
      is_featured: 1,
      sort_order: 1,
      is_active: 1
    });

    const createRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/projects',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(newProjectPayload),
        'Authorization': `Bearer ${token}`
      }
    }, newProjectPayload);

    assert(createRes.status === 200, 'POST /api/admin/projects returns HTTP 200');
    assert(createRes.json && createRes.json.success === true, 'Project created successfully');
    const createdProjectId = createRes.json.id;
    assert(createdProjectId > 0, `Created project ID: ${createdProjectId}`);

    // 6. Test Multi-Image Gallery Upload
    console.log('\n--- 6. Testing Multiple Image Gallery Upload ---');
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a7df97420000000049454e44ae426082',
      'hex'
    );

    let multipartBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="gallery-shot-1.png"\r\nContent-Type: image/png\r\n\r\n`),
      pngBuffer,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="gallery-shot-2.png"\r\nContent-Type: image/png\r\n\r\n`),
      pngBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const uploadRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/projects/${createdProjectId}/images`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length,
        'Authorization': `Bearer ${token}`
      }
    }, multipartBody);

    assert(uploadRes.status === 200, 'POST /api/admin/projects/:id/images returns HTTP 200');
    assert(uploadRes.json && uploadRes.json.success === true, 'Multi-image upload reported success');
    assert(Array.isArray(uploadRes.json.data) && uploadRes.json.data.length === 2, '2 gallery images stored');
    const image1 = uploadRes.json.data[0];
    const image2 = uploadRes.json.data[1];
    assert(image1.image_url.startsWith('/uploads/'), `Image 1 has persistent upload URL: ${image1.image_url}`);
    assert(image2.image_url.startsWith('/uploads/'), `Image 2 has persistent upload URL: ${image2.image_url}`);

    // Verify files exist on disk
    const diskPath1 = path.join(__dirname, '..', 'public', image1.image_url);
    const diskPath2 = path.join(__dirname, '..', 'public', image2.image_url);
    assert(fs.existsSync(diskPath1), 'Image 1 file physically exists on disk in public/uploads');
    assert(fs.existsSync(diskPath2), 'Image 2 file physically exists on disk in public/uploads');

    // 7. Test Gallery Image Reordering
    console.log('\n--- 7. Testing Gallery Image Reordering ---');
    const reorderPayload = JSON.stringify({ orderedImageIds: [image2.id, image1.id] });
    const reorderRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/projects/${createdProjectId}/images/reorder`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reorderPayload),
        'Authorization': `Bearer ${token}`
      }
    }, reorderPayload);
    assert(reorderRes.status === 200, 'POST /api/admin/projects/:id/images/reorder returns HTTP 200');
    assert(reorderRes.json && reorderRes.json.success === true, 'Images reordered successfully');

    // 8. Test Set Cover from Gallery Image
    console.log('\n--- 8. Testing Set Cover from Gallery Image ---');
    const coverPayload = JSON.stringify({ image_url: image2.image_url });
    const coverRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/projects/${createdProjectId}/set-cover`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(coverPayload),
        'Authorization': `Bearer ${token}`
      }
    }, coverPayload);
    assert(coverRes.status === 200, 'POST /api/admin/projects/:id/set-cover returns HTTP 200');
    assert(coverRes.json && coverRes.json.success === true, 'Project cover set to gallery image');

    // 9. Test Gallery Image Caption & Alt Text Update
    console.log('\n--- 9. Testing Gallery Image Metadata Update ---');
    const metaPayload = JSON.stringify({ caption: 'Hero brand lockup mockup', alt_text: 'Brand Identity Mockup' });
    const metaRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/project-images/${image1.id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(metaPayload),
        'Authorization': `Bearer ${token}`
      }
    }, metaPayload);
    assert(metaRes.status === 200, 'PUT /api/admin/project-images/:id returns HTTP 200');

    // 10. Test Public Site Data Synchronization
    console.log('\n--- 10. Testing Public Content Reflection ---');
    const updatedContent = await request({ hostname: 'localhost', port: 3000, path: '/api/public/content', method: 'GET' });
    const foundProject = updatedContent.json.data.projects.find(p => p.id === createdProjectId);
    assert(!!foundProject, 'Newly created project appears on public content endpoint');
    assert(foundProject.title === 'E2E Test Case Study', 'Title matches');
    assert(foundProject.services_used === 'Creative Direction, Brand Identity, UI/UX Systems, Motion', 'Services used match');
    assert(foundProject.challenge.includes('legacy identity'), 'Challenge matches');
    assert(foundProject.gallery.length === 2, 'Gallery images correctly populated on public payload');
    assert(foundProject.gallery[0].id === image2.id, 'Image reordering order (image2 first) verified on public API');

    // 11. Test Single Image Deletion
    console.log('\n--- 11. Testing Single Gallery Image Deletion ---');
    const delImgRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/project-images/${image1.id}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(delImgRes.status === 200, 'DELETE /api/admin/project-images/:id returns HTTP 200');
    assert(!fs.existsSync(diskPath1), 'Unlinked image 1 physically removed from disk');

    // 12. Cleanup: Delete Test Project
    console.log('\n--- 12. Cleaning up Test Project ---');
    const delProjRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/projects/${createdProjectId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(delProjRes.status === 200, 'DELETE /api/admin/projects/:id returns HTTP 200');

    console.log(`\n====================================================`);
    console.log(`RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log(`====================================================\n`);

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  }
}

runTests();
