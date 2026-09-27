require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const db = require('./db');
const apiRouter = require('./routes/api');
const { renderCaseStudy } = require('./renderCaseStudy');
const { getSitemapXml, getRssXml, getJsonFeed, getRobotsTxt, getBaseUrl } = require('./seo');
const { JWT_SECRET } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Native lightweight compression middleware for text-based responses
const compressionMiddleware = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate')) {
    return next();
  }

  const originalSend = res.send;
  res.send = function (body) {
    if (!body || req.method === 'HEAD') {
      return originalSend.call(this, body);
    }

    const contentType = res.getHeader('Content-Type') || '';
    const isCompressible = /text|json|javascript|xml|svg/i.test(contentType);

    if (!isCompressible) {
      return originalSend.call(this, body);
    }

    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'object' ? JSON.stringify(body) : String(body));
    if (buffer.length < 1024) {
      return originalSend.call(this, body);
    }

    try {
      if (acceptEncoding.includes('gzip')) {
        const compressed = zlib.gzipSync(buffer, { level: 6 });
        res.setHeader('Content-Encoding', 'gzip');
        res.removeHeader('Content-Length');
        return originalSend.call(this, compressed);
      } else if (acceptEncoding.includes('deflate')) {
        const compressed = zlib.deflateSync(buffer, { level: 6 });
        res.setHeader('Content-Encoding', 'deflate');
        res.removeHeader('Content-Length');
        return originalSend.call(this, compressed);
      }
    } catch (e) {
      // Fallback to uncompressed on error
    }

    return originalSend.call(this, body);
  };

  next();
};

app.use(compressionMiddleware);

// Body parser & cookie parser middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Security and performance headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Static directories
const publicDir = path.resolve(__dirname, '../public');
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(publicDir, 'uploads'));

// Health & diagnostics endpoint
app.get('/api/health', (req, res) => {
  let dbOk = false;
  try {
    const check = db.prepare('SELECT 1 as alive').get();
    dbOk = check && check.alive === 1;
  } catch (e) {
    dbOk = false;
  }
  const mem = process.memoryUsage();
  res.json({
    status: dbOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    database: dbOk ? 'connected' : 'error',
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024)
    }
  });
});

// Dynamic XML Sitemap
app.get('/sitemap.xml', (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const { xml, etag } = getSitemapXml(baseUrl);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    if (etag) {
      res.setHeader('ETag', etag);
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
    }
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// Dynamic RSS 2.0 Feed
app.get(['/feed.xml', '/rss.xml'], (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const { xml, etag } = getRssXml(baseUrl);
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    if (etag) {
      res.setHeader('ETag', etag);
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
    }
    res.send(xml);
  } catch (err) {
    console.error('RSS feed error:', err);
    res.status(500).send('Error generating RSS feed');
  }
});

// Dynamic JSON Feed 1.1
app.get('/feed.json', (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const feed = getJsonFeed(baseUrl);
    res.setHeader('Content-Type', 'application/feed+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(feed);
  } catch (err) {
    console.error('JSON feed error:', err);
    res.status(500).json({ error: 'Error generating JSON feed' });
  }
});

// Dynamic Robots.txt
app.get('/robots.txt', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(getRobotsTxt(baseUrl));
});

// Static directories with zero-cache policy for HTML and long-term cache for immutable assets
const staticHtmlNoCache = {
  etag: true,
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
};

app.use('/uploads', express.static(uploadDir, { maxAge: '7d', etag: true }));
app.use('/admin', express.static(path.join(publicDir, 'admin'), staticHtmlNoCache));
app.use(express.static(publicDir, staticHtmlNoCache));

// API routes mounted directly
app.use(apiRouter);

// Any unhandled /api route returns JSON 404
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Admin SPA fallback with zero-cache headers
app.get(['/admin', '/admin/*'], (req, res) => {
  const adminHtml = path.join(publicDir, 'admin', 'index.html');
  if (fs.existsSync(adminHtml)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(adminHtml);
  } else {
    res.status(503).send('Admin dashboard initializing...');
  }
});

// Dynamic Project Case Study Template (/work/:slug)
app.get(['/work/:slug', '/work/:slug/'], (req, res) => {
  try {
    const slug = req.params.slug;
    let project = db.prepare('SELECT * FROM projects WHERE slug = ?').get(slug);
    if (!project && !isNaN(Number(slug))) {
      project = db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(slug));
    }

    if (!project) {
      return res.redirect('/#work');
    }

    // Check publication status & draft authorization
    let isDraftPreview = false;
    const isPublished = project.is_active === 1 && (!project.status || project.status === 'published');
    if (!isPublished) {
      let token = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const admin = db.prepare('SELECT id FROM admin_users WHERE id = ?').get(decoded.id);
          if (admin) {
            isDraftPreview = true;
          }
        } catch (e) {
          // Token invalid/expired
        }
      }

      if (!isDraftPreview) {
        return res.redirect('/#work');
      }
    }

    project.gallery = db.prepare('SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC, id ASC').all(project.id);
    const allProjects = db.prepare("SELECT id, title, slug FROM projects WHERE is_active = 1 AND (status = 'published' OR status IS NULL OR status = '') ORDER BY sort_order ASC, id ASC").all();

    const html = renderCaseStudy(project, allProjects, isDraftPreview);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (isDraftPreview) {
      res.setHeader('Cache-Control', 'no-store, private');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }
    res.send(html);
  } catch (err) {
    console.error('Case study rendering error:', err);
    res.redirect('/#work');
  }
});

// Public Portfolio fallback
app.get('*', (req, res) => {
  const indexHtml = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(503).send('Portfolio loading...');
  }
});

// Global error handler with Multer support
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds maximum allowed limit (50MB).' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`✨ MOFIDUL PORTFOLIO & CMS SERVER RUNNING`);
  console.log(`🌐 Public Website:  http://localhost:${PORT}`);
  console.log(`🔒 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🗺️ Dynamic Sitemap: http://localhost:${PORT}/sitemap.xml`);
  console.log(`📡 Dynamic RSS:     http://localhost:${PORT}/feed.xml`);
  console.log(`🩺 Health API:      http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

// Handle termination signals cleanly
const handleShutdown = () => {
  console.log('\n🛑 Gracefully shutting down portfolio server...');
  if (typeof db.closeDb === 'function') {
    db.closeDb();
  } else if (typeof db.checkpointDb === 'function') {
    db.checkpointDb('TRUNCATE');
  }
  server.close(() => {
    console.log('✓ Server closed safely.');
    process.exit(0);
  });
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

process.on('beforeExit', () => {
  if (typeof db.checkpointDb === 'function') {
    db.checkpointDb('TRUNCATE');
  }
});

// Process unhandled errors safely
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  if (typeof db.checkpointDb === 'function') {
    db.checkpointDb('TRUNCATE');
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (typeof db.checkpointDb === 'function') {
    db.checkpointDb('TRUNCATE');
  }
});
