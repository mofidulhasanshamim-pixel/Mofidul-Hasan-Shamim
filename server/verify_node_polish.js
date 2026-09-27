const assert = require('assert');
const http = require('http');
const zlib = require('zlib');
const db = require('./db');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search
    };

    const req = http.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        let buffer = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') {
          buffer = zlib.gunzipSync(buffer);
        } else if (encoding === 'deflate') {
          buffer = zlib.inflateSync(buffer);
        }
        const text = buffer.toString('utf8');
        let json = null;
        try {
          json = JSON.parse(text);
        } catch (e) {
          // non-JSON
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          rawHeaders: res.rawHeaders,
          body: text,
          json
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runNodePolishVerification() {
  console.log('🚀 STARTING NODE.JS ARCHITECTURE & POLISH VERIFICATION...\n');

  // 1. Health & Diagnostics API
  console.log('[1/10] Verifying Health & Diagnostics endpoint (GET /api/health)...');
  const healthRes = await makeRequest('/api/health');
  assert.strictEqual(healthRes.status, 200, 'Health endpoint should return 200');
  assert.strictEqual(healthRes.json.status, 'healthy');
  assert.strictEqual(healthRes.json.database, 'connected');
  assert(healthRes.json.uptimeSeconds >= 0);
  assert(healthRes.json.memory && healthRes.json.memory.heapUsedMB > 0);
  console.log(`  ✔ Server reported healthy (Uptime: ${healthRes.json.uptimeSeconds}s, Heap: ${healthRes.json.memory.heapUsedMB}MB, Node: ${healthRes.json.nodeVersion})`);

  // 2. Security Headers
  console.log('\n[2/10] Verifying Advanced Security Headers on HTTP responses...');
  assert.strictEqual(healthRes.headers['x-content-type-options'], 'nosniff');
  assert.strictEqual(healthRes.headers['x-frame-options'], 'SAMEORIGIN');
  assert.strictEqual(healthRes.headers['referrer-policy'], 'strict-origin-when-cross-origin');
  assert(healthRes.headers['permissions-policy'].includes('camera=()'));
  assert.strictEqual(healthRes.headers['cross-origin-opener-policy'], 'same-origin');
  console.log('  ✔ X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP verified.');

  // 3. Dynamic XML Sitemap
  console.log('\n[3/10] Verifying Dynamic XML Sitemap (GET /sitemap.xml)...');
  const sitemapRes = await makeRequest('/sitemap.xml');
  assert.strictEqual(sitemapRes.status, 200);
  assert(sitemapRes.headers['content-type'].includes('application/xml'), 'Must return XML content type');
  assert(sitemapRes.headers.etag, 'Must return ETag for browser and crawler caching');
  assert(sitemapRes.body.includes(BASE_URL + '/') || sitemapRes.body.includes('https://mofidul.com/'), 'Must include root URL');
  assert(sitemapRes.body.includes('/work/solstice-autonomous-interface'), 'Must include dynamic case study slug');
  assert(sitemapRes.body.includes('<priority>1.0</priority>'));
  assert(sitemapRes.body.includes('<changefreq>'), 'Must include change frequency tags');

  // Conditional request 304 test
  const cachedSitemapRes = await makeRequest('/sitemap.xml', {
    headers: { 'If-None-Match': sitemapRes.headers.etag }
  });
  assert.strictEqual(cachedSitemapRes.status, 304, 'Must return 304 Not Modified when ETag matches');
  console.log('  ✔ Dynamic XML sitemap queries live projects and handles ETag conditional caching (HTTP 304).');

  // 4. Dynamic RSS & JSON Feeds
  console.log('\n[4/10] Verifying Dynamic Syndication Feeds (GET /feed.xml & /feed.json)...');
  const rssRes = await makeRequest('/feed.xml');
  assert.strictEqual(rssRes.status, 200);
  assert(rssRes.headers['content-type'].includes('application/rss+xml'));
  assert(rssRes.body.includes('<rss version="2.0"'), 'Must have RSS 2.0 envelope');
  assert(rssRes.body.includes('<title>Mofidul'), 'Must have channel title');
  assert(rssRes.body.includes('<item>'), 'Must have case study items');

  const jsonFeedRes = await makeRequest('/feed.json');
  assert.strictEqual(jsonFeedRes.status, 200);
  assert.strictEqual(jsonFeedRes.json.version, 'https://jsonfeed.org/version/1.1');
  assert(jsonFeedRes.json.items.length > 0);
  console.log(`  ✔ Dynamic RSS 2.0 and JSON Feed 1.1 published with ${jsonFeedRes.json.items.length} syndicated items.`);

  // 5. Dynamic Robots.txt
  console.log('\n[5/10] Verifying Dynamic Robots.txt (GET /robots.txt)...');
  const robotsRes = await makeRequest('/robots.txt');
  assert.strictEqual(robotsRes.status, 200);
  assert(robotsRes.body.includes('User-agent: *'));
  assert(robotsRes.body.includes('Disallow: /admin/'));
  assert(robotsRes.body.includes('Sitemap: http://localhost:3000/sitemap.xml') || robotsRes.body.includes('sitemap.xml'));
  console.log('  ✔ Host-aware robots.txt dynamically delivered.');

  // 6. Case Study SSR Enhancements (JSON-LD, Reading Time, Share, Water Drop)
  console.log('\n[6/10] Verifying Case Study SSR Enhancements (GET /work/solstice-autonomous-interface)...');
  const csRes = await makeRequest('/work/solstice-autonomous-interface');
  assert.strictEqual(csRes.status, 200);
  assert(csRes.body.includes('application/ld+json'), 'Must contain JSON-LD Schema.org structured data');
  assert(csRes.body.includes('"@type":"CreativeWork"'), 'Must define CreativeWork schema type');
  assert(csRes.body.includes('"author":{"@type":"Person","name":"Mofidul"'), 'Must credit Mofidul in schema');
  assert(csRes.body.includes('Read Time'), 'Must display estimated read time');
  assert(csRes.body.includes('min read'), 'Must render minutes reading estimation');
  assert(csRes.body.includes('shareCaseStudy()'), 'Must include native Web Share API with clipboard fallback');
  assert(csRes.body.includes('Share Project'), 'Must include Share Project button');
  assert(csRes.body.includes('water-drop-glass'), 'Must contain cursor water drop glass DOM element');
  assert(csRes.body.includes('water-drop-rim'), 'Must contain cursor water drop rim DOM element');
  console.log('  ✔ JSON-LD Schema.org graph, dynamic Read Time, Share handler, and fluid water drop cursor verified.');

  // 7. Case Study Draft Preview Privacy Gate
  console.log('\n[7/10] Verifying Case Study Draft Isolation & Admin Preview Mode...');
  // Create a private draft project
  const draftSlug = `draft-test-${Date.now()}`;
  const insertDraft = db.prepare(`
    INSERT INTO projects (title, slug, category, short_desc, is_active, status)
    VALUES (?, ?, 'Brand Identity', 'Confidential draft', 1, 'draft')
  `).run('Confidential Draft Project', draftSlug);
  const draftId = Number(insertDraft.lastInsertRowid);

  // Unauthenticated request should redirect to /#work (HTTP 302)
  const unauthReq = await new Promise((resolve) => {
    http.get(`${BASE_URL}/work/${draftSlug}`, (res) => {
      resolve({ status: res.statusCode, location: res.headers.location });
    });
  });
  assert.strictEqual(unauthReq.status, 302, 'Draft case study should redirect unauthenticated visitor');
  assert.strictEqual(unauthReq.location, '/#work', 'Must redirect to #work section');

  // Authenticated admin request should render with private draft preview badge
  const loginRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: 'admin', password: 'MofidulAdmin2026!' }
  });
  const token = loginRes.json.token;

  const authDraftRes = await makeRequest(`/work/${draftSlug}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(authDraftRes.status, 200, 'Authenticated admin should be able to preview draft');
  assert(authDraftRes.body.includes('PRIVATE DRAFT PREVIEW'), 'Must render private draft preview indicator');
  assert(authDraftRes.body.includes('draft-indicator-pulse'), 'Must render draft indicator pulse');

  // Clean up test draft
  db.prepare('DELETE FROM projects WHERE id = ?').run(draftId);
  console.log('  ✔ Privacy gate redirects public visitors to /#work and renders PRIVATE DRAFT PREVIEW for admin.');

  // 8. Sliding Window Rate Limiter
  console.log('\n[8/10] Verifying Sliding Window Rate Limiter Headers...');
  const contactRes = await makeRequest('/api/public/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'Test User', email: 'test@example.com', message: 'Hello from verification suite' }
  });
  assert.strictEqual(contactRes.status, 200);
  assert(contactRes.headers['ratelimit-limit'], 'Must send RateLimit-Limit header');
  assert(contactRes.headers['ratelimit-remaining'] !== undefined, 'Must send RateLimit-Remaining header');
  assert(contactRes.headers['ratelimit-reset'], 'Must send RateLimit-Reset header');
  console.log(`  ✔ Rate limiting headers verified (Limit: ${contactRes.headers['ratelimit-limit']}, Remaining: ${contactRes.headers['ratelimit-remaining']})`);

  // 9. Gzip/Deflate Response Compression
  console.log('\n[9/10] Verifying Native Gzip Compression Middleware...');
  const gzipRes = await new Promise((resolve, reject) => {
    http.get(`${BASE_URL}/work/solstice-autonomous-interface`, { headers: { 'Accept-Encoding': 'gzip' } }, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', reject);
  });
  assert.strictEqual(gzipRes.status, 200);
  assert.strictEqual(gzipRes.headers['content-encoding'], 'gzip', 'Must compress responses with gzip when accepted');
  console.log('  ✔ Native gzip compression active on text payloads.');

  // 10. SQLite Concurrency Pragmas and Lifecycle
  console.log('\n[10/10] Verifying SQLite WAL Pragmas & Concurrency Configuration...');
  const busyTimeout = db.prepare('PRAGMA busy_timeout;').get().timeout;
  const journalMode = db.prepare('PRAGMA journal_mode;').get().journal_mode;
  const synchronous = db.prepare('PRAGMA synchronous;').get().synchronous;
  assert(busyTimeout >= 5000, 'busy_timeout must be configured for concurrency');
  assert.strictEqual(journalMode.toLowerCase(), 'wal', 'journal_mode must be WAL');
  assert(typeof db.optimizeDb === 'function', 'db must export optimizeDb');
  assert(typeof db.checkpointDb === 'function', 'db must export checkpointDb');
  assert(typeof db.closeDb === 'function', 'db must export closeDb');
  db.optimizeDb();
  console.log(`  ✔ SQLite WAL mode active, busy_timeout=${busyTimeout}ms, synchronous=${synchronous}, optimizeDb() & closeDb() verified.`);

  console.log('\n====================================================');
  console.log('🎉 ALL 10 NODE.JS ARCHITECTURE & POLISH CHECKS PASSED!');
  console.log('====================================================\n');
}

runNodePolishVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
