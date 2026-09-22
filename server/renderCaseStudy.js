/**
 * Dynamic Case Study HTML Renderer
 * Generates an SEO-optimized, luxury responsive case study template for /work/:slug
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderCaseStudy(project, allProjects = []) {
  const title = escapeHtml(project.seo_title || project.title);
  const desc = escapeHtml(project.seo_description || project.short_desc || 'Case study by Mofidul, Creative Director and Brand Designer.');
  const canonicalUrl = `https://mofidul.com/work/${escapeHtml(project.slug || project.id)}`;
  const ogImage = project.seo_image || project.cover_image || '/favicon.svg';
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `https://mofidul.com${ogImage}`;

  // Find next and previous projects for navigation
  const currentIndex = allProjects.findIndex(p => p.id === project.id);
  const nextProject = currentIndex >= 0 && currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : allProjects[0];

  // Parse comma-separated lists
  const servicesList = (project.services_used || '').split(',').map(s => s.trim()).filter(Boolean);
  const techList = (project.technologies || '').split(',').map(t => t.trim()).filter(Boolean);
  const toolsList = (project.tools || '').split(',').map(t => t.trim()).filter(Boolean);
  const tagsList = (project.tags || '').split(',').map(t => t.trim()).filter(Boolean);

  const galleryImages = Array.isArray(project.gallery) ? project.gallery : [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Mofidul</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph / Social Meta -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${title} — Mofidul" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${escapeHtml(fullOgImage)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title} — Mofidul" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${escapeHtml(fullOgImage)}" />

  <!-- Favicons -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="alternate icon" href="/favicon.ico" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  <!-- Stylesheet -->
  <link rel="stylesheet" href="/styles/main.css" />

  <style>
    /* Case Study Custom Layout & Spacing */
    .case-study-hero {
      padding: 130px 0 60px;
      position: relative;
    }
    .back-nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: color var(--transition-fast), transform var(--transition-fast);
    }
    .back-link:hover {
      color: var(--accent);
      transform: translateX(-4px);
    }
    .case-headline {
      font-family: var(--font-display);
      font-size: clamp(36px, 5.5vw, 64px);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin-bottom: 20px;
      color: var(--text-primary);
    }
    .case-lead {
      font-size: clamp(17px, 2vw, 22px);
      color: var(--text-secondary);
      line-height: 1.6;
      max-width: 860px;
      margin-bottom: 36px;
    }
    .case-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
      gap: 16px;
      padding: clamp(16px, 4vw, 24px);
      background: var(--surface-translucent);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      backdrop-filter: blur(20px);
      margin-bottom: 48px;
    }
    @media (max-width: 480px) {
      .case-meta-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
    }
    @media (max-width: 360px) {
      .case-meta-grid {
        grid-template-columns: 1fr;
      }
    }
    .meta-col-label {
      font-family: var(--font-mono);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .meta-col-val {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .case-hero-cover {
      width: 100%;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      margin-bottom: 64px;
      background: #08080f;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }
    .case-hero-cover img, .case-hero-cover video {
      width: 100%;
      height: auto;
      max-height: 700px;
      object-fit: cover;
      display: block;
    }
    .case-narrative-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 64px;
    }
    @media (max-width: 860px) {
      .case-narrative-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
    }
    .narrative-card {
      background: var(--surface-translucent);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: clamp(20px, 4vw, 36px);
      backdrop-filter: blur(16px);
    }
    .narrative-card h3 {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .narrative-card p {
      color: var(--text-secondary);
      line-height: 1.7;
      font-size: 15px;
      white-space: pre-line;
    }
    .pill-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .spec-pill {
      font-size: 12.5px;
      font-family: var(--font-mono);
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
    }
    .gallery-masonry {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
      gap: 24px;
      margin: 40px 0 64px;
    }
    @media (max-width: 680px) {
      .gallery-masonry {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
    .gallery-item-card {
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      background: var(--surface-translucent);
      cursor: zoom-in;
      transition: transform var(--transition-normal), border-color var(--transition-normal);
    }
    .gallery-item-card:hover {
      transform: translateY(-4px);
      border-color: rgba(56, 189, 248, 0.4);
    }
    .gallery-item-card img {
      width: 100%;
      height: auto;
      display: block;
      transition: transform var(--transition-slow);
    }
    .gallery-item-card:hover img {
      transform: scale(1.02);
    }
    .gallery-caption {
      padding: 14px 18px;
      font-size: 13px;
      color: var(--text-muted);
      border-top: 1px solid var(--border-subtle);
      background: rgba(10, 10, 18, 0.6);
    }
    .case-actions-bar {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
      padding: 32px;
      background: var(--surface-translucent);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      margin-bottom: 80px;
    }
    .next-project-banner {
      border-top: 1px solid var(--border-subtle);
      padding: 80px 0;
      text-align: center;
      position: relative;
    }
    .next-project-banner .label-caps {
      margin-bottom: 16px;
      display: inline-block;
    }
    .next-project-title {
      font-family: var(--font-display);
      font-size: clamp(28px, 4vw, 48px);
      font-weight: 800;
      color: var(--text-primary);
      text-decoration: none;
      transition: color var(--transition-fast);
      display: inline-flex;
      align-items: center;
      gap: 16px;
    }
    .next-project-title:hover {
      color: var(--accent);
    }
  </style>
</head>
<body class="case-study-page">

  <!-- Transparent Water-Lens Cursor -->
  <div id="cursor-water-drop" class="cursor-water-drop" aria-hidden="true">
    <div class="water-specular-glint"></div>
  </div>

  <!-- Header -->
  <header class="site-header scrolled">
    <div class="container header-inner">
      <a href="/" class="brand-logo">
        MOFIDUL
        <span class="logo-dot"></span>
      </a>

      <div class="nav-status-badge">
        <span class="status-indicator"></span>
        <span>${escapeHtml(project.category)} Case Study</span>
      </div>

      <nav>
        <ul class="nav-links">
          <li><a href="/#work" class="nav-link">All Works</a></li>
          <li><a href="/#services" class="nav-link">Services</a></li>
          <li><a href="/#about" class="nav-link">About</a></li>
          <li><a href="/#contact" class="btn btn-secondary btn-sm">Get in Touch</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <!-- Ambient Continuous Atmosphere Spine -->
  <div class="global-atmosphere-spine" aria-hidden="true" style="opacity: 0.65;">
    <svg class="spine-stream-svg" viewBox="0 0 1440 3000" preserveAspectRatio="none" fill="none">
      <path d="M1020,0 C1200,300 800,800 600,1200 C400,1600 1100,2000 800,2600" stroke="url(#csSpineGrad)" stroke-width="2.5" opacity="0.5" />
      <defs>
        <linearGradient id="csSpineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="50%" stop-color="#6366f1" />
          <stop offset="100%" stop-color="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  </div>

  <main>
    <article class="case-study-hero">
      <div class="container">
        <!-- Back navigation -->
        <div class="back-nav-bar">
          <a href="/#work" class="back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Selected Works
          </a>
          <span class="label-caps">${escapeHtml(project.category)} · ${escapeHtml(project.year || '2025')}</span>
        </div>

        <!-- Headline & Summary -->
        <h1 class="case-headline">${escapeHtml(project.title)}</h1>
        <p class="case-lead">${escapeHtml(project.short_desc)}</p>

        <!-- Project Metadata Strip -->
        <div class="case-meta-grid">
          ${project.client ? `
            <div>
              <div class="meta-col-label">Client</div>
              <div class="meta-col-val">${escapeHtml(project.client)}</div>
            </div>
          ` : ''}

          ${project.industry ? `
            <div>
              <div class="meta-col-label">Industry</div>
              <div class="meta-col-val">${escapeHtml(project.industry)}</div>
            </div>
          ` : ''}

          ${project.role ? `
            <div>
              <div class="meta-col-label">Role</div>
              <div class="meta-col-val">${escapeHtml(project.role)}</div>
            </div>
          ` : ''}

          ${project.duration ? `
            <div>
              <div class="meta-col-label">Duration</div>
              <div class="meta-col-val">${escapeHtml(project.duration)}</div>
            </div>
          ` : ''}

          ${project.team ? `
            <div>
              <div class="meta-col-label">Team</div>
              <div class="meta-col-val">${escapeHtml(project.team)}</div>
            </div>
          ` : ''}

          <div>
            <div class="meta-col-label">Year</div>
            <div class="meta-col-val">${escapeHtml(project.year || '2025')}</div>
          </div>
        </div>

        <!-- Hero Media Banner -->
        ${project.video_url && project.video_url.endsWith('.mp4') ? `
          <div class="case-hero-cover">
            <video src="${escapeHtml(project.video_url)}" autoplay loop muted playsinline></video>
          </div>
        ` : project.cover_image ? `
          <div class="case-hero-cover">
            <img src="${escapeHtml(project.cover_image)}" alt="${escapeHtml(project.title)}" />
          </div>
        ` : `
          <div class="case-hero-cover project-typographic-cover" style="height: 480px;">
            <div class="project-typo-monogram">${escapeHtml(project.title.substring(0, 2).toUpperCase())}</div>
            <div class="project-typo-sub">${escapeHtml(project.title)}</div>
          </div>
        `}

        <!-- Narrative Section: Overview & Deep Dive -->
        ${project.full_desc ? `
          <div class="narrative-card" style="margin-bottom: 32px;">
            <h3>Project Overview</h3>
            <p>${escapeHtml(project.full_desc)}</p>
          </div>
        ` : ''}

        <!-- Case Study Challenge & Solution Matrix -->
        <div class="case-narrative-grid">
          ${project.challenge || project.objective ? `
            <div class="narrative-card">
              <h3>The Challenge &amp; Objective</h3>
              <p>${escapeHtml(project.challenge || project.objective)}</p>
            </div>
          ` : ''}

          ${project.strategy || project.process ? `
            <div class="narrative-card">
              <h3>Strategy &amp; Methodology</h3>
              <p>${escapeHtml(project.strategy || project.process)}</p>
            </div>
          ` : ''}

          ${project.solution ? `
            <div class="narrative-card">
              <h3>The Crafted Solution</h3>
              <p>${escapeHtml(project.solution)}</p>
            </div>
          ` : ''}

          ${project.results || project.highlights ? `
            <div class="narrative-card">
              <h3>Impact &amp; Measurable Results</h3>
              <p>${escapeHtml(project.results || project.highlights)}</p>
            </div>
          ` : ''}
        </div>

        <!-- Disciplines & Technology Stack -->
        ${servicesList.length > 0 || techList.length > 0 || toolsList.length > 0 ? `
          <div class="narrative-card" style="margin-bottom: 48px;">
            <h3>Disciplines, Tools &amp; Technologies</h3>
            <div class="pill-cloud">
              ${servicesList.map(s => `<span class="spec-pill" style="border-color: rgba(56, 189, 248, 0.4); color: var(--accent);">${escapeHtml(s)}</span>`).join('')}
              ${techList.map(t => `<span class="spec-pill">${escapeHtml(t)}</span>`).join('')}
              ${toolsList.map(tool => `<span class="spec-pill">${escapeHtml(tool)}</span>`).join('')}
              ${tagsList.map(tag => `<span class="spec-pill">#${escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Multi-Image Visual Gallery -->
        ${galleryImages.length > 0 ? `
          <div style="margin: 60px 0 24px;">
            <span class="label-caps">VISUAL DOCUMENTATION</span>
            <h2 class="case-headline" style="font-size: 36px; margin-top: 8px;">Exhibition &amp; Artifacts</h2>
          </div>
          <div class="gallery-masonry">
            ${galleryImages.map((img, idx) => `
              <div class="gallery-item-card" onclick="openLightbox('${escapeHtml(img.image_url)}', '${escapeHtml(img.caption || img.alt_text || project.title)}')">
                <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.alt_text || project.title)}" loading="lazy" />
                ${img.caption ? `<div class="gallery-caption">${escapeHtml(img.caption)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Action Buttons -->
        <div class="case-actions-bar">
          ${project.project_url ? `
            <a href="${escapeHtml(project.project_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
              <span>Visit Live Experience</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>
          ` : ''}

          ${project.github_url ? `
            <a href="${escapeHtml(project.github_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
              <span>View Source / Documentation</span>
            </a>
          ` : ''}

          <a href="${escapeHtml(project.cta_url || '/#contact')}" class="btn btn-primary" style="margin-left: auto;">
            <span>${escapeHtml(project.cta_text || 'Inquire for Similar Project')}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>

      </div>
    </article>

    <!-- Next Project Banner -->
    ${nextProject && nextProject.slug !== project.slug ? `
      <section class="next-project-banner">
        <div class="container">
          <span class="label-caps">NEXT CASE STUDY</span>
          <div>
            <a href="/work/${escapeHtml(nextProject.slug || nextProject.id)}" class="next-project-title">
              ${escapeHtml(nextProject.title)}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </section>
    ` : ''}
  </main>

  <!-- Image Lightbox Modal -->
  <div id="case-lightbox" class="modal-backdrop" role="dialog" aria-modal="true" style="display: none;" onclick="closeLightbox(event)">
    <div style="position: relative; max-width: 90vw; max-height: 90vh;">
      <button class="modal-close-btn" onclick="closeLightbox(event)" style="top: -50px; right: 0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <img id="lightbox-img" src="" alt="Enlarged preview" style="max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 8px; border: 1px solid var(--border-subtle);" />
      <div id="lightbox-caption" style="text-align: center; color: var(--text-secondary); margin-top: 12px; font-size: 14px;"></div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container footer-bottom">
      <div class="footer-copy">
        &copy; ${new Date().getFullYear()} Mofidul. All rights reserved. Built with bespoke editorial craft.
      </div>
      <div class="footer-legal">
        <a href="/#work">Selected Works</a>
        <a href="/#about">Vision &amp; Philosophy</a>
        <a href="/#contact">Direct Contact</a>
        <a href="/admin">Admin Portal</a>
      </div>
    </div>
  </footer>

  <script>
    function openLightbox(url, caption) {
      const modal = document.getElementById('case-lightbox');
      const img = document.getElementById('lightbox-img');
      const cap = document.getElementById('lightbox-caption');
      if (modal && img) {
        img.src = url;
        if (cap) cap.textContent = caption || '';
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    }
    function closeLightbox(e) {
      if (e) e.stopPropagation();
      const modal = document.getElementById('case-lightbox');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    // Water Drop Cursor
    const cursorDrop = document.getElementById('cursor-water-drop');
    if (cursorDrop && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let mx = -100, my = -100, cx = -100, cy = -100;
      window.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        cursorDrop.classList.add('active');
      });
      document.addEventListener('mouseleave', () => {
        cursorDrop.classList.remove('active');
      });
      function loop() {
        cx += (mx - cx) * 0.40;
        cy += (my - cy) * 0.40;
        cursorDrop.style.transform = 'translate3d(' + cx + 'px, ' + cy + 'px, 0) translate(-50%, -50%) scale(1.08)';
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }
  </script>
</body>
</html>`;
}

module.exports = { renderCaseStudy };
