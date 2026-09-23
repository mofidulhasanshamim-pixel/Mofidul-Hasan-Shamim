/**
 * MOFIDUL — Portfolio Client Application
 * Fetches dynamic CMS data, handles 60fps scroll animations, category filtering, and modal drawers.
 */

let allProjects = [];

document.addEventListener('DOMContentLoaded', () => {
  setupIntroLoader();
  initApp();
  setupHeaderScroll();
  setupNavScrollspy();
  setupMobileNav();
  setupBackToTop();
  setupModalEvents();
  setupLightboxEvents();
  setupContactForm();
  setupPageTransitions();
  setupHeroAtmosphereParallax();
  setupButterSmoothInteractions();

  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }
});

/**
 * Fetch public content from backend API and render all dynamic sections
 */
async function initApp() {
  try {
    const response = await fetch('/api/public/content');
    if (!response.ok) throw new Error('Network response was not ok');
    
    const { success, data } = await response.json();
    if (!success || !data) throw new Error('Invalid content payload');

    const { settings, hero, about, services, projects, skills, experience, statistics, testimonials, contact, social_links, navigation, sections } = data;

    // Apply Site Settings
    if (settings) {
      if (settings.site_title) {
        document.title = settings.site_title;
      }
      if (settings.meta_description) {
        const metaDesc = document.getElementById('meta-desc');
        if (metaDesc) metaDesc.setAttribute('content', settings.meta_description);
      }
    }

    // Render Dynamic Navigation
    renderNavigation(navigation);

    // Render Sections
    renderHero(hero);
    renderAbout(about, settings?.resume_url);
    renderServices(services, settings?.show_services);
    renderSkills(skills);
    renderExperience(experience);
    renderProjects(projects);
    renderStatistics(statistics, settings?.show_stats);
    renderTestimonials(testimonials, settings?.show_testimonials);
    renderContact(contact, social_links);

    // Apply Section Overrides (Titles, Subtitles, Enable/Disable)
    renderSectionSettings(sections);

    // Initialize Scroll Animations & Interactive Engine
    initScrollAnimations();
    setupButterSmoothInteractions();

    if (typeof window.markAppReady === 'function') {
      window.markAppReady();
    }
  } catch (error) {
    console.error('Failed to load portfolio content:', error);
    if (typeof window.markAppReady === 'function') {
      window.markAppReady();
    }
  }
}

/**
 * Render Hero Section & Profile Image Area
 */
function renderHero(hero) {
  if (!hero) return;

  const greetingElem = document.getElementById('hero-greeting');
  const nameElem = document.getElementById('hero-name');
  const roleElem = document.getElementById('hero-role');
  const positioningElem = document.getElementById('hero-positioning');
  const primaryCta = document.getElementById('hero-primary-cta');
  const primaryCtaText = document.getElementById('hero-primary-cta-text');
  const secondaryCta = document.getElementById('hero-secondary-cta');
  const secondaryCtaText = document.getElementById('hero-secondary-cta-text');
  const headerAvailText = document.getElementById('header-availability-text');
  const profileFrameInner = document.getElementById('profile-frame-inner');

  if (greetingElem && hero.greeting) greetingElem.textContent = hero.greeting;
  if (nameElem && hero.name) nameElem.textContent = hero.name;
  if (roleElem && hero.role_title) {
    // Check if role contains '&' or multiple parts to add editorial accent
    const parts = hero.role_title.split('&');
    if (parts.length > 1) {
      roleElem.innerHTML = `${escapeHtml(parts[0].trim())} &amp; <span class="editorial-accent">${escapeHtml(parts[1].trim())}</span>`;
    } else {
      roleElem.textContent = hero.role_title;
    }
  }

  if (positioningElem && hero.positioning_statement) {
    positioningElem.textContent = hero.positioning_statement;
  }

  if (primaryCta && hero.primary_cta_url) primaryCta.setAttribute('href', hero.primary_cta_url);
  if (primaryCtaText && hero.primary_cta_text) primaryCtaText.textContent = hero.primary_cta_text;
  if (secondaryCta && hero.secondary_cta_url) secondaryCta.setAttribute('href', hero.secondary_cta_url);
  if (secondaryCtaText && hero.secondary_cta_text) secondaryCtaText.textContent = hero.secondary_cta_text;

  if (headerAvailText && hero.availability_status) {
    headerAvailText.textContent = hero.availability_status;
  }

  // Profile Image Handling:
  // Strictly display uploaded image if available; otherwise show architectural monogram frame
  if (profileFrameInner) {
    if (hero.profile_image_url && hero.profile_image_url.trim() !== '') {
      profileFrameInner.innerHTML = `
        <img 
          src="${escapeHtml(hero.profile_image_url)}" 
          alt="${escapeHtml(hero.profile_image_alt || hero.name || 'Mofidul')}" 
          class="profile-image-elem"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
      `;
    } else {
      profileFrameInner.innerHTML = `
        <div class="profile-placeholder-box">
          <span class="profile-corner-marking top-left"></span>
          <span class="profile-corner-marking top-right"></span>
          <span class="profile-corner-marking bottom-left"></span>
          <span class="profile-corner-marking bottom-right"></span>
          <div class="profile-monogram">M</div>
          <div class="profile-sublabel">${escapeHtml(hero.name || 'Mofidul')}</div>
          <div class="profile-status-note">Profile portrait configurable via CMS</div>
        </div>
      `;
    }
  }
}

/**
 * Render Navigation Links
 */
function renderNavigation(navigation) {
  if (!navigation || !Array.isArray(navigation) || navigation.length === 0) return;

  const mainNav = document.getElementById('main-nav-links');
  const mobileNavWrap = document.getElementById('mobile-nav-links-wrap');

  if (mainNav) {
    mainNav.innerHTML = navigation.map(item => {
      const isContact = item.url === '#contact';
      const cssClass = isContact ? 'btn btn-secondary btn-sm' : 'nav-link';
      const liId = item.url.startsWith('#') ? `nav-${item.url.slice(1)}-item` : '';
      return `<li ${liId ? `id="${escapeHtml(liId)}"` : ''}><a href="${escapeHtml(item.url)}" class="${cssClass}">${escapeHtml(item.label)}</a></li>`;
    }).join('');
  }

  if (mobileNavWrap) {
    mobileNavWrap.innerHTML = navigation.map(item => {
      return `<a href="${escapeHtml(item.url)}" class="nav-link mobile-nav-link">${escapeHtml(item.label)}</a>`;
    }).join('');
  }
}

/**
 * Render Section Overrides & Global Toggles
 */
function renderSectionSettings(sections) {
  if (!sections || !Array.isArray(sections)) return;

  sections.forEach(sec => {
    const sectionElem = document.getElementById(sec.section_key);
    const navItem = document.getElementById(`nav-${sec.section_key}-item`);

    if (sectionElem) {
      if (sec.is_enabled === 0) {
        sectionElem.style.display = 'none';
        if (navItem) navItem.style.display = 'none';
        return;
      }

      if (sec.section_title) {
        const titleElem = sectionElem.querySelector('.section-title');
        if (titleElem) {
          const parts = sec.section_title.split('&');
          if (parts.length > 1) {
            titleElem.innerHTML = `${escapeHtml(parts[0].trim())} &amp; <span class="editorial-accent">${escapeHtml(parts[1].trim())}</span>`;
          } else {
            titleElem.textContent = sec.section_title;
          }
        }
      }

      if (sec.section_eyebrow) {
        const eyebrowElem = sectionElem.querySelector('.section-eyebrow');
        if (eyebrowElem) eyebrowElem.textContent = sec.section_eyebrow;
      }

      if (sec.section_subtitle) {
        const subElem = sectionElem.querySelector('.section-subtitle');
        if (subElem) {
          subElem.textContent = sec.section_subtitle;
          subElem.style.display = 'block';
        }
      }
    }
  });
}

/**
 * Render About Section
 */
function renderAbout(about, resumeUrl) {
  if (!about) return;

  const eyebrowElem = document.getElementById('about-eyebrow');
  const headlineElem = document.getElementById('about-headline');
  const p1Elem = document.getElementById('about-p1');
  const p2Elem = document.getElementById('about-p2');
  const quoteElem = document.getElementById('about-quote');
  const expValElem = document.getElementById('about-exp-val');
  const availValElem = document.getElementById('about-avail-val');
  const resumeLink = document.getElementById('about-resume-link');

  if (eyebrowElem && about.eyebrow) eyebrowElem.textContent = about.eyebrow;

  if (headlineElem && about.headline) {
    if (about.headline_accent && about.headline.includes(about.headline_accent)) {
      const parts = about.headline.split(about.headline_accent);
      headlineElem.innerHTML = `${escapeHtml(parts[0])}<span class="editorial-accent">${escapeHtml(about.headline_accent)}</span>${escapeHtml(parts.slice(1).join(about.headline_accent))}`;
    } else {
      headlineElem.textContent = about.headline;
    }
  }

  if (p1Elem && about.bio_paragraph_1) p1Elem.textContent = about.bio_paragraph_1;
  if (p2Elem && about.bio_paragraph_2) p2Elem.textContent = about.bio_paragraph_2;

  if (quoteElem && about.quote) {
    if (about.quote_accent && about.quote.includes(about.quote_accent)) {
      const parts = about.quote.split(about.quote_accent);
      quoteElem.innerHTML = `"${escapeHtml(parts[0])}<span class="editorial-accent">${escapeHtml(about.quote_accent)}</span>${escapeHtml(parts.slice(1).join(about.quote_accent))}"`;
    } else {
      quoteElem.textContent = `"${about.quote}"`;
    }
  }

  if (expValElem && about.experience_years) expValElem.textContent = `${about.experience_years} Craft`;
  if (availValElem && about.availability_badge) availValElem.textContent = about.availability_badge;

  if (resumeLink) {
    const finalResume = resumeUrl || about.resume_url || '/uploads/resume.pdf';
    resumeLink.setAttribute('href', finalResume);
  }
}

/**
 * Render Skills CMS
 */
let allSkills = [];

function renderSkills(skills, isVisible = 1) {
  const container = document.getElementById('skills');
  const grid = document.getElementById('skills-grid');
  const filterBar = document.getElementById('skills-filter-bar');
  const navItem = document.getElementById('nav-skills-item');

  if (!isVisible || !skills || skills.length === 0) {
    if (container) container.style.display = 'none';
    if (navItem) navItem.style.display = 'none';
    return;
  }

  if (container) container.style.display = 'block';
  if (navItem) navItem.style.display = 'block';
  if (!grid) return;

  allSkills = skills;

  // Categories
  const categories = ['all', ...new Set(skills.map(s => s.category).filter(Boolean))];
  if (filterBar) {
    filterBar.innerHTML = categories.map(cat => {
      const label = cat === 'all' ? 'All Disciplines' : cat;
      return `<button class="filter-btn ${cat === 'all' ? 'active' : ''}" data-skill-cat="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
    }).join('');

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-skill-cat');
        filterSkillsGrid(cat);
      });
    });
  }

  displaySkillsList(allSkills);
}

function filterSkillsGrid(category) {
  const grid = document.getElementById('skills-grid');
  const targetList = (category === 'all')
    ? allSkills
    : allSkills.filter(s => s.category === category);

  if (!grid) return;

  grid.classList.add('filtering');
  setTimeout(() => {
    displaySkillsList(targetList);
    requestAnimationFrame(() => {
      grid.classList.remove('filtering');
    });
  }, 120);
}

function displaySkillsList(list) {
  const grid = document.getElementById('skills-grid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-portfolio-notice" style="grid-column: 1 / -1;">
        <p style="color: var(--text-muted); font-size: 15px;">No skills recorded in this category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map((skill, idx) => {
    const prof = skill.proficiency || '90%';
    const profNum = parseInt(prof, 10) || 90;

    let relatedHtml = '';
    if (skill.related_services || skill.related_projects) {
      const tags = [...(skill.related_services ? skill.related_services.split(',') : []), ...(skill.related_projects ? skill.related_projects.split(',') : [])].map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        relatedHtml = `
          <div class="skill-tags-row">
            ${tags.map(t => `<span class="skill-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        `;
      }
    }

    return `
      <div class="skill-card reveal-init delay-${(idx % 4) + 1}">
        <div class="skill-card-header">
          <div class="skill-title-group">
            <h3 class="skill-name">${escapeHtml(skill.name)}</h3>
            <span class="skill-category-badge">${escapeHtml(skill.category)}</span>
          </div>
          <span class="skill-proficiency-val">${escapeHtml(prof)}</span>
        </div>
        ${skill.description ? `<p class="skill-desc">${escapeHtml(skill.description)}</p>` : ''}
        <div class="skill-meter-track" role="progressbar" aria-valuenow="${profNum}" aria-valuemin="0" aria-valuemax="100">
          <div class="skill-meter-fill" style="width: ${profNum}%;"></div>
        </div>
        ${relatedHtml}
      </div>
    `;
  }).join('');

  initScrollAnimations();
  setupButterSmoothInteractions();
}

/**
 * Render Experience Timeline
 */
function renderExperience(experience, isVisible = 1) {
  const container = document.getElementById('experience');
  const timeline = document.getElementById('experience-timeline');
  const navItem = document.getElementById('nav-experience-item');

  if (!isVisible || !experience || experience.length === 0) {
    if (container) container.style.display = 'none';
    if (navItem) navItem.style.display = 'none';
    return;
  }

  if (container) container.style.display = 'block';
  if (navItem) navItem.style.display = 'block';
  if (!timeline) return;

  timeline.innerHTML = experience.map((item, idx) => {
    const dateRange = item.is_current
      ? `${escapeHtml(item.start_date)} — Present`
      : `${escapeHtml(item.start_date)}${item.end_date ? ` — ${escapeHtml(item.end_date)}` : ''}`;

    let techHtml = '';
    if (item.technologies && item.technologies.trim() !== '') {
      const techArr = item.technologies.split(',').map(t => t.trim()).filter(Boolean);
      techHtml = `
        <div class="timeline-tech-row">
          ${techArr.map(tech => `<span class="timeline-tech-pill">${escapeHtml(tech)}</span>`).join('')}
        </div>
      `;
    }

    let respHtml = '';
    if (item.responsibilities && item.responsibilities.trim() !== '') {
      const bullets = item.responsibilities.split('\n').map(b => b.trim()).filter(Boolean);
      if (bullets.length > 0) {
        respHtml = `
          <ul class="timeline-resp-list">
            ${bullets.map(b => `<li>${escapeHtml(b.replace(/^[-•*]\s*/, ''))}</li>`).join('')}
          </ul>
        `;
      }
    }

    return `
      <div class="timeline-item reveal-init delay-${(idx % 3) + 1}">
        <div class="timeline-node-marker">
          <div class="timeline-marker-core"></div>
        </div>
        <div class="timeline-content-card">
          <div class="timeline-card-header">
            <div>
              <h3 class="timeline-role">${escapeHtml(item.role)}</h3>
              <div class="timeline-company-row">
                <span class="timeline-company">${escapeHtml(item.company)}</span>
                ${item.location ? `<span class="timeline-location">• ${escapeHtml(item.location)}</span>` : ''}
              </div>
            </div>
            <span class="timeline-period-badge">${escapeHtml(dateRange)}</span>
          </div>
          ${item.description ? `<p class="timeline-desc">${escapeHtml(item.description)}</p>` : ''}
          ${respHtml}
          ${techHtml}
        </div>
      </div>
    `;
  }).join('');

  initScrollAnimations();
  setupButterSmoothInteractions();
}

/**
 * Render Services & Disciplines
 */
function renderServices(services, isVisible = 1) {
  const container = document.getElementById('services');
  const list = document.getElementById('services-list');
  const navItem = document.getElementById('nav-services-item');

  if (!isVisible || !services || services.length === 0) {
    if (container) container.style.display = 'none';
    if (navItem) navItem.style.display = 'none';
    return;
  }

  if (container) container.style.display = 'block';
  if (navItem) navItem.style.display = 'block';
  if (!list) return;

  list.innerHTML = services.map((service, index) => {
    const num = String(index + 1).padStart(2, '0');
    return `
      <div class="service-row reveal-init delay-${(index % 4) + 1}">
        <span class="service-index">${num}</span>
        <h3 class="service-title">${escapeHtml(service.title)}</h3>
        <p class="service-desc">${escapeHtml(service.short_desc)}</p>
        <span class="service-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </span>
      </div>
    `;
  }).join('');
}

/**
 * Render Projects / Work with Category Filters & Modal Drawer
 */
function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  const filterBar = document.getElementById('project-filters');
  if (!grid || !projects) return;

  allProjects = projects;

  // Extract unique categories for filter tabs
  const categories = ['all', ...new Set(projects.map(p => p.category).filter(Boolean))];
  
  if (filterBar) {
    filterBar.innerHTML = categories.map(cat => {
      const label = cat === 'all' ? 'All Works' : cat;
      return `<button class="filter-btn ${cat === 'all' ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
    }).join('');

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const selectedCat = btn.getAttribute('data-category');
        filterProjectsGrid(selectedCat);
      });
    });
  }

  displayProjectsList(allProjects);
}

function filterProjectsGrid(category) {
  const grid = document.getElementById('projects-grid');
  const targetList = (category === 'all')
    ? allProjects
    : allProjects.filter(p => p.category === category);

  if (!grid) {
    displayProjectsList(targetList);
    return;
  }

  grid.classList.add('filtering');
  setTimeout(() => {
    displayProjectsList(targetList);
    requestAnimationFrame(() => {
      grid.classList.remove('filtering');
    });
  }, 120);
}

function displayProjectsList(list) {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-portfolio-notice">
        <p style="color: var(--text-muted); font-size: 15px;">No projects found in this discipline.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map((project, idx) => {
    // If no cover image uploaded, render clean typographic cover
    const mediaHtml = project.cover_image && project.cover_image.trim() !== ''
      ? `<img src="${escapeHtml(project.cover_image)}" alt="${escapeHtml(project.title)}" class="project-img" loading="lazy" decoding="async" />`
      : `
        <div class="project-typographic-cover">
          <div class="project-cover-top">
            <span class="project-category-tag">${escapeHtml(project.category)}</span>
            <span class="project-year-tag">${escapeHtml(project.year || '')}</span>
          </div>
          <div class="project-typographic-watermark">${escapeHtml(project.title.substring(0, 16))}</div>
        </div>
      `;

    return `
      <article class="project-card reveal-init delay-${(idx % 2) + 2}" data-project-id="${project.id}">
        <div class="project-media-wrapper">
          ${mediaHtml}
        </div>
        <div class="project-content-body">
          <div class="project-meta-row">
            <span class="project-category-tag">${escapeHtml(project.category)}</span>
            <span class="project-client-name">${escapeHtml(project.client || '')}</span>
          </div>
          <h3 class="project-title">${escapeHtml(project.title)}</h3>
          <p class="project-desc-text">${escapeHtml(project.short_desc)}</p>
          <div class="project-link-action">
            <span>Explore Case Study</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attach click listeners to open project modal
  grid.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      const pid = Number(card.getAttribute('data-project-id'));
      const project = allProjects.find(p => p.id === pid);
      if (project) openProjectModal(project);
    });
  });

  // Re-trigger scroll animations & interactions for new elements
  initScrollAnimations();
  setupButterSmoothInteractions();
}

/**
 * Render Numbers / Statistics (Proof)
 */
function renderStatistics(statistics, isVisible = 1) {
  const container = document.getElementById('stats');
  const grid = document.getElementById('stats-grid');
  const navItem = document.getElementById('nav-stats-item');

  if (!isVisible || !statistics || statistics.length === 0) {
    if (container) container.style.display = 'none';
    if (navItem) navItem.style.display = 'none';
    return;
  }

  if (container) container.style.display = 'block';
  if (navItem) navItem.style.display = 'block';
  if (!grid) return;

  grid.innerHTML = statistics.map((stat, idx) => `
    <div class="stat-item reveal-init delay-${(idx % 4) + 1}">
      <div class="stat-number-wrap">
        <span class="stat-value" data-target="${escapeHtml(stat.metric_value)}">${escapeHtml(stat.metric_value)}</span>
        <span class="stat-suffix">${escapeHtml(stat.metric_suffix || '')}</span>
      </div>
      <div class="stat-label">${escapeHtml(stat.label)}</div>
      <div class="stat-desc">${escapeHtml(stat.description || '')}</div>
    </div>
  `).join('');
}

/**
 * Render Testimonials Section
 * Note: If empty, remains cleanly hidden per user instructions (no fake testimonials)
 */
function renderTestimonials(testimonials, isVisible = 1) {
  const container = document.getElementById('testimonials');
  const grid = document.getElementById('testimonials-grid');
  const navItem = document.getElementById('nav-testimonials-item');

  if (!isVisible || !testimonials || testimonials.length === 0) {
    if (container) container.style.display = 'none';
    if (navItem) navItem.style.display = 'none';
    return;
  }

  if (container) container.style.display = 'block';
  if (navItem) navItem.style.display = 'block';
  if (!grid) return;

  grid.innerHTML = testimonials.map((t, tIdx) => {
    const avatarHtml = t.avatar_url && t.avatar_url.trim() !== ''
      ? `<img src="${escapeHtml(t.avatar_url)}" alt="${escapeHtml(t.client_name)}" class="testimonial-avatar" loading="lazy" decoding="async" />`
      : `<div class="testimonial-avatar-placeholder">${escapeHtml(t.client_name.charAt(0))}</div>`;

    return `
      <div class="testimonial-card reveal-init delay-${(tIdx % 3) + 2}">
        <blockquote class="testimonial-quote">"${escapeHtml(t.testimonial_text)}"</blockquote>
        <div class="testimonial-author-box">
          ${avatarHtml}
          <div>
            <div class="testimonial-author-name">${escapeHtml(t.client_name)}</div>
            <div class="testimonial-author-role">${escapeHtml(t.client_role || '')}${t.company ? ` • ${escapeHtml(t.company)}` : ''}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Contact Info & Social Links
 */
function renderContact(contact, socialLinks) {
  if (contact) {
    const headingElem = document.getElementById('contact-heading');
    const subheadingElem = document.getElementById('contact-subheading');
    const emailElem = document.getElementById('contact-email');
    const locationElem = document.getElementById('contact-location');

    if (headingElem && contact.heading) {
      headingElem.textContent = contact.heading;
    }
    if (subheadingElem && contact.subheading) {
      subheadingElem.textContent = contact.subheading;
    }
    if (emailElem && contact.email) {
      emailElem.textContent = contact.email;
      emailElem.setAttribute('href', `mailto:${contact.email}`);
    }
    if (locationElem && contact.location) {
      locationElem.textContent = contact.location;
    }
  }

  if (socialLinks && socialLinks.length > 0) {
    const socialContainer = document.getElementById('contact-social-links');
    if (socialContainer) {
      socialContainer.innerHTML = socialLinks.map(link => `
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="social-pill">
          ${escapeHtml(link.label || link.platform)}
        </a>
      `).join('');
    }
  }
}

/**
 * Interactive Contact Form Handling
 */
function setupContactForm() {
  const form = document.getElementById('contact-inquiry-form');
  const feedback = document.getElementById('form-feedback');
  const submitBtn = document.getElementById('inquiry-submit-btn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      showFeedback('Please complete all required fields.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Sending...';
    }

    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback(data.message || 'Thank you. Your message has been sent directly to Mofidul.', 'success');
        form.reset();
      } else {
        showFeedback(data.error || 'Failed to send inquiry. Please try again or email directly.', 'error');
      }
    } catch (err) {
      showFeedback('Network error. Please try again shortly.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Send Inquiry';
      }
    }
  });

  function showFeedback(msg, type) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.className = `form-feedback ${type}`;
    feedback.style.display = 'block';
  }
}

/**
 * Project Case Study Modal Drawer
 */
function setupModalEvents() {
  const modal = document.getElementById('project-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  const closeModal = () => {
    if (!modal || !modal.classList.contains('active') || modal.classList.contains('closing')) return;
    modal.classList.add('closing');
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.classList.remove('active');
      modal.classList.remove('closing');
    }, 240);
  };

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }
}

function openProjectModal(project) {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  const coverWrapper = document.getElementById('modal-cover-wrapper');
  const catElem = document.getElementById('modal-project-category');
  const featuredBadge = document.getElementById('modal-featured-badge');
  const titleElem = document.getElementById('modal-project-title');
  const clientElem = document.getElementById('modal-project-client');
  const yearElem = document.getElementById('modal-project-year');
  const servicesCol = document.getElementById('modal-services-col');
  const servicesElem = document.getElementById('modal-project-services');
  const linkElem = document.getElementById('modal-project-link');
  const linkContainer = document.getElementById('modal-link-container');
  const pillsRow = document.getElementById('modal-pills-row');
  const descElem = document.getElementById('modal-project-desc');

  // Case study cards
  const caseGrid = document.getElementById('modal-case-study-grid');
  const cardChallenge = document.getElementById('modal-card-challenge');
  const textChallenge = document.getElementById('modal-text-challenge');
  const cardSolution = document.getElementById('modal-card-solution');
  const textSolution = document.getElementById('modal-text-solution');
  const cardResults = document.getElementById('modal-card-results');
  const textResults = document.getElementById('modal-text-results');

  // Video embed & Additional info
  const videoWrapper = document.getElementById('modal-video-wrapper');
  const additionalWrapper = document.getElementById('modal-additional-wrapper');
  const textAdditional = document.getElementById('modal-text-additional');

  // Gallery
  const gallerySection = document.getElementById('modal-gallery-section');
  const galleryContainer = document.getElementById('modal-gallery-container');
  const galleryCount = document.getElementById('modal-gallery-count');

  // 1. Cover Image
  if (coverWrapper) {
    if (project.cover_image && project.cover_image.trim() !== '') {
      coverWrapper.innerHTML = `<img src="${escapeHtml(project.cover_image)}" alt="${escapeHtml(project.title)}" class="modal-project-cover" decoding="async" />`;
    } else {
      coverWrapper.innerHTML = '';
    }
  }

  // 2. Category & Featured Badge
  if (catElem) catElem.textContent = project.category || 'Selected Work';
  if (featuredBadge) {
    featuredBadge.style.display = project.is_featured ? 'inline-flex' : 'none';
  }

  // 3. Title, Client, Year
  if (titleElem) titleElem.textContent = project.title || '';
  if (clientElem) clientElem.textContent = project.client || 'Confidential Client';
  if (yearElem) yearElem.textContent = project.year || '2025';

  // 4. Services Used
  if (servicesCol && servicesElem) {
    if (project.services_used && project.services_used.trim() !== '') {
      servicesElem.textContent = project.services_used;
      servicesCol.style.display = 'block';
    } else {
      servicesCol.style.display = 'none';
    }
  }

  // 5. External Link
  if (linkElem && linkContainer) {
    if (project.project_url && project.project_url.trim() !== '') {
      linkElem.href = project.project_url;
      linkContainer.style.display = 'block';
    } else {
      linkContainer.style.display = 'none';
    }
  }

  // 6. Tools & Technologies & Tags Pills
  if (pillsRow) {
    const pills = [];
    if (project.technologies) {
      project.technologies.split(',').map(s => s.trim()).filter(Boolean).forEach(t => pills.push(t));
    }
    if (project.tags) {
      project.tags.split(',').map(s => s.trim()).filter(Boolean).forEach(t => {
        if (!pills.includes(t)) pills.push(t);
      });
    }

    if (pills.length > 0) {
      pillsRow.innerHTML = pills.map(p => `<span class="pill-tag">${escapeHtml(p)}</span>`).join('');
      pillsRow.style.display = 'flex';
    } else {
      pillsRow.innerHTML = '';
      pillsRow.style.display = 'none';
    }
  }

  // 7. Full Description
  if (descElem) {
    descElem.innerHTML = escapeHtml(project.full_desc || project.short_desc).replace(/\n/g, '<br/>');
  }

  // 8. Challenge, Solution, Outcome Grid
  let hasCaseCards = false;
  if (cardChallenge && textChallenge) {
    if (project.challenge && project.challenge.trim() !== '') {
      textChallenge.textContent = project.challenge;
      cardChallenge.style.display = 'block';
      hasCaseCards = true;
    } else {
      cardChallenge.style.display = 'none';
    }
  }

  if (cardSolution && textSolution) {
    if (project.solution && project.solution.trim() !== '') {
      textSolution.textContent = project.solution;
      cardSolution.style.display = 'block';
      hasCaseCards = true;
    } else {
      cardSolution.style.display = 'none';
    }
  }

  if (cardResults && textResults) {
    if (project.results && project.results.trim() !== '') {
      textResults.textContent = project.results;
      cardResults.style.display = 'block';
      hasCaseCards = true;
    } else {
      cardResults.style.display = 'none';
    }
  }

  if (caseGrid) {
    caseGrid.style.display = hasCaseCards ? 'grid' : 'none';
  }

  // 9. Video Embed
  if (videoWrapper) {
    if (project.video_url && project.video_url.trim() !== '') {
      const url = project.video_url.trim();
      let embedHtml = '';

      // YouTube
      const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      // Vimeo
      const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);

      if (ytMatch && ytMatch[1]) {
        embedHtml = `
          <div class="modal-video-container">
            <iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
      } else if (vimeoMatch && vimeoMatch[1]) {
        embedHtml = `
          <div class="modal-video-container">
            <iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
      } else if (/\.(mp4|webm|ogg)$/i.test(url)) {
        embedHtml = `
          <div class="modal-video-container">
            <video controls src="${escapeHtml(url)}" style="width: 100%; height: 100%; object-fit: cover;"></video>
          </div>
        `;
      } else {
        embedHtml = `
          <div style="padding: 14px 18px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md);">
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-highlight); font-weight: 600; font-size: 13.5px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">Watch Project Video ↗</a>
          </div>
        `;
      }

      videoWrapper.innerHTML = embedHtml;
      videoWrapper.style.display = 'block';
    } else {
      videoWrapper.innerHTML = '';
      videoWrapper.style.display = 'none';
    }
  }

  // 10. Additional Info
  if (additionalWrapper && textAdditional) {
    if (project.additional_info && project.additional_info.trim() !== '') {
      textAdditional.textContent = project.additional_info;
      additionalWrapper.style.display = 'block';
    } else {
      additionalWrapper.style.display = 'none';
    }
  }

  // 11. Multi-Image Gallery
  if (gallerySection && galleryContainer) {
    if (project.gallery && project.gallery.length > 0) {
      if (galleryCount) galleryCount.textContent = `${project.gallery.length} Images`;

      galleryContainer.innerHTML = project.gallery.map((img, idx) => {
        const alt = img.alt_text || img.caption || `${project.title} gallery image ${idx + 1}`;
        const captionHtml = img.caption ? `<div class="gallery-item-caption">${escapeHtml(img.caption)}</div>` : '';
        return `
          <div class="gallery-item-card" onclick="openLightbox('${escapeHtml(img.image_url)}', '${escapeHtml(img.caption || alt)}')">
            <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(alt)}" class="gallery-item-img" loading="lazy" decoding="async" />
            ${captionHtml}
          </div>
        `;
      }).join('');

      gallerySection.style.display = 'block';
    } else {
      galleryContainer.innerHTML = '';
      gallerySection.style.display = 'none';
    }
  }

  modal.classList.remove('closing');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * 60fps Replaying Cinematic Scroll Reveal Animations for ALL Major Sections
 * - Every major section animation replays every time the section enters the viewport
 * - Leaves viewport -> resets off-screen
 * - Returns to viewport -> re-triggers staggered blur-to-sharp entrance sequence
 * - Replays on: Hero, About, Services, Portfolio, Statistics, Testimonials, Contact
 * - Zero one-time logic (no permanent completion flags)
 * - Micro-scroll movements while a section is visible do NOT restart it
 */
let scrollRevealObserver = null;
let sectionReplayObserver = null;

function initScrollAnimations() {
  // 1. Tag section headers and children with staggered delay classes
  document.querySelectorAll('.section-header').forEach(header => {
    // Avoid double-blur: let children stagger individually
    header.classList.remove('reveal-init');

    const eyebrow = header.querySelector('.section-eyebrow, .label-caps');
    const title = header.querySelector('.section-title');
    const subtitle = header.querySelector('.section-subtitle');

    if (eyebrow) {
      eyebrow.classList.add('reveal-init', 'delay-1');
    }
    if (title) {
      title.classList.add('reveal-init', 'delay-2');
    }
    if (subtitle) {
      subtitle.classList.add('reveal-init', 'delay-3');
    }
  });

  const filterBar = document.getElementById('project-filters');
  if (filterBar) {
    filterBar.classList.add('reveal-init', 'delay-3');
  }

  // Clean up any existing observers before binding
  if (scrollRevealObserver) {
    scrollRevealObserver.disconnect();
  }
  if (sectionReplayObserver) {
    sectionReplayObserver.disconnect();
  }

  // 2. Element-level Observer: Triggers entrance when in viewport, resets when off-screen
  const reveals = document.querySelectorAll('.reveal-init');
  const isMobile = window.innerWidth <= 768 || (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);

  if (reveals.length) {
    scrollRevealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.classList.add('revealed');
        } else if (!isMobile) {
          // Off-screen reset: Only reset on desktop when element has scrolled well past the viewport
          const rect = entry.boundingClientRect;
          const winHeight = window.innerHeight || document.documentElement.clientHeight;
          if (rect.bottom < -40 || rect.top > winHeight + 40) {
            el.classList.remove('revealed');
          }
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '60px 0px 60px 0px'
    });

    reveals.forEach(el => scrollRevealObserver.observe(el));
  }

  // 3. Section-level Replay Observer: Observes every major section
  // (hero, work, services, stats, about, testimonials, contact)
  const sections = document.querySelectorAll('section[id]');
  if (sections.length) {
    sectionReplayObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const section = entry.target;
        const sectionReveals = section.querySelectorAll('.reveal-init');

        if (entry.isIntersecting) {
          // If hero section re-enters, trigger atmosphere bloom & ribbons
          if (section.id === 'hero' && typeof window.triggerHeroEntrance === 'function') {
            window.triggerHeroEntrance();
          }

          // Directly reveal elements without triggering forced layout recalculation
          sectionReveals.forEach(el => {
            el.classList.add('revealed');
          });
        } else if (!isMobile) {
          // On desktop, replay resets when section fully leaves viewport
          sectionReveals.forEach(el => {
            el.classList.remove('revealed');
          });
        }
      });
    }, {
      threshold: [0, 0.1, 0.25],
      rootMargin: '40px 0px 40px 0px'
    });

    sections.forEach(sec => sectionReplayObserver.observe(sec));
  }
}

/**
 * Header Scroll Shrink & Blur Effect
 */
function setupHeaderScroll() {
  const header = document.getElementById('site-header');
  const logo = document.getElementById('header-brand-logo');
  if (!header) return;

  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/**
 * Navigation Scrollspy
 * Tracks sections in viewport and highlights active navigation link with accent line
 */
function setupNavScrollspy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '-15% 0px -50% 0px'
  });

  sections.forEach(section => observer.observe(section));
}

/**
 * Mobile Navigation Drawer Toggle
 */
function setupMobileNav() {
  const btn = document.getElementById('mobile-menu-toggle');
  const drawer = document.getElementById('mobile-nav-drawer');
  const hamburgerIcon = document.getElementById('hamburger-icon');
  const closeIcon = document.getElementById('close-icon');
  if (!btn || !drawer) return;

  const toggleDrawer = (open) => {
    const shouldOpen = open !== undefined ? open : !drawer.classList.contains('active');
    if (shouldOpen) {
      drawer.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (hamburgerIcon) hamburgerIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
    } else {
      drawer.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (hamburgerIcon) hamburgerIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
    }
  };

  btn.addEventListener('click', () => toggleDrawer());

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleDrawer(false);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('active')) {
      toggleDrawer(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && drawer.classList.contains('active')) {
      toggleDrawer(false);
    }
  }, { passive: true });
}

/**
 * Back to Top Smooth Scroll
 */
function setupBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Global AudioContext singleton to prevent hardware context leaks and ensure reliable repeatability
window.__portfolioAudioCtx = window.__portfolioAudioCtx || null;
window.__activeAudioEngine = window.__activeAudioEngine || null;

function getSharedAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!window.__portfolioAudioCtx || window.__portfolioAudioCtx.state === 'closed') {
      window.__portfolioAudioCtx = new AudioCtx();
    }
    return window.__portfolioAudioCtx;
  } catch (_) {
    return null;
  }
}

// Global unlock listener attached once to keep context alive across page lifecycle
(function setupGlobalAudioUnlock() {
  if (typeof window === 'undefined') return;
  const unlockEvents = ['pointerdown', 'mousedown', 'touchstart', 'touchend', 'click', 'keydown'];
  const unlock = () => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  unlockEvents.forEach(evt => {
    window.addEventListener(evt, unlock, { passive: true });
  });
})();

/**
 * New Premium Cinematic Digital Loading Sound Generator (Web Audio API)
 * High-precision, repeatable Web Audio synthesizer synchronized with the loading sequence.
 * - Start: Low atmospheric digital hum + warm resonant harmonics
 * - Progress: Dynamic pitch glide + resonant harmonic bloom (360Hz -> 2100Hz)
 * - Continue: Ambient power-cell idling breath loop while awaiting application readiness
 * - Resolve: 100% readiness smoothly resolves into a pristine cinematic chord chime (C5 + G5 + C6 + E6)
 */
function createLoadingAudioEngine() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return null;
    }

    // Stop any existing active audio engine cleanly before starting a new run to prevent duplicate instances
    if (window.__activeAudioEngine && typeof window.__activeAudioEngine.stopImmediate === 'function') {
      window.__activeAudioEngine.stopImmediate();
    }

    const ctx = getSharedAudioContext() || new AudioCtx();

    // Silently attempt resume for browsers requiring gesture
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Master volume (smooth digital system power-up: ~0.24 max, subtle & clean)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.24, ctx.currentTime);

    // Resonant Futuristic Lowpass Filter (sweeps 360Hz -> 2100Hz as loading progresses)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, ctx.currentTime);
    filter.Q.setValueAtTime(2.4, ctx.currentTime);

    // Tone 1: Grounding sub-harmonic digital fundamental (C3 = 130.81 Hz -> C4 = 261.63 Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(130.81, ctx.currentTime);

    // Tone 2: Warm fifth harmonic overtone (G3 = 196.00 Hz -> G4 = 392.00 Hz)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(196.00, ctx.currentTime);

    // Tone 3: High digital sheen core (C4 = 261.63 Hz -> C5 = 523.25 Hz)
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(261.63, ctx.currentTime);

    // Tone 4: Shimmer bloom harmonic (E4 = 329.63 Hz -> E5 = 659.25 Hz)
    const osc4 = ctx.createOscillator();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(329.63, ctx.currentTime);

    const osc1Gain = ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.44, ctx.currentTime);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.36, ctx.currentTime);

    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.22, ctx.currentTime);

    const osc4Gain = ctx.createGain();
    osc4Gain.gain.setValueAtTime(0.0001, ctx.currentTime); // Blossoms in during build phase

    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    osc3.connect(osc3Gain);
    osc4.connect(osc4Gain);

    osc1Gain.connect(filter);
    osc2Gain.connect(filter);
    osc3Gain.connect(filter);
    osc4Gain.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc3.start();
    osc4.start();

    let isFinished = false;

    const engineInstance = {
      unlock: () => {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      },
      stopImmediate() {
        if (isFinished) return;
        isFinished = true;
        try {
          const now = ctx.currentTime;
          masterGain.gain.setValueAtTime(masterGain.gain.value, now);
          masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.04);
          setTimeout(() => {
            try {
              osc1.stop();
              osc2.stop();
              osc3.stop();
              osc4.stop();
              masterGain.disconnect();
            } catch (_) {}
          }, 45);
        } catch (_) {}
      },
      update(progress) {
        if (isFinished) return;
        try {
          const now = ctx.currentTime;
          const p = Math.max(0, Math.min(1, progress));

          // Resonant filter frequency ascends smoothly with loading progress (360Hz -> 2100Hz)
          const targetFreq = 360 + (p * 1740);
          filter.frequency.setTargetAtTime(targetFreq, now, 0.04);

          // Digital system power-up pitch glide: low warm tones glide upward toward full readiness
          osc1.frequency.setTargetAtTime(130.81 + (p * 130.82), now, 0.06);
          osc2.frequency.setTargetAtTime(196.00 + (p * 196.00), now, 0.06);
          osc3.frequency.setTargetAtTime(261.63 + (p * 261.62), now, 0.06);
          osc4.frequency.setTargetAtTime(329.63 + (p * 329.62), now, 0.06);

          // Harmonic bloom: color tone E4 blossoms smoothly as progress passes 18%
          const bloom = p > 0.18 ? Math.min((p - 0.18) * 0.38, 0.24) : 0.0001;
          osc4Gain.gain.setTargetAtTime(Math.max(bloom, 0.0001), now, 0.07);
        } catch (_) {}
      },
      sustain() {
        if (isFinished) return;
        try {
          const now = ctx.currentTime;
          const breath = 1680 + Math.sin(now * 3.2) * 45;
          filter.frequency.setTargetAtTime(breath, now, 0.10);
        } catch (_) {}
      },
      finish() {
        if (isFinished) return;
        isFinished = true;
        try {
          const now = ctx.currentTime;
          // Smooth fade of system power-up drone
          masterGain.gain.setValueAtTime(masterGain.gain.value, now);
          masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

          // Pristine Cinematic Digital Resolution Chime (C5 + G5 + C6 + E6 chord)
          const chimeGain = ctx.createGain();
          chimeGain.gain.setValueAtTime(0.0001, now);
          chimeGain.gain.exponentialRampToValueAtTime(0.20, now + 0.018);
          chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);

          const chimeFilter = ctx.createBiquadFilter();
          chimeFilter.type = 'bandpass';
          chimeFilter.frequency.setValueAtTime(1250, now);
          chimeFilter.Q.setValueAtTime(2.4, now);

          // C5 (523.25 Hz)
          const cOsc1 = ctx.createOscillator();
          cOsc1.type = 'sine';
          cOsc1.frequency.setValueAtTime(523.25, now);

          // G5 (783.99 Hz)
          const cOsc2 = ctx.createOscillator();
          cOsc2.type = 'sine';
          cOsc2.frequency.setValueAtTime(783.99, now);

          // C6 (1046.50 Hz)
          const cOsc3 = ctx.createOscillator();
          cOsc3.type = 'sine';
          cOsc3.frequency.setValueAtTime(1046.50, now);

          // E6 (1318.51 Hz)
          const cOsc4 = ctx.createOscillator();
          cOsc4.type = 'sine';
          cOsc4.frequency.setValueAtTime(1318.51, now);

          cOsc1.connect(chimeFilter);
          cOsc2.connect(chimeFilter);
          cOsc3.connect(chimeFilter);
          cOsc4.connect(chimeFilter);

          chimeFilter.connect(chimeGain);
          chimeGain.connect(ctx.destination);

          cOsc1.start(now);
          cOsc2.start(now);
          cOsc3.start(now);
          cOsc4.start(now);

          cOsc1.stop(now + 0.53);
          cOsc2.stop(now + 0.53);
          cOsc3.stop(now + 0.53);
          cOsc4.stop(now + 0.53);

          setTimeout(() => {
            try {
              osc1.stop();
              osc2.stop();
              osc3.stop();
              osc4.stop();
              masterGain.disconnect();
              chimeGain.disconnect();
              if (window.__portfolioCloseCtxOnFinish) {
                ctx.close().catch(() => {});
              }
            } catch (_) {}
          }, 550);
        } catch (_) {}
      }
    };

    window.__activeAudioEngine = engineInstance;
    return engineInstance;
  } catch (_) {
    return null;
  }
}

/**
 * Minimal Branded Loading Sequence with Realistic Readiness Synchronization & Animated Progress Bar
 */
function setupIntroLoader() {
  const loader = document.getElementById('intro-loader');
  const progressBar = document.getElementById('intro-progress-bar');
  const progressPercent = document.getElementById('intro-progress-percent');
  const infinityTracker = document.getElementById('intro-infinity-tracker');
  if (!loader) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alreadySeen = sessionStorage.getItem('mofidul_intro_seen') === '1';

  // Fast resolution for users requesting reduced motion or repeat visits in same session
  if (prefersReduced || alreadySeen) {
    loader.classList.add('loader-exiting');
    setTimeout(() => {
      loader.classList.add('loader-hidden');
      loader.setAttribute('aria-hidden', 'true');
    }, 150);
    if (typeof window.triggerHeroEntrance === 'function') {
      window.triggerHeroEntrance();
    }
    return;
  }

  window.isAppReady = false;
  window.markAppReady = function() {
    window.isAppReady = true;
  };

  const minLoaderDuration = 820; // Minimum duration (~0.8s) so experience never flashes jarringly
  const startTime = performance.now();
  const audioEngine = createLoadingAudioEngine();

  let currentVisualProgress = 0;
  let completionStartTime = null;
  let completionStartProgress = 0;
  let isDone = false;

  function updateProgress(currentTime) {
    if (isDone) return;
    const elapsed = currentTime - startTime;
    const isReady = !!window.isAppReady && elapsed >= minLoaderDuration;

    if (!isReady) {
      // 0-80% advances smoothly over initial ~650ms
      // 80-92% smoothly decelerates and sustains ambient chord while awaiting readiness
      if (elapsed <= 650) {
        currentVisualProgress = (elapsed / 650) * 0.80;
      } else {
        const holdElapsed = elapsed - 650;
        currentVisualProgress = 0.80 + (1 - Math.exp(-holdElapsed / 1000)) * 0.12;
        if (audioEngine && typeof audioEngine.sustain === 'function') {
          audioEngine.sustain();
        }
      }
    } else {
      // Real application is ready: swiftly and smoothly glide 95% -> 100%
      if (completionStartTime === null) {
        completionStartTime = currentTime;
        completionStartProgress = Math.max(currentVisualProgress, 0.82);
      }
      const cElapsed = currentTime - completionStartTime;
      const cT = Math.min(cElapsed / 200, 1);
      const easeC = 1 - Math.pow(1 - cT, 2);
      currentVisualProgress = completionStartProgress + (1.0 - completionStartProgress) * easeC;
    }

    const rawProgress = Math.min(Math.max(currentVisualProgress, 0), 1);
    const percent = Math.min(Math.round(rawProgress * 100), 100);

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (infinityTracker) infinityTracker.style.left = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;

    if (audioEngine) {
      audioEngine.update(rawProgress);
    }

    if (rawProgress < 1) {
      requestAnimationFrame(updateProgress);
    } else {
      isDone = true;
      if (audioEngine) {
        audioEngine.finish();
      }
      // Completed 100%: brief hold (90ms) then smooth fade & blur exit immediately
      setTimeout(() => {
        loader.classList.add('loader-exiting');
        if (typeof window.triggerHeroEntrance === 'function') {
          window.triggerHeroEntrance();
        }
        setTimeout(() => {
          loader.classList.add('loader-hidden');
          loader.setAttribute('aria-hidden', 'true');
          sessionStorage.setItem('mofidul_intro_seen', '1');
        }, 450);
      }, 90);
    }
  }

  requestAnimationFrame(updateProgress);
}

/**
 * Gallery Image Lightbox Viewer
 */
function setupLightboxEvents() {
  const modal = document.getElementById('image-lightbox-modal');
  const closeBtn = document.getElementById('lightbox-close-btn');
  if (!modal) return;

  const closeLightbox = () => {
    if (modal.style.display !== 'flex' || modal.classList.contains('closing')) return;
    modal.classList.add('closing');
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('closing');
    }, 220);
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeLightbox();
    }
  });
}

function openLightbox(imageUrl, captionText) {
  const modal = document.getElementById('image-lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  if (!modal || !img) return;

  modal.classList.remove('closing');
  img.src = imageUrl;
  img.alt = captionText || 'Enlarged project visual';
  if (caption) {
    caption.textContent = captionText || '';
    caption.style.display = captionText ? 'block' : 'none';
  }
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/**
 * Smooth Route & Page Transitions
 */
function setupPageTransitions() {
  window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-transitioning');
  });

  document.querySelectorAll('a[href^="/"]:not([target="_blank"]), a[href^="./"]:not([target="_blank"])').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('/#') || e.metaKey || e.ctrlKey || e.shiftKey) return;
      
      e.preventDefault();
      document.body.classList.add('page-transitioning');
      setTimeout(() => {
        window.location.href = href;
      }, 240);
    });
  });
}

/**
 * Utility: Safe HTML Escaping
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Website-Wide Multi-Section Atmosphere Engine
 * - Connects the Hero's living blurry blue-purple animation system to EVERY major section
 * - Section-Aware: Each section's animation is physically attached to its own background
 * - Scroll Connection: Multi-plane differential speeds that respond to scroll progress and reverse naturally
 * - Continuous Fluid Waves: Multi-harmonic compound wave math (drift, flow, morph, rotate, expand/contract)
 * - Always Active: Viewport IntersectionObserver keeps visible sections moving smoothly at 60fps
 * - Interactive pointer tracking with spring physics per section
 * - Replays Hero entrance bloom on re-entry
 */
function setupHeroAtmosphereParallax() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const atmosphere = document.getElementById('hero-atmosphere');
  const spine = document.getElementById('global-atmosphere-spine');
  const spineBody = spine ? spine.querySelector('.continuous-ribbon-body') : null;
  const spineEdge1 = spine ? spine.querySelector('.continuous-ribbon-edge-1') : null;
  const spineEdge2 = spine ? spine.querySelector('.continuous-ribbon-edge-2') : null;
  const spineBase = spine ? spine.querySelector('.spine-path-base') : null;
  const spinePulse = spine ? spine.querySelector('.spine-path-pulse') : null;
  let entranceBoost = 0;
  let heroHasLeft = false;

  // Function to trigger/replay the hero entrance blur animation
  function triggerHeroEntrance() {
    if (atmosphere) {
      atmosphere.classList.remove('hero-entering');
      void atmosphere.offsetWidth; // Force reflow to restart CSS animation
      atmosphere.classList.add('hero-entering');
    }

    const heroLeft = hero.querySelector('.hero-left');
    const heroRight = hero.querySelector('.hero-right');
    if (heroLeft) {
      heroLeft.classList.remove('revealed');
      void heroLeft.offsetWidth;
      heroLeft.classList.add('revealed');
    }
    if (heroRight) {
      heroRight.classList.remove('revealed');
      void heroRight.offsetWidth;
      heroRight.classList.add('revealed');
    }

    entranceBoost = 1.0;
  }

  // Expose globally so intro loader and navigation can call it
  window.triggerHeroEntrance = triggerHeroEntrance;
  triggerHeroEntrance();

  // Multi-Section Configuration: Extends Hero visual DNA to all major content sections
  const sectionDefinitions = [
    {
      id: 'hero',
      selector: '#hero',
      ribbonSelectors: ['#hero-ribbon-1', '#hero-ribbon-2', '#hero-ribbon-3', '#hero-ribbon-4'],
      glowSelector: '.hero-glow-layer',
      contentSelector: '.hero-grid',
      phaseOffset: 0,
      speedFactor: 1.0,
      r1DriftX: 60, r1DriftY: 46, r1Rot: 4.4, r1Scale: 0.052, r1Scroll: 0.18,
      r2DriftX: -66, r2DriftY: 50, r2Rot: -5.0, r2Scale: 0.048, r2Scroll: -0.11,
      r3DriftX: 74, r3DriftY: -54, r3Rot: 5.6, r3Scale: 0.065, r3Scroll: 0.24,
      r4DriftX: -46, r4DriftY: 36, r4Rot: 0, r4Scale: 0.060, r4Scroll: 0.08,
      glowDriftX: 38, glowDriftY: 32, glowScale: 0.070, glowScroll: 0.06
    },
    {
      id: 'work',
      selector: '#work',
      ribbonSelectors: ['.work-ribbon-1', '.work-ribbon-2', '.work-ribbon-3'],
      glowSelector: '.atmo-work-glow',
      phaseOffset: 1.7,
      speedFactor: 1.05,
      r1DriftX: 64, r1DriftY: 48, r1Rot: 4.6, r1Scale: 0.055, r1Scroll: 0.15,
      r2DriftX: -70, r2DriftY: 52, r2Rot: -5.2, r2Scale: 0.050, r2Scroll: -0.10,
      r3DriftX: 75, r3DriftY: -56, r3Rot: 5.8, r3Scale: 0.068, r3Scroll: 0.22,
      glowDriftX: 40, glowDriftY: 34, glowScale: 0.072, glowScroll: 0.05
    },
    {
      id: 'services',
      selector: '#services',
      ribbonSelectors: ['.services-ribbon-1', '.services-ribbon-2', '.services-ribbon-3'],
      glowSelector: '.atmo-services-glow',
      phaseOffset: 3.2,
      speedFactor: 1.1,
      r1DriftX: 66, r1DriftY: 44, r1Rot: 4.0, r1Scale: 0.052, r1Scroll: 0.14,
      r2DriftX: -68, r2DriftY: 50, r2Rot: -4.8, r2Scale: 0.048, r2Scroll: -0.09,
      r3DriftX: 72, r3DriftY: -50, r3Rot: 5.2, r3Scale: 0.062, r3Scroll: 0.20,
      glowDriftX: 36, glowDriftY: 30, glowScale: 0.065, glowScroll: 0.05
    },
    {
      id: 'stats',
      selector: '#stats',
      ribbonSelectors: ['.stats-ribbon-1', '.stats-ribbon-2', '.stats-ribbon-3'],
      glowSelector: '.atmo-stats-glow',
      phaseOffset: 4.5,
      speedFactor: 0.95,
      r1DriftX: 58, r1DriftY: 40, r1Rot: 3.4, r1Scale: 0.048, r1Scroll: 0.12,
      r2DriftX: -62, r2DriftY: 44, r2Rot: -4.0, r2Scale: 0.044, r2Scroll: -0.08,
      r3DriftX: 66, r3DriftY: -46, r3Rot: 4.5, r3Scale: 0.056, r3Scroll: 0.18,
      glowDriftX: 32, glowDriftY: 28, glowScale: 0.060, glowScroll: 0.04
    },
    {
      id: 'about',
      selector: '#about',
      ribbonSelectors: ['.about-ribbon-1', '.about-ribbon-2', '.about-ribbon-3'],
      glowSelector: '.atmo-about-glow',
      phaseOffset: 2.4,
      speedFactor: 1.0,
      r1DriftX: 68, r1DriftY: 50, r1Rot: 4.8, r1Scale: 0.056, r1Scroll: 0.16,
      r2DriftX: -72, r2DriftY: 54, r2Rot: -5.4, r2Scale: 0.052, r2Scroll: -0.10,
      r3DriftX: 78, r3DriftY: -58, r3Rot: 6.0, r3Scale: 0.070, r3Scroll: 0.23,
      glowDriftX: 42, glowDriftY: 36, glowScale: 0.075, glowScroll: 0.06
    },
    {
      id: 'testimonials',
      selector: '#testimonials',
      ribbonSelectors: ['.testim-ribbon-1', '.testim-ribbon-2', '.testim-ribbon-3'],
      glowSelector: '.atmo-testim-glow',
      phaseOffset: 5.1,
      speedFactor: 1.05,
      r1DriftX: 62, r1DriftY: 46, r1Rot: 4.2, r1Scale: 0.050, r1Scroll: 0.14,
      r2DriftX: -68, r2DriftY: 50, r2Rot: -5.0, r2Scale: 0.048, r2Scroll: -0.09,
      r3DriftX: 72, r3DriftY: -52, r3Rot: 5.4, r3Scale: 0.064, r3Scroll: 0.20,
      glowDriftX: 36, glowDriftY: 32, glowScale: 0.065, glowScroll: 0.05
    },
    {
      id: 'contact',
      selector: '#contact',
      ribbonSelectors: ['.contact-ribbon-1', '.contact-ribbon-2', '.contact-ribbon-3'],
      glowSelector: '.atmo-contact-glow',
      phaseOffset: 0.9,
      speedFactor: 1.0,
      r1DriftX: 65, r1DriftY: 48, r1Rot: 4.5, r1Scale: 0.054, r1Scroll: 0.15,
      r2DriftX: -70, r2DriftY: 52, r2Rot: -5.2, r2Scale: 0.050, r2Scroll: -0.10,
      r3DriftX: 76, r3DriftY: -56, r3Rot: 5.8, r3Scale: 0.066, r3Scroll: 0.22,
      glowDriftX: 40, glowDriftY: 34, glowScale: 0.070, glowScroll: 0.05
    }
  ];

  // Initialize Section Objects & Bind Pointer Interactions
  const activeSections = new Set();
  const sectionObjects = [];

  sectionDefinitions.forEach(def => {
    const el = document.querySelector(def.selector);
    if (!el) return;

    const ribbons = def.ribbonSelectors
      .map(sel => el.querySelector(sel))
      .filter(Boolean);
    const glow = el.querySelector(def.glowSelector);
    const content = def.contentSelector ? el.querySelector(def.contentSelector) : null;

    const secObj = {
      ...def,
      el,
      ribbons,
      glow,
      content,
      targetMouseX: 0,
      targetMouseY: 0,
      currentMouseX: 0,
      currentMouseY: 0,
      currentScroll: 0,
      pointerBoost: 0,
      isMouseIn: false,
      isVisible: false
    };

    // Attach spring-interpolated pointer tracking to each section
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      secObj.targetMouseX = relX * 55;
      secObj.targetMouseY = relY * 42;
      secObj.pointerBoost = Math.min(1.0, secObj.pointerBoost + 0.15);
      secObj.isMouseIn = true;
    }, { passive: true });

    el.addEventListener('mouseenter', () => {
      secObj.isMouseIn = true;
      secObj.pointerBoost = Math.max(secObj.pointerBoost, 0.65);
    });

    el.addEventListener('mouseleave', () => {
      secObj.isMouseIn = false;
      secObj.targetMouseX = 0;
      secObj.targetMouseY = 0;
    });

    sectionObjects.push(secObj);
  });

  let targetScrollY = window.scrollY;
  let currentScrollY = window.scrollY;

  // Global Scroll Event: Fast scroll tracking & top return detection
  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY;
    if (window.scrollY < 40 && heroHasLeft) {
      heroHasLeft = false;
      triggerHeroEntrance();
      const heroSec = sectionObjects.find(s => s.id === 'hero');
      if (heroSec) activeSections.add(heroSec);
      if (!rafId) {
        lastTimestamp = performance.now();
        rafId = requestAnimationFrame(renderMotionLoop);
      }
    }
  }, { passive: true });

  // IntersectionObserver: Keeps visible sections active & seamlessly wakes them on return
  let rafId = null;
  const atmosphereObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sec = sectionObjects.find(s => s.el === entry.target);
      if (!sec) return;

      const rect = entry.boundingClientRect;
      sec.top = rect.top + window.scrollY;
      sec.height = rect.height;

      if (entry.isIntersecting) {
        sec.isVisible = true;
        activeSections.add(sec);

        if (sec.id === 'hero' && heroHasLeft && rect.bottom > 220) {
          heroHasLeft = false;
          triggerHeroEntrance();
        }

        if (!rafId) {
          lastTimestamp = performance.now();
          rafId = requestAnimationFrame(renderMotionLoop);
        }
      } else {
        sec.isVisible = false;
        activeSections.delete(sec);

        if (sec.id === 'hero' && rect.bottom <= 80) {
          heroHasLeft = true;
          if (atmosphere) atmosphere.classList.remove('hero-entering');
        }
      }
    });
  }, {
    threshold: [0, 0.05, 0.2, 0.5],
    rootMargin: '120px 0px 120px 0px'
  });

  sectionObjects.forEach(sec => atmosphereObserver.observe(sec.el));

  window.addEventListener('resize', () => {
    sectionObjects.forEach(sec => {
      const r = sec.el.getBoundingClientRect();
      sec.top = r.top + window.scrollY;
      sec.height = r.height;
    });
  }, { passive: true });

  let fluidPhase = 0;
  let lastTimestamp = performance.now();

  // Continuous 60fps multi-plane fluid motion loop
  function renderMotionLoop(timestamp) {
    if (activeSections.size === 0) {
      rafId = null;
      return;
    }

    const now = timestamp || performance.now();
    const deltaMs = Math.min(now - lastTimestamp, 40);
    lastTimestamp = now;

    // Decay entrance boost smoothly
    if (entranceBoost > 0.005) {
      entranceBoost *= 0.972;
    } else {
      entranceBoost = 0;
    }

    // Accumulate organic fluid wave phase (continuous, alive, noticeable)
    let pointerBoost = 0;
    activeSections.forEach(s => { pointerBoost = Math.max(pointerBoost, s.pointerBoost); });
    const speedMult = 1 + (entranceBoost * 1.35) + (pointerBoost * 0.25);
    fluidPhase += deltaMs * 0.00135 * speedMult;

    // Global scroll spring interpolation
    if (Math.abs(targetScrollY - currentScrollY) < 0.1) {
      currentScrollY = targetScrollY;
    } else {
      currentScrollY += (targetScrollY - currentScrollY) * 0.22;
    }

    const winH = window.innerHeight || 800;
    const isMobileDevice = window.innerWidth <= 768 || (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);

    activeSections.forEach(sec => {
      // Spring interpolation for pointer tracking (only on desktop)
      if (!isMobileDevice) {
        sec.currentMouseX += (sec.targetMouseX - sec.currentMouseX) * 0.065;
        sec.currentMouseY += (sec.targetMouseY - sec.currentMouseY) * 0.065;
      }

      // Section-Aware Scroll Calculation:
      // When section center matches viewport center, rawOffset = 0
      // Scrolling down shifts rawOffset positively (section moves up through viewport)
      // Scrolling up naturally shifts rawOffset in reverse
      const secTop = (sec.top !== undefined) ? sec.top : sec.el.offsetTop;
      const secH = sec.height || 800;
      const rawOffset = (winH * 0.5) - (secTop - currentScrollY + secH * 0.5);

      // Butter-smooth spring lerp for scroll reaction
      sec.currentScroll += (rawOffset - sec.currentScroll) * 0.18;

      // Decay interaction boost back to ambient
      if (!sec.isMouseIn) {
        sec.pointerBoost = Math.max(0, sec.pointerBoost * 0.982);
      }

      const p = (fluidPhase * sec.speedFactor) + sec.phaseOffset;
      const boost = (sec.id === 'hero' ? entranceBoost : 0) + (sec.pointerBoost * 0.22);

      // On mobile devices, ribbons are display: none in CSS, so skip continuous transforms!
      if (!isMobileDevice) {
        // Ribbon 1: Primary Broad Diagonal Wave (drifting, floating, rotating)
        if (sec.ribbons[0]) {
          const p1 = p;
          const ambX1 = Math.sin(p1) * sec.r1DriftX + Math.cos(p1 * 0.54) * (sec.r1DriftX * 0.42);
          const ambY1 = Math.cos(p1 * 0.8) * sec.r1DriftY + Math.sin(p1 * 0.42) * (sec.r1DriftY * 0.38);
          const amb1Rot = Math.sin(p1 * 0.68) * sec.r1Rot;
          const scale1 = 1 + Math.sin(p1 * 0.56) * sec.r1Scale + (boost * 0.035);

          const r1X = (sec.currentMouseX * 0.82) + ambX1;
          const r1Y = (sec.currentScroll * sec.r1Scroll) + (sec.currentMouseY * 0.82) + ambY1;
          sec.ribbons[0].style.transform = `translate3d(${r1X.toFixed(2)}px, ${r1Y.toFixed(2)}px, 0) rotate(${amb1Rot.toFixed(2)}deg) scale(${scale1.toFixed(3)})`;
        }

        // Ribbon 2: Secondary Counter-Drift Wave (counter-drift, folding depth)
        if (sec.ribbons[1]) {
          const p2 = p * 0.90 + 1.4;
          const ambX2 = Math.cos(p2) * sec.r2DriftX + Math.sin(p2 * 0.62) * (Math.abs(sec.r2DriftX) * 0.42);
          const ambY2 = Math.sin(p2 * 0.82) * sec.r2DriftY + Math.cos(p2 * 0.46) * (sec.r2DriftY * -0.4);
          const rot2 = Math.cos(p2 * 0.6) * sec.r2Rot;
          const scale2 = 1 + Math.cos(p2 * 0.5) * sec.r2Scale + (boost * 0.03);

          const r2X = (sec.currentMouseX * 0.62) + ambX2;
          const r2Y = (sec.currentScroll * sec.r2Scroll) + (sec.currentMouseY * 0.62) + ambY2;
          sec.ribbons[1].style.transform = `translate3d(${r2X.toFixed(2)}px, ${r2Y.toFixed(2)}px, 0) rotate(${rot2.toFixed(2)}deg) scale(${scale2.toFixed(3)})`;
        }

        // Ribbon 3: Luminous Specular Spine Wave (shimmering, energetic, reactive)
        if (sec.ribbons[2]) {
          const p3 = p * 1.25 + 2.8;
          const ambX3 = Math.sin(p3) * sec.r3DriftX + Math.cos(p3 * 0.5) * (sec.r3DriftX * -0.42);
          const ambY3 = Math.cos(p3 * 0.9) * sec.r3DriftY + Math.sin(p3 * 0.36) * (Math.abs(sec.r3DriftY) * 0.4);
          const rot3 = Math.sin(p3 * 0.76) * sec.r3Rot;
          const scale3 = 1 + Math.sin(p3 * 0.7) * sec.r3Scale + (boost * 0.045);

          const r3X = (sec.currentMouseX * 1.28) + ambX3;
          const r3Y = (sec.currentScroll * sec.r3Scroll) + (sec.currentMouseY * 1.28) + ambY3;
          sec.ribbons[2].style.transform = `translate3d(${r3X.toFixed(2)}px, ${r3Y.toFixed(2)}px, 0) rotate(${rot3.toFixed(2)}deg) scale(${scale3.toFixed(3)})`;
        }

        // Ribbon 4: Deep Atmospheric Base Ribbon (e.g. Hero ribbon 4)
        if (sec.ribbons[3]) {
          const p4 = p * 0.76 + 2.1;
          const ambX4 = Math.cos(p4) * sec.r4DriftX + Math.sin(p4 * 0.42) * 22;
          const ambY4 = Math.sin(p4 * 0.86) * sec.r4DriftY + Math.cos(p4 * 0.32) * -18;
          const scale4 = 1 + Math.cos(p4 * 0.44) * sec.r4Scale + (boost * 0.03);

          const r4X = (sec.currentMouseX * 0.42) + ambX4;
          const r4Y = (sec.currentScroll * sec.r4Scroll) + (sec.currentMouseY * 0.42) + ambY4;
          sec.ribbons[3].style.transform = `translate3d(${r4X.toFixed(2)}px, ${r4Y.toFixed(2)}px, 0) scale(${scale4.toFixed(3)})`;
        }
      }

      // Ambient Glow Layer: Pulsating radiant illumination
      if (sec.glow) {
        const pg = p * 0.82;
        const ambGlowX = Math.sin(pg) * sec.glowDriftX;
        const ambGlowY = Math.cos(pg * 0.72) * sec.glowDriftY;
        const gScale = 1 + Math.sin(pg * 0.58) * sec.glowScale + (boost * 0.06);

        const gX = ambGlowX + (sec.currentMouseX * 0.3);
        const gY = ambGlowY + (sec.currentScroll * sec.glowScroll) + (sec.currentMouseY * 0.3);
        sec.glow.style.transform = `translate3d(${gX.toFixed(2)}px, ${gY.toFixed(2)}px, 0) scale(${gScale.toFixed(3)})`;
      }

      // Optional content parallax (e.g. Hero grid subtle elevation)
      if (sec.content && !isMobileDevice) {
        const contentY = sec.currentScroll * 0.035;
        sec.content.style.transform = `translate3d(0, ${contentY.toFixed(2)}px, 0)`;
      }
    });

    // Living Continuous S-Wave Ribbon Motion:
    // Seamlessly flows, waves, morphs, shifts side-to-side, and gently breathes in light intensity
    if (spine) {
      if (isMobileDevice) {
        // Lightweight mobile spine: gentle breathing opacity only, no expensive compound matrix transformations
        const spineBreath = 0.88 + Math.sin(fluidPhase * 0.60) * 0.08;
        spine.style.opacity = spineBreath.toFixed(3);
      } else {
        // Gentle light intensity breathing (soft blue-purple glow)
        const spineBreath = 0.88 + Math.sin(fluidPhase * 0.60) * 0.08;
        spine.style.opacity = spineBreath.toFixed(3);

        // Large soft compound wave sway shifting side to side across the page
        const spineWaveX = Math.sin(fluidPhase * 0.54) * 38 + Math.cos(fluidPhase * 0.28) * 16;
        const spineWaveY = Math.cos(fluidPhase * 0.44) * 14 + Math.sin(fluidPhase * 0.22) * 8;
        const spineScale = 1.0 + Math.sin(fluidPhase * 0.36) * 0.022;
        spine.style.transform = `translate3d(${spineWaveX.toFixed(2)}px, ${spineWaveY.toFixed(2)}px, 0) scale(${spineScale.toFixed(4)})`;

        // Differential morphing and gentle deformation on volumetric ribbon body
        if (spineBody) {
          const bodyMorphX = Math.cos(fluidPhase * 0.64) * 18 + Math.sin(fluidPhase * 0.32) * 8;
          const bodyMorphY = Math.sin(fluidPhase * 0.52) * 12;
          const bodyScaleX = 1 + Math.sin(fluidPhase * 0.46) * 0.032;
          const bodyScaleY = 1 + Math.cos(fluidPhase * 0.38) * 0.022;
          spineBody.style.transform = `translate3d(${bodyMorphX.toFixed(2)}px, ${bodyMorphY.toFixed(2)}px, 0) scale(${bodyScaleX.toFixed(4)}, ${bodyScaleY.toFixed(4)})`;
        }

        // Counter-wave deformation on specular ribbon contours
        if (spineEdge1) {
          const edge1X = Math.sin(fluidPhase * 0.70 + 1.2) * 16;
          const edge1Y = Math.cos(fluidPhase * 0.54 + 0.8) * 10;
          spineEdge1.style.transform = `translate3d(${edge1X.toFixed(2)}px, ${edge1Y.toFixed(2)}px, 0)`;
        }
        if (spineEdge2) {
          const edge2X = Math.cos(fluidPhase * 0.68 + 2.2) * -16;
          const edge2Y = Math.sin(fluidPhase * 0.58 + 1.4) * 10;
          spineEdge2.style.transform = `translate3d(${edge2X.toFixed(2)}px, ${edge2Y.toFixed(2)}px, 0)`;
        }

        // Harmonized drift on center spine line and energy pulse
        if (spineBase) {
          const baseX = Math.sin(fluidPhase * 0.58) * 10;
          spineBase.style.transform = `translate3d(${baseX.toFixed(2)}px, 0, 0)`;
        }
        if (spinePulse) {
          const pulseX = Math.sin(fluidPhase * 0.58) * 10;
          spinePulse.style.transform = `translate3d(${pulseX.toFixed(2)}px, 0, 0)`;
        }
      }
    }

    rafId = requestAnimationFrame(renderMotionLoop);
  }

  // Kick off initial loop
  rafId = requestAnimationFrame(renderMotionLoop);
}

/**
 * Buttery Smooth Interactive Physics:
 * - Cursor Colored Liquid-Water Interaction (pure blue-purple watercolor, zero white halo)
 * - Magnetic Button & Link Micro-Interactions
 * - Soft 3D Card Tilt with Specular Glass Light Sheen
 */
function setupButterSmoothInteractions() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Disable on touch devices for maximum native scroll responsiveness
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

  // 1. Cursor Water-Drop Liquid Glass Interaction (teardrop inertia & frosted-glass clearing)
  const waterDrop = document.getElementById('cursor-water-drop');
  if (waterDrop && !waterDrop.hasAttribute('data-initialized')) {
    waterDrop.setAttribute('data-initialized', '1');
    let targetX = -500;
    let targetY = -500;
    let dropX = -500;
    let dropY = -500;
    let prevDropX = -500;
    let prevDropY = -500;
    let isDropActive = false;
    let lastMoveTime = 0;
    let waterDropRaf = null;

    function renderWaterDrop(now) {
      if (!isDropActive) {
        waterDropRaf = null;
        return;
      }

      // Natural fluid spring inertia with immediate responsiveness (no lag, no trail)
      // Base tracking formula: dropX += (targetX - dropX) * 0.135
      const lerp = 0.42; // ultra-responsive tracking so there is zero visible delay or lag
      dropX += (targetX - dropX) * lerp;
      dropY += (targetY - dropY) * lerp;

      const vx = dropX - prevDropX;
      const vy = dropY - prevDropY;
      prevDropX = dropX;
      prevDropY = dropY;

      const speed = Math.hypot(vx, vy);
      const timeSinceMove = (now || performance.now()) - lastMoveTime;

      // Dynamic teardrop velocity stretch calculation (kept minimal to prevent visible trail)
      let stretch = Math.min(speed * 0.016, 0.22);
      if (timeSinceMove > 60) {
        stretch *= 0.2; // instantly return to pure round water droplet
      }

      const angle = speed > 0.4 ? Math.atan2(vy, vx) * (180 / Math.PI) : 0;
      // Gentle subtle liquid meniscus elasticity without heavy distortion or trailing lag
      const lensStretch = Math.min(stretch, 0.025);

      // Small, elegant magnification zoom directly under the cursor (moves exactly with the pointer)
      const currentZoom = 1.08;
      const scaleX = (currentZoom + lensStretch).toFixed(3);
      const scaleY = (currentZoom - lensStretch * 0.5).toFixed(3);

      waterDrop.style.transform = `translate3d(${dropX.toFixed(1)}px, ${dropY.toFixed(1)}px, 0) rotate(${angle.toFixed(1)}deg) scale(${scaleX}, ${scaleY})`;

      // Pause RAF when droplet settles to conserve high-refresh frame budget
      if (timeSinceMove > 400 && Math.abs(targetX - dropX) < 0.15 && Math.abs(targetY - dropY) < 0.15) {
        waterDropRaf = null;
        return;
      }

      waterDropRaf = requestAnimationFrame(renderWaterDrop);
    }

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      lastMoveTime = performance.now();
      if (!isDropActive) {
        isDropActive = true;
        dropX = targetX;
        dropY = targetY;
        prevDropX = targetX;
        prevDropY = targetY;
        waterDrop.classList.add('active');
      }
      if (!waterDropRaf) {
        waterDropRaf = requestAnimationFrame(renderWaterDrop);
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      waterDrop.classList.remove('active');
      isDropActive = false;
      if (waterDropRaf) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(waterDropRaf);
        }
        waterDropRaf = null;
      }
    });

    document.addEventListener('mouseenter', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      isDropActive = true;
      waterDrop.classList.add('active');
      if (!waterDropRaf) {
        waterDropRaf = requestAnimationFrame(renderWaterDrop);
      }
    });
  }

  // 2. Magnetic Button & Link Micro-Interactions (with cached rects to prevent layout reflows)
  const magneticTargets = document.querySelectorAll(
    '.btn:not([data-magnetic-bound]), .filter-btn:not([data-magnetic-bound]), .brand-logo:not([data-magnetic-bound]), .nav-link:not([data-magnetic-bound]), .social-link-item:not([data-magnetic-bound]), .footer-admin-link:not([data-magnetic-bound])'
  );
  magneticTargets.forEach(btn => {
    btn.setAttribute('data-magnetic-bound', '1');
    let btnTicking = false;
    let targetMoveX = 0;
    let targetMoveY = 0;
    let curMoveX = 0;
    let curMoveY = 0;
    let btnHovered = false;
    let btnRect = null;

    function updateBtn() {
      if (!btnHovered && Math.abs(curMoveX) < 0.05 && Math.abs(curMoveY) < 0.05) {
        btn.style.transform = '';
        btnTicking = false;
        return;
      }

      curMoveX += (targetMoveX - curMoveX) * 0.12;
      curMoveY += (targetMoveY - curMoveY) * 0.12;
      btn.style.transform = `translate3d(${curMoveX.toFixed(2)}px, ${curMoveY.toFixed(2)}px, 0)`;

      requestAnimationFrame(updateBtn);
    }

    btn.addEventListener('mouseenter', () => {
      btnRect = btn.getBoundingClientRect();
      btnHovered = true;
    }, { passive: true });

    btn.addEventListener('mousemove', (e) => {
      if (!btnRect) btnRect = btn.getBoundingClientRect();
      const centerX = btnRect.left + btnRect.width / 2;
      const centerY = btnRect.top + btnRect.height / 2;
      const dx = (e.clientX - centerX) * 0.22;
      const dy = (e.clientY - centerY) * 0.22;

      // Max clamp ±6px horizontal, ±4px vertical
      targetMoveX = Math.max(-6, Math.min(6, dx));
      targetMoveY = Math.max(-4, Math.min(4, dy));

      if (!btnTicking) {
        btnTicking = true;
        btnHovered = true;
        requestAnimationFrame(updateBtn);
      }
    }, { passive: true });

    btn.addEventListener('mouseleave', () => {
      btnHovered = false;
      btnRect = null;
      targetMoveX = 0;
      targetMoveY = 0;
    });
  });

  // 3. Soft 3D Card Tilt with Specular Glass Light Sheen (cached rects for 90Hz+ fluid rendering)
  const cards = document.querySelectorAll(
    '.project-card:not([data-tilt-bound]), .stat-item:not([data-tilt-bound]), .testimonial-card:not([data-tilt-bound]), .contact-form-card:not([data-tilt-bound]), .about-quote-box:not([data-tilt-bound]), .service-row:not([data-tilt-bound])'
  );
  cards.forEach(card => {
    card.setAttribute('data-tilt-bound', '1');
    let cardTicking = false;
    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;
    let cardHovered = false;
    let cardRect = null;

    function updateCard() {
      if (!cardHovered && Math.abs(curRotX) < 0.02 && Math.abs(curRotY) < 0.02) {
        card.style.transform = '';
        cardTicking = false;
        return;
      }

      curRotX += (targetRotX - curRotX) * 0.08;
      curRotY += (targetRotY - curRotY) * 0.08;
      const lift = cardHovered ? -5 : 0;
      card.style.transform = `translate3d(0, ${lift}px, 0) rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg)`;

      requestAnimationFrame(updateCard);
    }

    card.addEventListener('mouseenter', () => {
      cardRect = card.getBoundingClientRect();
      cardHovered = true;
    }, { passive: true });

    card.addEventListener('mousemove', (e) => {
      if (!cardRect) cardRect = card.getBoundingClientRect();
      const px = (e.clientX - cardRect.left) / cardRect.width;
      const py = (e.clientY - cardRect.top) / cardRect.height;

      // Update specular sheen position
      card.style.setProperty('--mouse-x', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--mouse-y', `${(py * 100).toFixed(1)}%`);

      // Gentle tilt: max ±3.2deg
      targetRotY = (px - 0.5) * 6.4;
      targetRotX = -(py - 0.5) * 6.4;

      if (!cardTicking) {
        cardTicking = true;
        cardHovered = true;
        requestAnimationFrame(updateCard);
      }
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      cardHovered = false;
      cardRect = null;
      targetRotX = 0;
      targetRotY = 0;
    });
  });
}
