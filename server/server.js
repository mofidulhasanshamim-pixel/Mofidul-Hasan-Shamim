require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser & cookie parser middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Static directories
const publicDir = path.resolve(__dirname, '../public');
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(publicDir, 'uploads'));

app.use('/uploads', express.static(uploadDir));
app.use('/admin', express.static(path.join(publicDir, 'admin')));
app.use(express.static(publicDir));

// API routes mounted directly
app.use(apiRouter);

// Any unhandled /api route returns JSON 404
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Admin SPA fallback
app.get(['/admin', '/admin/*'], (req, res) => {
  const adminHtml = path.join(publicDir, 'admin', 'index.html');
  if (fs.existsSync(adminHtml)) {
    res.sendFile(adminHtml);
  } else {
    res.status(503).send('Admin dashboard initializing...');
  }
});

// Dynamic Project Case Study Template (/work/:slug)
const db = require('./db');
const { renderCaseStudy } = require('./renderCaseStudy');

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

    project.gallery = db.prepare('SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC, id ASC').all(project.id);
    const allProjects = db.prepare("SELECT id, title, slug FROM projects WHERE is_active = 1 AND (status = 'published' OR status IS NULL OR status = '') ORDER BY sort_order ASC, id ASC").all();

    const html = renderCaseStudy(project, allProjects);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
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

// Global error handler
app.use((err, req, res, next) => {
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
  console.log(`====================================================`);
});

// Handle termination signals
const handleShutdown = () => {
  if (typeof db.checkpointDb === 'function') {
    db.checkpointDb();
  }
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

