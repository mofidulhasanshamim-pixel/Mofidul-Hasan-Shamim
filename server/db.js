const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure data and uploads directories exist
const dataDir = path.resolve(process.env.DATA_DIR || './data');
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './public/uploads');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'portfolio.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign key constraints for high reliability
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Initialize all relational database tables
 */
function initSchema() {
  db.exec(`
    -- Admin Users Table
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Site Settings Table
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      site_title TEXT NOT NULL DEFAULT 'Mofidul — Creative Director & Designer',
      meta_description TEXT NOT NULL DEFAULT 'Personal portfolio of Mofidul, Creative Director and Brand Designer.',
      keywords TEXT DEFAULT 'Mofidul, Creative Director, Brand Designer, UI/UX, AI Creative Strategy',
      accent_color TEXT DEFAULT '#f5f5f7',
      show_testimonials INTEGER DEFAULT 1,
      show_stats INTEGER DEFAULT 1,
      show_services INTEGER DEFAULT 1,
      show_about INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Hero Content Table
    CREATE TABLE IF NOT EXISTS hero_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      greeting TEXT DEFAULT 'HELLO, I AM',
      name TEXT NOT NULL DEFAULT 'Mofidul',
      role_title TEXT NOT NULL DEFAULT 'Creative Director & Brand Designer',
      positioning_statement TEXT NOT NULL DEFAULT 'Specializing in high-end brand identity, digital craft, and AI-driven creative strategy for forward-thinking brands worldwide.',
      primary_cta_text TEXT DEFAULT 'View Selected Works',
      primary_cta_url TEXT DEFAULT '#work',
      secondary_cta_text TEXT DEFAULT 'Get in Touch',
      secondary_cta_url TEXT DEFAULT '#contact',
      profile_image_url TEXT DEFAULT '',
      profile_image_alt TEXT DEFAULT 'Mofidul Profile Photo',
      availability_status TEXT DEFAULT 'Available for select commissions',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- About Content Table
    CREATE TABLE IF NOT EXISTS about_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      eyebrow TEXT DEFAULT 'ABOUT MOFIDUL',
      headline TEXT NOT NULL DEFAULT 'Crafting timeless identities and digital experiences at the intersection of design, technology, and strategic vision.',
      headline_accent TEXT DEFAULT 'intersection',
      bio_paragraph_1 TEXT NOT NULL DEFAULT 'With over a decade of hands-on experience guiding visual identities and digital products, I collaborate with founders, visionary teams, and cultural innovators to distill complex ideas into clean, unforgettable visual systems.',
      bio_paragraph_2 TEXT NOT NULL DEFAULT 'My practice balances meticulous craft with forward-leaning methodologies, seamlessly integrating modern AI workflows into traditional creative direction to achieve speed without compromising aesthetic rigor.',
      quote TEXT DEFAULT 'Design is not just what it looks like; it is the clarity of thought made visible.',
      quote_accent TEXT DEFAULT 'clarity of thought',
      experience_years TEXT DEFAULT '10+ Years',
      availability_badge TEXT DEFAULT 'Open for Q3/Q4 Projects',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Services Table
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT,
      short_desc TEXT NOT NULL,
      full_desc TEXT,
      icon_name TEXT DEFAULT 'sparkles',
      category TEXT DEFAULT 'Design & Direction',
      skills TEXT DEFAULT '',
      tools TEXT DEFAULT '',
      process TEXT DEFAULT '',
      deliverables TEXT DEFAULT '',
      benefits TEXT DEFAULT '',
      outcomes TEXT DEFAULT '',
      cta_text TEXT DEFAULT 'Inquire About Service',
      cta_url TEXT DEFAULT '#contact',
      is_featured INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Projects Table
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT,
      category TEXT NOT NULL,
      client TEXT,
      industry TEXT DEFAULT '',
      year TEXT,
      duration TEXT DEFAULT '',
      role TEXT DEFAULT '',
      team TEXT DEFAULT '',
      short_desc TEXT NOT NULL,
      full_desc TEXT,
      project_url TEXT,
      github_url TEXT,
      cover_image TEXT DEFAULT '',
      thumbnail_image TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      hero_media TEXT DEFAULT '',
      mockups TEXT DEFAULT '',
      before_after_media TEXT DEFAULT '',
      services_used TEXT DEFAULT '',
      technologies TEXT DEFAULT '',
      tools TEXT DEFAULT '',
      skills TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      challenge TEXT DEFAULT '',
      objective TEXT DEFAULT '',
      strategy TEXT DEFAULT '',
      process TEXT DEFAULT '',
      solution TEXT DEFAULT '',
      results TEXT DEFAULT '',
      highlights TEXT DEFAULT '',
      social_links TEXT DEFAULT '',
      cta_text TEXT DEFAULT 'Start a Project',
      cta_url TEXT DEFAULT '#contact',
      additional_info TEXT DEFAULT '',
      seo_title TEXT DEFAULT '',
      seo_description TEXT DEFAULT '',
      seo_image TEXT DEFAULT '',
      is_featured INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Project Images (Gallery) Table
    CREATE TABLE IF NOT EXISTS project_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT,
      alt_text TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Skills Table
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Design Systems',
      description TEXT DEFAULT '',
      proficiency TEXT DEFAULT '95%',
      icon_name TEXT DEFAULT 'sparkles',
      related_services TEXT DEFAULT '',
      related_projects TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 1,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Experience Table
    CREATE TABLE IF NOT EXISTS experience (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT DEFAULT '',
      is_current INTEGER DEFAULT 0,
      location TEXT DEFAULT 'Remote / Global',
      description TEXT DEFAULT '',
      responsibilities TEXT DEFAULT '',
      achievements TEXT DEFAULT '',
      technologies TEXT DEFAULT '',
      company_logo TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Statistics Table
    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_value TEXT NOT NULL,
      metric_suffix TEXT DEFAULT '',
      label TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    -- Testimonials Table
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_role TEXT NOT NULL,
      company TEXT,
      testimonial_text TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      company_logo TEXT DEFAULT '',
      related_project TEXT DEFAULT '',
      rating INTEGER DEFAULT 5,
      is_featured INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Contact Info Table
    CREATE TABLE IF NOT EXISTS contact_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      heading TEXT DEFAULT 'Let us create something extraordinary.',
      subheading TEXT DEFAULT 'Currently accepting select commissions for creative direction, brand identity, and digital product design.',
      email TEXT DEFAULT 'hello@mofidul.com',
      phone TEXT DEFAULT '+1 (555) 019-2834',
      location TEXT DEFAULT 'Available Worldwide',
      availability_text TEXT DEFAULT 'Available for Q3/Q4 Commissions',
      response_time TEXT DEFAULT 'Typically responds within 24 hours',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Social Links Table
    CREATE TABLE IF NOT EXISTS social_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT DEFAULT 'external-link',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    -- Navigation Links Table
    CREATE TABLE IF NOT EXISTS navigation_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );

    -- Section Settings Table
    CREATE TABLE IF NOT EXISTS section_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT UNIQUE NOT NULL,
      is_enabled INTEGER DEFAULT 1,
      section_title TEXT NOT NULL,
      section_subtitle TEXT DEFAULT '',
      section_eyebrow TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );

    -- Media Library Table
    CREATE TABLE IF NOT EXISTS media_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      alt_text TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Inbox Inquiries Table
    CREATE TABLE IF NOT EXISTS inbox_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Seed initial baseline data if tables are empty
 */
function seedInitialData() {
  // ---------------------------------------------------------------------------
  // Admin credentials — read exclusively from environment variables.
  // In production, fail loudly if any are missing.
  // ---------------------------------------------------------------------------
  const isProduction = process.env.NODE_ENV === 'production';
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminEmail || !adminPassword) {
    if (isProduction) {
      console.error('[FATAL] ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD must all be set in production.');
      process.exit(1);
    } else {
      console.warn('[WARN]  ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD not set. Admin seeding skipped.');
    }
  }

  // 1. Primary admin account
  const adminStmt = db.prepare('SELECT count(*) as count FROM admin_users');
  const adminRow = adminStmt.get();
  if (adminRow.count === 0 && adminUsername && adminEmail && adminPassword) {
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(adminPassword, salt);
    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (username, email, password_hash)
      VALUES (?, ?, ?)
    `);
    insertAdmin.run(adminUsername, adminEmail, hash);
    console.log(`✔ Initial admin account seeded (user: ${adminUsername})`);
  }

  // 2. Ensure an 'admin' alias account exists (uses same env credentials)
  if (adminUsername && adminPassword) {
    const adminAliasStmt = db.prepare('SELECT count(*) as count FROM admin_users WHERE username = ?');
    if (adminAliasStmt.get('admin').count === 0 && adminUsername !== 'admin') {
      const salt = bcrypt.genSaltSync(12);
      const hash = bcrypt.hashSync(adminPassword, salt);
      db.prepare(`
        INSERT INTO admin_users (username, email, password_hash)
        VALUES (?, ?, ?)
      `).run('admin', `admin+${adminEmail}`, hash);
      console.log('✔ Admin alias account seeded (user: admin)');
    }
  }

  // 2. Site Settings
  const settingsStmt = db.prepare('SELECT count(*) as count FROM site_settings WHERE id = 1');
  if (settingsStmt.get().count === 0) {
    db.exec(`
      INSERT INTO site_settings (id, site_title, meta_description, keywords, show_testimonials, show_stats, show_services, show_about)
      VALUES (1, 'Mofidul — Creative Director & Designer', 'Personal portfolio of Mofidul, Creative Director and Brand Designer specializing in brand identity and digital craft.', 'Mofidul, Creative Director, Brand Designer, UI/UX, AI Creative Strategy', 1, 1, 1, 1)
    `);
  }

  // 3. Hero Content
  const heroStmt = db.prepare('SELECT count(*) as count FROM hero_content WHERE id = 1');
  if (heroStmt.get().count === 0) {
    db.exec(`
      INSERT INTO hero_content (id, greeting, name, role_title, positioning_statement, primary_cta_text, primary_cta_url, secondary_cta_text, secondary_cta_url, profile_image_url, profile_image_alt, availability_status)
      VALUES (1, 'HELLO, I AM', 'Mofidul', 'Creative Director & Brand Designer', 'Specializing in high-end brand identity, digital craft, and AI-driven creative strategy for forward-thinking brands worldwide.', 'View Selected Works', '#work', 'Get in Touch', '#contact', '', 'Mofidul Profile Photo', 'Available for select commissions')
    `);
  }

  // 4. About Content
  const aboutStmt = db.prepare('SELECT count(*) as count FROM about_content WHERE id = 1');
  if (aboutStmt.get().count === 0) {
    db.exec(`
      INSERT INTO about_content (id, eyebrow, headline, headline_accent, bio_paragraph_1, bio_paragraph_2, quote, quote_accent, experience_years, availability_badge)
      VALUES (
        1,
        'ABOUT MOFIDUL',
        'Crafting timeless identities and digital experiences at the intersection of design, technology, and strategic vision.',
        'intersection',
        'With over a decade of hands-on experience guiding visual identities and digital products, I collaborate with founders, visionary teams, and cultural innovators to distill complex ideas into clean, unforgettable visual systems.',
        'My practice balances meticulous craft with forward-leaning methodologies, seamlessly integrating modern AI workflows into traditional creative direction to achieve speed without compromising aesthetic rigor.',
        'Design is not just what it looks like; it is the clarity of thought made visible.',
        'clarity of thought',
        '10+ Years',
        'Open for Q3/Q4 Projects'
      )
    `);
  }

  // 5. Contact Info
  const contactStmt = db.prepare('SELECT count(*) as count FROM contact_info WHERE id = 1');
  if (contactStmt.get().count === 0) {
    db.exec(`
      INSERT INTO contact_info (id, heading, subheading, email, phone, location, availability_text, response_time)
      VALUES (1, 'Let us create something extraordinary.', 'Currently accepting select commissions for creative direction, brand identity, and digital product design.', 'hello@mofidul.com', '+1 (555) 019-2834', 'Available Worldwide', 'Available for Q3/Q4 Commissions', 'Typically responds within 24 hours')
    `);
  }

  // 6. Services
  const servicesStmt = db.prepare('SELECT count(*) as count FROM services');
  if (servicesStmt.get().count === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (title, slug, short_desc, full_desc, icon_name, category, deliverables, benefits, outcomes, sort_order, is_active, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'published')
    `);
    insertService.run(
      'Brand Identity & Systems',
      'brand-identity',
      'Holistic visual language, logomarks, typography rules, color palettes, and comprehensive design tokens for enduring brand recognition.',
      'From foundational discovery to master brand architecture, I engineer identity systems built for scalability, digital resonance, and timeless cultural impact.',
      'sparkles',
      'Brand Strategy',
      'Visual Identity System, Brand Guidelines, Design Tokens, Asset Kit',
      'Elevates market presence, unifies internal teams, creates recognizable authority',
      'Immediate 3x clarity in marketing touchpoints and lasting brand equity',
      1
    );
    insertService.run(
      'UI/UX & Digital Experience',
      'digital-experience',
      'High-performance web and product design engineered with immaculate typographic hierarchy, responsive layouts, and fluid micro-interactions.',
      'Bespoke digital platforms that marry editorial elegance with flawless usability, crafted to convert audiences while elevating brand perception.',
      'layout',
      'Product Design',
      'Interactive Prototypes, Component Library, Responsive Web Layouts, Micro-interactions',
      'Frictionless user conversion, premium tactile delight, lightning fast performance',
      'Substantial increase in session duration and digital brand perception',
      2
    );
    insertService.run(
      'Creative & Art Direction',
      'creative-direction',
      'End-to-end visual vision for product launches, editorial campaigns, narrative storytelling, and multimedia brand presence.',
      'Guiding the cohesive aesthetic and emotional tone across every creative touchpoint, ensuring every execution speaks with singular authority.',
      'compass',
      'Direction & Narrative',
      'Campaign Creative Brief, Spatial Concepts, Editorial Layouts, Visual Moodboards',
      'Cohesive omnichannel narrative, standout market differentiation',
      'Award-winning visual campaigns that captivate discerning global audiences',
      3
    );
    insertService.run(
      'AI Creative Strategy & Workflows',
      'ai-creative-strategy',
      'Integrating modern generative visual pipelines and computational design to explore rapid concepts, campaign imagery, and future-ready branding.',
      'Empowering modern brands to leverage AI-assisted creative workflows responsibly and distinctively without diluting bespoke human craftsmanship.',
      'cpu',
      'Emerging Technology',
      'Generative Concept Systems, Rapid Exploration Pipelines, AI Tooling Playbooks',
      '10x concept velocity with zero compromise on art direction or fidelity',
      'Rapid prototype validation and bespoke algorithmic asset generation',
      4
    );
  }

  // 7. Projects
  const projectsStmt = db.prepare('SELECT count(*) as count FROM projects');
  if (projectsStmt.get().count === 0) {
    const insertProject = db.prepare(`
      INSERT INTO projects (title, slug, category, client, year, short_desc, full_desc, project_url, cover_image, is_featured, sort_order, is_active, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', 1, ?, 1, 'published')
    `);
    insertProject.run(
      'Apex Studio Identity',
      'apex-studio',
      'Brand Identity',
      'Apex Collective',
      '2025',
      'Holistic design tokens, typographic hierarchy, and visual branding system for a global architecture and creative house.',
      'Apex Studio required a radical distillation of their visual communication. We developed an austere, high-contrast identity system anchored by custom geometric typography and architectural grid foundations.',
      'https://example.com',
      1
    );
    insertProject.run(
      'Vanguard Digital Experience',
      'vanguard-platform',
      'UI/UX & Web',
      'Vanguard Labs',
      '2025',
      'An editorial, ultra-responsive digital flagship platform prioritizing spatial rhythm, fluid motion, and effortless navigation.',
      'Designed for next-generation intelligence tools, Vanguard combines dark-mode luxury aesthetics with lightning-fast modular user interfaces.',
      'https://example.com',
      2
    );
    insertProject.run(
      'Aura Sensory Systems',
      'aura-sensory',
      'Creative Direction',
      'Aura Inc.',
      '2024',
      'Global campaign positioning, interactive product narratives, and sensory design guidelines for spatial hardware.',
      'A multi-channel creative direction engagement that established Aura as the preeminent luxury name in next-generation sensory computing.',
      'https://example.com',
      3
    );
  }

  // 8. Statistics
  const statsStmt = db.prepare('SELECT count(*) as count FROM statistics');
  if (statsStmt.get().count === 0) {
    const insertStat = db.prepare(`
      INSERT INTO statistics (metric_value, metric_suffix, label, description, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    insertStat.run('10', '+', 'Years of Experience', 'Refining craft, strategy & design leadership', 1);
    insertStat.run('48', '+', 'Delivered Projects', 'Across 14 countries and multiple industries', 2);
    insertStat.run('99', '%', 'Client Satisfaction', 'Cultivating long-term strategic partnerships', 3);
    insertStat.run('12', '', 'Design Recognitions', 'International honors for visual excellence', 4);
  }

  // 9. Social Links
  const socialStmt = db.prepare('SELECT count(*) as count FROM social_links');
  if (socialStmt.get().count === 0) {
    const insertSocial = db.prepare(`
      INSERT INTO social_links (platform, label, url, icon, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    insertSocial.run('LinkedIn', 'LinkedIn', 'https://linkedin.com', 'linkedin', 1);
    insertSocial.run('X / Twitter', 'Twitter', 'https://x.com', 'twitter', 2);
    insertSocial.run('Behance', 'Behance', 'https://behance.net', 'behance', 3);
    insertSocial.run('Dribbble', 'Dribbble', 'https://dribbble.com', 'dribbble', 4);
    insertSocial.run('Instagram', 'Instagram', 'https://instagram.com', 'instagram', 5);
  }

  // 10. Navigation Links
  const navStmt = db.prepare('SELECT count(*) as count FROM navigation_links');
  if (navStmt.get().count === 0) {
    const insertNav = db.prepare(`
      INSERT INTO navigation_links (label, url, is_active, sort_order)
      VALUES (?, ?, 1, ?)
    `);
    insertNav.run('Work', '#work', 1);
    insertNav.run('Services', '#services', 2);
    insertNav.run('Skills', '#skills', 3);
    insertNav.run('Experience', '#experience', 4);
    insertNav.run('Impact', '#stats', 5);
    insertNav.run('About', '#about', 6);
    insertNav.run('Contact', '#contact', 7);
  }

  // 11. Section Settings
  const secStmt = db.prepare('SELECT count(*) as count FROM section_settings');
  if (secStmt.get().count === 0) {
    const insertSec = db.prepare(`
      INSERT INTO section_settings (section_key, is_enabled, section_title, section_subtitle, section_eyebrow, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertSec.run('hero', 1, 'Creative Director & Brand Designer', 'Specializing in high-end brand identity and digital craft', 'HELLO, I AM', 1);
    insertSec.run('work', 1, 'Case Studies & Creations', 'A curated selection of identity systems, digital platforms, and strategic design solutions.', 'SELECTED WORKS', 2);
    insertSec.run('services', 1, 'Core Disciplines & Expertise', 'End-to-end design direction and strategic craft tailored for high-growth ventures.', 'CAPABILITIES', 3);
    insertSec.run('skills', 1, 'Proficiencies & Technical Stack', 'Mastered tools, frameworks, and methodologies bridging artistic direction and engineering.', 'EXPERTISE', 4);
    insertSec.run('experience', 1, 'Career Journey & Leadership', 'A decade of steering design teams, founding creative ventures, and shaping global products.', 'BACKGROUND', 5);
    insertSec.run('stats', 1, 'Impact in Numbers', 'Measurable scale and reach achieved across international design partnerships.', 'METRICS', 6);
    insertSec.run('about', 1, 'Vision, Craft & Philosophy', 'Balancing timeless editorial aesthetics with cutting-edge computational design methodologies.', 'ABOUT MOFIDUL', 7);
    insertSec.run('testimonials', 1, 'Endorsements & Perspectives', 'Direct reflections from founders, executives, and collaborators worldwide.', 'CLIENT WORDS', 8);
    insertSec.run('contact', 1, 'Let us create something extraordinary.', 'Currently accepting select commissions for creative direction, brand identity, and digital product design.', 'GET IN TOUCH', 9);
  }

  // 12. Skills
  const skillsStmt = db.prepare('SELECT count(*) as count FROM skills');
  if (skillsStmt.get().count === 0) {
    const insertSkill = db.prepare(`
      INSERT INTO skills (name, category, description, proficiency, icon_name, related_services, related_projects, sort_order, is_featured, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'published')
    `);
    insertSkill.run('Brand Architecture & Strategy', 'Brand Identity', 'Master design tokens, naming frameworks, and global brand guidelines', '98%', 'compass', 'Brand Identity & Systems', 'Apex Studio Identity', 1);
    insertSkill.run('Typographic Systems & Layout', 'Brand Identity', 'Austere editorial typography, optical scale systems, and bespoke micro-typesetting', '96%', 'layout', 'Brand Identity & Systems', 'Apex Studio Identity', 2);
    insertSkill.run('UI/UX Architecture & Prototyping', 'Product & Digital', 'Design systems in Figma, spatial interfaces, tactile user flows, and wireframing', '95%', 'layout', 'UI/UX & Digital Experience', 'Vanguard Digital Experience', 3);
    insertSkill.run('Front-End Systems & Interaction', 'Product & Digital', 'Modern HTML5, Vanilla CSS architecture, 60fps micro-animations, and responsive layout', '92%', 'code', 'UI/UX & Digital Experience', 'Vanguard Digital Experience', 4);
    insertSkill.run('Creative & Art Direction', 'Creative Direction', 'Omnichannel visual narrative, campaign positioning, and editorial storytelling', '97%', 'sparkles', 'Creative & Art Direction', 'Aura Sensory Systems', 5);
    insertSkill.run('AI & Computational Creative Pipelines', 'Emerging Tech', 'Generative concept pipelines, prompt engineering, Midjourney, and computational aesthetics', '94%', 'cpu', 'AI Creative Strategy & Workflows', 'Aura Sensory Systems', 6);
    insertSkill.run('Motion & Spatial Choreography', 'Emerging Tech', 'Fluid transition curves, WebGL shaders, kinetic typography, and audio-reactive systems', '90%', 'activity', 'UI/UX & Digital Experience', 'Vanguard Digital Experience', 7);
    insertSkill.run('Design Leadership & Mentorship', 'Creative Direction', 'Cross-functional creative leadership, sprint facilitation, and executive pitching', '95%', 'users', 'Creative & Art Direction', 'Apex Studio Identity', 8);
  }

  // 13. Experience
  const expStmt = db.prepare('SELECT count(*) as count FROM experience');
  if (expStmt.get().count === 0) {
    const insertExp = db.prepare(`
      INSERT INTO experience (company, role, start_date, end_date, is_current, location, description, responsibilities, achievements, technologies, sort_order, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `);
    insertExp.run(
      'Mofidul Studio',
      'Founder & Creative Director',
      '2022',
      'Present',
      1,
      'Remote / Global',
      'Leading an independent creative direction and design practice advising venture-backed startups and cultural brands.',
      'Guiding comprehensive brand identities, design systems, and digital flagships from inception to launch.',
      'Directed 30+ visual identities and flagship products reaching over 2M global users.',
      'Figma, Design Tokens, Generative AI, HTML5/CSS3, Spatial Prototyping',
      1
    );
    insertExp.run(
      'Vanguard Labs',
      'Head of Design & Product Experience',
      '2020',
      '2022',
      0,
      'New York / Hybrid',
      'Directed the multidisciplinary design organization shaping next-generation intelligence tools and web experiences.',
      'Oversaw design systems, UX research, creative campaigns, and engineering handoffs.',
      'Scaled active user engagement by 180% through cohesive design system redesign.',
      'Design Systems, Motion Design, Product Strategy, Web Architecture',
      2
    );
    insertExp.run(
      'Apex Creative Collective',
      'Senior Brand & Interaction Designer',
      '2017',
      '2020',
      0,
      'London / Remote',
      'Crafted high-impact visual identities, print collateral, and interactive web presences for architectural and luxury clients.',
      'Authored brand manuals, typographic guidelines, and bespoke interactive websites.',
      'Received 3 international design honors and led client pitches across North America and Europe.',
      'Typography, Grid Systems, Editorial Direction, Interactive Design',
      3
    );
  }

  // 14. Media Library (sync existing disk files)
  try {
    const mediaCount = db.prepare('SELECT count(*) as count FROM media_library').get().count;
    if (mediaCount === 0 && fs.existsSync(uploadDir)) {
      const existingFiles = fs.readdirSync(uploadDir);
      const insertMedia = db.prepare(`
        INSERT INTO media_library (filename, original_name, file_path, mime_type, file_size, alt_text)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const file of existingFiles) {
        if (!file.startsWith('test-') && !file.startsWith('gallery-shot-')) {
          const fullPath = path.join(uploadDir, file);
          const stats = fs.statSync(fullPath);
          const ext = path.extname(file).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';
          insertMedia.run(file, file, `/uploads/${file}`, mime, stats.size, path.basename(file, ext));
        }
      }
    }
  } catch (e) {
    console.warn('Media library initial sync warning:', e.message);
  }
}

/**
 * Run safe column migrations for existing SQLite databases
 */
function runMigrations() {
  try {
    // 1. Projects table migrations
    const projectCols = db.prepare("PRAGMA table_info(projects)").all().map(c => c.name);
    const newProjectCols = [
      { name: 'industry', def: 'TEXT DEFAULT ""' },
      { name: 'duration', def: 'TEXT DEFAULT ""' },
      { name: 'role', def: 'TEXT DEFAULT ""' },
      { name: 'team', def: 'TEXT DEFAULT ""' },
      { name: 'tools', def: 'TEXT DEFAULT ""' },
      { name: 'skills', def: 'TEXT DEFAULT ""' },
      { name: 'thumbnail_image', def: 'TEXT DEFAULT ""' },
      { name: 'video_url', def: 'TEXT DEFAULT ""' },
      { name: 'hero_media', def: 'TEXT DEFAULT ""' },
      { name: 'mockups', def: 'TEXT DEFAULT ""' },
      { name: 'before_after_media', def: 'TEXT DEFAULT ""' },
      { name: 'services_used', def: 'TEXT DEFAULT ""' },
      { name: 'technologies', def: 'TEXT DEFAULT ""' },
      { name: 'tags', def: 'TEXT DEFAULT ""' },
      { name: 'challenge', def: 'TEXT DEFAULT ""' },
      { name: 'objective', def: 'TEXT DEFAULT ""' },
      { name: 'strategy', def: 'TEXT DEFAULT ""' },
      { name: 'process', def: 'TEXT DEFAULT ""' },
      { name: 'solution', def: 'TEXT DEFAULT ""' },
      { name: 'results', def: 'TEXT DEFAULT ""' },
      { name: 'highlights', def: 'TEXT DEFAULT ""' },
      { name: 'social_links', def: 'TEXT DEFAULT ""' },
      { name: 'cta_text', def: 'TEXT DEFAULT "Start a Project"' },
      { name: 'cta_url', def: 'TEXT DEFAULT "#contact"' },
      { name: 'additional_info', def: 'TEXT DEFAULT ""' },
      { name: 'seo_title', def: 'TEXT DEFAULT ""' },
      { name: 'seo_description', def: 'TEXT DEFAULT ""' },
      { name: 'seo_image', def: 'TEXT DEFAULT ""' },
      { name: 'status', def: 'TEXT DEFAULT "published"' }
    ];

    for (const col of newProjectCols) {
      if (!projectCols.includes(col.name)) {
        db.exec(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.def}`);
      }
    }

    // 2. Services table migrations
    const serviceCols = db.prepare("PRAGMA table_info(services)").all().map(c => c.name);
    const newServiceCols = [
      { name: 'category', def: 'TEXT DEFAULT "Design & Direction"' },
      { name: 'skills', def: 'TEXT DEFAULT ""' },
      { name: 'tools', def: 'TEXT DEFAULT ""' },
      { name: 'process', def: 'TEXT DEFAULT ""' },
      { name: 'deliverables', def: 'TEXT DEFAULT ""' },
      { name: 'benefits', def: 'TEXT DEFAULT ""' },
      { name: 'outcomes', def: 'TEXT DEFAULT ""' },
      { name: 'cta_text', def: 'TEXT DEFAULT "Inquire About Service"' },
      { name: 'cta_url', def: 'TEXT DEFAULT "#contact"' },
      { name: 'is_featured', def: 'INTEGER DEFAULT 0' },
      { name: 'status', def: 'TEXT DEFAULT "published"' }
    ];

    for (const col of newServiceCols) {
      if (!serviceCols.includes(col.name)) {
        db.exec(`ALTER TABLE services ADD COLUMN ${col.name} ${col.def}`);
      }
    }

    // 3. Testimonials table migrations
    const testimCols = db.prepare("PRAGMA table_info(testimonials)").all().map(c => c.name);
    const newTestimCols = [
      { name: 'company_logo', def: 'TEXT DEFAULT ""' },
      { name: 'related_project', def: 'TEXT DEFAULT ""' },
      { name: 'is_featured', def: 'INTEGER DEFAULT 1' },
      { name: 'status', def: 'TEXT DEFAULT "published"' }
    ];

    for (const col of newTestimCols) {
      if (!testimCols.includes(col.name)) {
        db.exec(`ALTER TABLE testimonials ADD COLUMN ${col.name} ${col.def}`);
      }
    }

    // 4. Site Settings migrations
    const settingsCols = db.prepare("PRAGMA table_info(site_settings)").all().map(c => c.name);
    const newSettingsCols = [
      { name: 'logo_text', def: 'TEXT DEFAULT "MOFIDUL"' },
      { name: 'favicon_url', def: 'TEXT DEFAULT "/favicon.svg"' },
      { name: 'default_og_image', def: 'TEXT DEFAULT ""' },
      { name: 'resume_url', def: 'TEXT DEFAULT ""' },
      { name: 'show_skills', def: 'INTEGER DEFAULT 1' },
      { name: 'show_experience', def: 'INTEGER DEFAULT 1' }
    ];

    for (const col of newSettingsCols) {
      if (!settingsCols.includes(col.name)) {
        db.exec(`ALTER TABLE site_settings ADD COLUMN ${col.name} ${col.def}`);
      }
    }

    // 5. Project Images alt text
    const imageCols = db.prepare("PRAGMA table_info(project_images)").all().map(c => c.name);
    if (!imageCols.includes('alt_text')) {
      db.exec(`ALTER TABLE project_images ADD COLUMN alt_text TEXT DEFAULT ""`);
    }

    // Ensure all existing projects and services have status set to 'published' if null or empty
    db.exec(`UPDATE projects SET status = 'published' WHERE status IS NULL OR status = ''`);
    db.exec(`UPDATE services SET status = 'published' WHERE status IS NULL OR status = ''`);
    db.exec(`UPDATE testimonials SET status = 'published' WHERE status IS NULL OR status = ''`);
  } catch (err) {
    console.error('Migration warning:', err.message);
  }
}

// Execute initial schema, migrations, and seed
initSchema();
runMigrations();
seedInitialData();

module.exports = db;

