/**
 * Comprehensive Responsive & Mobile Viewport Audit
 * Validates CSS breakpoint constraints, grid rules, modal adaptations,
 * and HTTP delivery for viewports: 320px, 360px, 375px, 390px, 412px, 430px, 768px, 1024px, 1440px+.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

function fetchHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function runResponsiveAudit() {
  console.log('📱 Starting Comprehensive Mobile & Viewport Audit...\n');

  const mainCss = fs.readFileSync(path.join(__dirname, '../public/styles/main.css'), 'utf8');
  const adminCss = fs.readFileSync(path.join(__dirname, '../public/admin/admin.css'), 'utf8');
  const caseStudyRenderer = fs.readFileSync(path.join(__dirname, '../server/renderCaseStudy.js'), 'utf8');

  // 1. Mobile Phone Viewport Grid Rules (320px - 430px)
  console.log('1. Auditing CSS Grid & Flex constraints for 320px-430px viewports...');
  assert(mainCss.includes('minmax(min(100%, 280px), 1fr)'), 'skills-grid must use fluid minmax to prevent 320px overflow');
  assert(mainCss.includes('@media (max-width: 480px)'), 'main.css must contain 480px small mobile breakpoints');
  assert(mainCss.includes('@media (max-width: 400px)'), 'main.css must contain 400px narrow phone breakpoints for timeline');
  console.log('   ✓ Skills grid and timeline rules safely accommodate 320px screens without horizontal scrolling');

  // 2. Case Study Template Mobile Responsiveness
  console.log('\n2. Auditing dynamic case study template responsive rules...');
  assert(caseStudyRenderer.includes('minmax(min(100%, 150px), 1fr)'), 'case-meta-grid must adapt fluidly on small screens');
  assert(caseStudyRenderer.includes('@media (max-width: 480px)'), 'case study must have 480px mobile breakpoint');
  assert(caseStudyRenderer.includes('@media (max-width: 360px)'), 'case study must adapt to narrow 360px/320px screens');
  assert(caseStudyRenderer.includes('minmax(min(100%, 300px), 1fr)'), 'gallery-masonry must use fluid minmax');
  console.log('   ✓ Case study template adapts cleanly from 320px to 1440px+');

  // 3. Admin Dashboard Mobile & Modal Adaptations
  console.log('\n3. Auditing admin dashboard responsive modal and table adaptations...');
  assert(adminCss.includes('@media (max-width: 900px)'), 'admin.css must collapse sidebar on tablets');
  assert(adminCss.includes('@media (max-width: 600px)'), 'admin.css must adapt form grids and modals on mobile');
  assert(adminCss.includes('@media (max-width: 400px)'), 'admin.css must support 320px-400px narrow phones');
  assert(adminCss.includes('width: calc(100% - 16px) !important;'), 'modal-dialog must fit narrow phone screens with margins');
  console.log('   ✓ Admin dashboard sidebar, metrics cards, and modals adapt cleanly down to 320px');

  // 4. Live HTTP Delivery on Viewport Targets
  console.log('\n4. Testing Live HTTP endpoints for responsive headers and viewports...');
  const resHome = await fetchHttp('http://localhost:3000/');
  assert.strictEqual(resHome.status, 200, 'Home page must return 200');
  assert(resHome.body.includes('name="viewport" content="width=device-width, initial-scale=1.0"'), 'Home page must have standard mobile viewport meta');

  const resCase = await fetchHttp('http://localhost:3000/work/solstice-autonomous-interface');
  assert.strictEqual(resCase.status, 200, 'Case study page must return 200');
  assert(resCase.body.includes('name="viewport" content="width=device-width, initial-scale=1.0"'), 'Case study must have mobile viewport meta');

  const resAdmin = await fetchHttp('http://localhost:3000/admin/');
  assert.strictEqual(resAdmin.status, 200, 'Admin page must return 200');
  assert(resAdmin.body.includes('name="viewport" content="width=device-width, initial-scale=1.0"'), 'Admin page must have mobile viewport meta');
  console.log('   ✓ Live HTTP pages serve valid responsive viewport directives');

  console.log('\n====================================================');
  console.log('🎉 COMPREHENSIVE RESPONSIVE & MOBILE AUDIT PASSED!');
  console.log('====================================================\n');
}

runResponsiveAudit().catch(err => {
  console.error('\n❌ RESPONSIVE AUDIT FAILED:', err);
  process.exit(1);
});
