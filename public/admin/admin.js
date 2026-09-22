/**
 * MOFIDUL — Private CMS Admin Dashboard Client Logic
 * Real-time CRUD operations, media uploads, authentication, and state management.
 */

let authToken = localStorage.getItem('mofidul_admin_token') || null;
let currentHeroData = null;
let currentSettingsData = null;
let allProjectsData = [];
let allServicesData = [];
let allSkillsData = [];
let allExperienceData = [];
let allStatsData = [];
let allTestimonialsData = [];
let allSocialData = [];
let allMediaData = [];
let allNavigationData = [];
let allSectionsData = [];

document.addEventListener('DOMContentLoaded', () => {
  setupIntroLoader();
  initAuth();
  setupTabNavigation();
  setupLoginForm();
  setupLogout();
  setupProjectsModule();
  setupServicesModule();
  setupSkillsModule();
  setupExperienceModule();
  setupTestimonialsModule();
  setupProfileModule();
  setupMediaModule();
  setupSettingsModule();
  setupStatsModule();
  setupMessagesModule();
});

// ==========================================================================
// INTRO LOADER & AUDIO SYNTHESIS ENGINE
// ==========================================================================

// Global AudioContext singleton for Admin to prevent hardware context leaks and ensure reliable repeatability
window.__adminAudioCtx = window.__adminAudioCtx || null;
window.__activeAdminAudioEngine = window.__activeAdminAudioEngine || null;

function getSharedAdminAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!window.__adminAudioCtx || window.__adminAudioCtx.state === 'closed') {
      window.__adminAudioCtx = new AudioCtx();
    }
    return window.__adminAudioCtx;
  } catch (_) {
    return null;
  }
}

// Global unlock listener attached once to keep context alive
(function setupGlobalAdminAudioUnlock() {
  if (typeof window === 'undefined') return;
  const unlockEvents = ['pointerdown', 'mousedown', 'touchstart', 'touchend', 'click', 'keydown'];
  const unlock = () => {
    const ctx = getSharedAdminAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  unlockEvents.forEach(evt => {
    window.addEventListener(evt, unlock, { passive: true });
  });
})();

function createLoadingAudioEngine() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return null;
    }

    // Stop previous instance before starting new run to prevent duplicate instances
    if (window.__activeAdminAudioEngine && typeof window.__activeAdminAudioEngine.stopImmediate === 'function') {
      window.__activeAdminAudioEngine.stopImmediate();
    }

    const ctx = getSharedAdminAudioContext() || new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const unlockEvents = ['pointerdown', 'mousedown', 'touchstart', 'touchend', 'click', 'keydown'];
    const cleanupUnlockListeners = () => {
      unlockEvents.forEach(evt => window.removeEventListener(evt, unlockAudio));
    };
    const unlockAudio = () => {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => cleanupUnlockListeners()).catch(() => {});
      } else {
        cleanupUnlockListeners();
      }
    };
    unlockEvents.forEach(evt => window.addEventListener(evt, unlockAudio, { passive: true }));

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.24, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, ctx.currentTime);
    filter.Q.setValueAtTime(2.4, ctx.currentTime);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(130.81, ctx.currentTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(196.00, ctx.currentTime);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(261.63, ctx.currentTime);

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
    osc4Gain.gain.setValueAtTime(0.0001, ctx.currentTime);

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
      unlock: unlockAudio,
      stopImmediate() {
        if (isFinished) return;
        isFinished = true;
        try {
          cleanupUnlockListeners();
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
          const targetFreq = 360 + (p * 1740);
          filter.frequency.setTargetAtTime(targetFreq, now, 0.04);
          osc1.frequency.setTargetAtTime(130.81 + (p * 130.82), now, 0.06);
          osc2.frequency.setTargetAtTime(196.00 + (p * 196.00), now, 0.06);
          osc3.frequency.setTargetAtTime(261.63 + (p * 261.62), now, 0.06);
          osc4.frequency.setTargetAtTime(329.63 + (p * 329.62), now, 0.06);
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
          masterGain.gain.setValueAtTime(masterGain.gain.value, now);
          masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

          const chimeGain = ctx.createGain();
          chimeGain.gain.setValueAtTime(0.0001, now);
          chimeGain.gain.exponentialRampToValueAtTime(0.20, now + 0.018);
          chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);

          const chimeFilter = ctx.createBiquadFilter();
          chimeFilter.type = 'bandpass';
          chimeFilter.frequency.setValueAtTime(1250, now);
          chimeFilter.Q.setValueAtTime(2.4, now);

          const cOsc1 = ctx.createOscillator();
          cOsc1.type = 'sine';
          cOsc1.frequency.setValueAtTime(523.25, now);

          const cOsc2 = ctx.createOscillator();
          cOsc2.type = 'sine';
          cOsc2.frequency.setValueAtTime(783.99, now);

          const cOsc3 = ctx.createOscillator();
          cOsc3.type = 'sine';
          cOsc3.frequency.setValueAtTime(1046.50, now);

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
              cleanupUnlockListeners();
              masterGain.disconnect();
              chimeGain.disconnect();
              if (window.__adminCloseCtxOnFinish) {
                ctx.close().catch(() => {});
              }
            } catch (_) {}
          }, 550);
        } catch (_) {}
      }
    };

    window.__activeAdminAudioEngine = engineInstance;
    return engineInstance;
  } catch (_) {
    return null;
  }
}


function setupIntroLoader() {
  const loader = document.getElementById('intro-loader');
  const progressBar = document.getElementById('intro-progress-bar');
  const progressPercent = document.getElementById('intro-progress-percent');
  if (!loader) return;

  window.isAdminReady = false;
  window.markAdminReady = function() {
    window.isAdminReady = true;
  };

  const minLoaderDuration = 700;
  const startTime = performance.now();
  const audioEngine = createLoadingAudioEngine();

  let currentVisualProgress = 0;
  let completionStartTime = null;
  let completionStartProgress = 0;
  let isDone = false;

  function updateProgress(currentTime) {
    if (isDone) return;
    const elapsed = currentTime - startTime;
    const isReady = !!window.isAdminReady && elapsed >= minLoaderDuration;

    if (!isReady) {
      if (elapsed <= 500) {
        currentVisualProgress = (elapsed / 500) * 0.80;
      } else {
        const holdElapsed = elapsed - 500;
        currentVisualProgress = 0.80 + (1 - Math.exp(-holdElapsed / 800)) * 0.14;
        if (audioEngine && typeof audioEngine.sustain === 'function') {
          audioEngine.sustain();
        }
      }
    } else {
      if (completionStartTime === null) {
        completionStartTime = currentTime;
        completionStartProgress = Math.max(currentVisualProgress, 0.82);
      }
      const cElapsed = currentTime - completionStartTime;
      const cT = Math.min(cElapsed / 180, 1);
      const easeC = 1 - Math.pow(1 - cT, 2);
      currentVisualProgress = completionStartProgress + (1.0 - completionStartProgress) * easeC;
    }

    const rawProgress = Math.min(Math.max(currentVisualProgress, 0), 1);
    const percent = Math.min(Math.round(rawProgress * 100), 100);

    if (progressBar) progressBar.style.width = `${percent}%`;
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
      setTimeout(() => {
        loader.classList.add('loader-exiting');
        setTimeout(() => {
          loader.classList.add('loader-hidden');
          loader.setAttribute('aria-hidden', 'true');
        }, 400);
      }, 80);
    }
  }

  requestAnimationFrame(updateProgress);
}

// ==========================================================================
// 1. AUTHENTICATION & SESSION HANDLING
// ==========================================================================

async function initAuth() {
  try {
    const res = await apiFetch('/api/auth/me');
    if (res && res.success && res.user) {
      onAuthenticated(res.user);
    } else {
      showLoginScreen();
    }
  } catch (err) {
    showLoginScreen();
  } finally {
    if (typeof window.markAdminReady === 'function') {
      window.markAdminReady();
    }
  }
}

function showLoginScreen() {
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('admin-shell').style.display = 'none';
}

function onAuthenticated(user) {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('admin-shell').style.display = 'flex';
  document.getElementById('admin-user-display').textContent = user.username || 'Mofidul';
  document.getElementById('field-admin-username').value = user.username || '';
  document.getElementById('field-admin-email').value = user.email || '';

  // Load initial data for all panels
  loadOverview();
  loadProjectsData();
  loadServicesData();
  loadSkillsData();
  loadExperienceData();
  loadTestimonialsData();
  loadProfileData();
  loadMediaData();
  loadStatsData();
  loadMessagesData();
  loadSettingsData();
  loadNavigationData();
  loadSectionSettings();
}

function setupLoginForm() {
  const form = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    errorDiv.style.display = 'none';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        authToken = data.token;
        localStorage.setItem('mofidul_admin_token', authToken);
        showToast('Welcome back, Mofidul', 'success');
        onAuthenticated(data.user);
      } else {
        errorDiv.textContent = data.error || 'Invalid credentials. Please try again.';
        errorDiv.style.display = 'block';
      }
    } catch (err) {
      errorDiv.textContent = 'Network error while contacting server.';
      errorDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In to Dashboard';
    }
  });
}

function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('mofidul_admin_token');
    authToken = null;
    showToast('Signed out', 'success');
    showLoginScreen();
  });
}

/**
 * Authenticated fetch helper that handles JWT header and 401 redirects
 */
async function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  options.headers = headers;

  const res = await fetch(url, options);
  if (res.status === 401) {
    showLoginScreen();
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Server request failed');
  }
  return data;
}

// ==========================================================================
// 2. TAB NAVIGATION
// ==========================================================================

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.sidebar-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active'));
  const targetBtn = document.querySelector(`.sidebar-tab-btn[data-tab="${tabName}"]`);
  if (targetBtn) targetBtn.classList.add('active');

  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  const targetPanel = document.getElementById(`tab-${tabName}`);
  if (targetPanel) targetPanel.style.display = 'block';

  // Update Top Bar titles
  const titles = {
    overview: { title: 'System Overview', sub: 'Review metrics and manage all live portfolio content' },
    projects: { title: 'Projects & Case Studies', sub: 'Manage unlimited projects, rich case studies, and gallery media' },
    services: { title: 'Services & Capabilities', sub: 'Customize disciplines, deliverables, outcomes, and workflows' },
    skills: { title: 'Skills & Proficiencies', sub: 'Manage technical and creative skills, proficiencies, and categories' },
    experience: { title: 'Career & Experience Timeline', sub: 'Manage leadership positions, roles, and career milestones' },
    testimonials: { title: 'Client Endorsements', sub: 'Curate authentic testimonials and client details' },
    profile: { title: 'Profile, Bio & Resume', sub: 'Manage official portrait, CV/Resume PDF, bios, and contact links' },
    media: { title: 'Media Library', sub: 'Upload and organize images, videos, and PDF documents' },
    statistics: { title: 'Numbers & Proof Metrics', sub: 'Manage statistics displayed on public portfolio' },
    messages: { title: 'Visitor Inquiries', sub: 'Review contact inquiries submitted by clients and visitors' },
    settings: { title: 'Global Settings & Sections', sub: 'Control SEO meta tags, navigation links, and section controls' }
  };

  const info = titles[tabName] || { title: 'Dashboard', sub: '' };
  document.getElementById('panel-title').textContent = info.title;
  document.getElementById('panel-subtitle').textContent = info.sub;
}

// ==========================================================================
// 3. OVERVIEW MODULE
// ==========================================================================

async function loadOverview() {
  try {
    const res = await apiFetch('/api/admin/overview');
    if (res && res.success && res.data) {
      const d = res.data;
      document.getElementById('overview-projects-count').textContent = d.projectsCount;
      const pubElem = document.getElementById('overview-projects-published');
      const draftElem = document.getElementById('overview-projects-draft');
      if (pubElem) pubElem.textContent = d.publishedProjectsCount !== undefined ? d.publishedProjectsCount : d.projectsCount;
      if (draftElem) draftElem.textContent = d.draftProjectsCount !== undefined ? d.draftProjectsCount : 0;

      document.getElementById('overview-services-count').textContent = d.servicesCount;
      const skElem = document.getElementById('overview-skills-count');
      if (skElem) skElem.textContent = d.skillsCount !== undefined ? d.skillsCount : allSkillsData.length;
      const exElem = document.getElementById('overview-experience-count');
      if (exElem) exElem.textContent = d.experienceCount !== undefined ? d.experienceCount : allExperienceData.length;
      document.getElementById('overview-testimonials-count').textContent = d.testimonialsCount;
      const medElem = document.getElementById('overview-media-count');
      if (medElem) medElem.textContent = d.mediaCount !== undefined ? d.mediaCount : allMediaData.length;

      document.getElementById('overview-inquiries-count').textContent = d.unreadMessagesCount;

      const badge = document.getElementById('sidebar-inquiries-badge');
      if (badge) {
        if (d.unreadMessagesCount > 0) {
          badge.textContent = d.unreadMessagesCount;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch (err) {
    console.error('Error loading overview:', err);
  }
}

// ==========================================================================
// 4. PROJECTS MODULE (FULL CMS WITH CASE STUDY FIELDS & MULTI-IMAGE GALLERY)
// ==========================================================================

async function loadProjectsData() {
  try {
    const res = await apiFetch('/api/admin/projects');
    if (res && res.success && res.data) {
      allProjectsData = res.data;
      renderProjectsList(allProjectsData);
      loadOverview();
    }
  } catch (err) {
    console.error('Error loading projects:', err);
  }
}

function renderProjectsList(projects) {
  const container = document.getElementById('projects-list-container');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--admin-text-muted);">No projects yet. Click "Add Project" to create your first case study.</div>`;
    return;
  }

  container.innerHTML = projects.map((p, idx) => {
    const thumbHtml = p.cover_image && p.cover_image.trim() !== ''
      ? `<img src="${escapeHtml(p.cover_image)}" alt="${escapeHtml(p.title)}" class="item-thumb" />`
      : `<div class="item-thumb-placeholder">NO IMG</div>`;

    const statusPill = p.status === 'draft'
      ? `<span class="status-pill draft">Draft</span>`
      : p.status === 'hidden'
      ? `<span class="status-pill hidden">Hidden</span>`
      : `<span class="status-pill published">Published</span>`;

    const nextStatus = p.status === 'published' ? 'draft' : 'published';
    const statusLabel = p.status === 'published' ? 'Unpublish' : 'Publish';

    return `
      <div class="list-row-item" data-id="${p.id}">
        <div class="item-main-info">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <button class="btn-icon-logout" title="Move Up" onclick="reorderProject(${p.id}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
            <button class="btn-icon-logout" title="Move Down" onclick="reorderProject(${p.id}, 1)" ${idx === projects.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
          </div>
          ${thumbHtml}
          <div>
            <div class="item-title-text">
              ${escapeHtml(p.title)}
              ${p.is_featured ? '<span class="sidebar-badge" style="font-size:10px; margin-left:6px;">Featured</span>' : ''}
            </div>
            <div class="item-meta-text">
              ${escapeHtml(p.category)} • ${escapeHtml(p.year || '2025')}${p.client ? ` • Client: ${escapeHtml(p.client)}` : ''}
              <span style="opacity: 0.6; margin-left: 8px;">/work/${escapeHtml(p.slug || p.id)}</span>
            </div>
          </div>
        </div>

        <div class="item-actions-group">
          ${statusPill}
          <a href="/work/${escapeHtml(p.slug || p.id)}" target="_blank" class="admin-btn admin-btn-secondary admin-btn-sm" title="View Public Case Study">View ↗</a>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="duplicateProject(${p.id})">Duplicate</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="toggleProjectStatus(${p.id}, '${nextStatus}')">${statusLabel}</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openEditProjectModal(${p.id})">Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteProject(${p.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function setupProjectsModule() {
  document.getElementById('btn-add-project').addEventListener('click', openAddProjectModal);

  const dropzone = document.getElementById('project-image-dropzone');
  const fileInput = document.getElementById('project-file-input');
  const removeCoverBtn = document.getElementById('btn-remove-project-image');

  dropzone.addEventListener('click', (e) => {
    if (e.target !== removeCoverBtn) fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('file', file);
      showToast('Uploading cover image...', 'success');

      try {
        const uploadRes = await apiFetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        if (uploadRes && uploadRes.success) {
          setProjectCoverPreview(uploadRes.url);
          showToast('Cover image ready', 'success');
        }
      } catch (err) {
        showToast('Image upload failed', 'error');
      }
    }
  });

  removeCoverBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setProjectCoverPreview('');
  });

  // Gallery batch input
  const galleryBatchInput = document.getElementById('gallery-batch-input');
  if (galleryBatchInput) {
    galleryBatchInput.addEventListener('change', async () => {
      const currentId = document.getElementById('project-form-id').value;
      if (!currentId) {
        showToast('Please save project first to upload gallery images', 'warning');
        return;
      }
      await handleBatchGalleryUpload(currentId, galleryBatchInput.files);
    });
  }

  // Project form submit
  document.getElementById('project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('btn-save-project');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    const id = document.getElementById('project-form-id').value;
    const titleVal = document.getElementById('p-title').value.trim();
    let slugVal = document.getElementById('p-slug').value.trim();
    if (!slugVal) {
      slugVal = titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const payload = {
      title: titleVal,
      slug: slugVal,
      category: document.getElementById('p-category').value.trim(),
      client: document.getElementById('p-client').value.trim(),
      industry: document.getElementById('p-industry').value.trim(),
      year: document.getElementById('p-year').value.trim(),
      duration: document.getElementById('p-duration').value.trim(),
      role: document.getElementById('p-role').value.trim(),
      team: document.getElementById('p-team').value.trim(),
      services_used: document.getElementById('p-services-used').value.trim(),
      technologies: document.getElementById('p-technologies').value.trim(),
      skills: document.getElementById('p-skills').value.trim(),
      project_url: document.getElementById('p-url').value.trim(),
      video_url: document.getElementById('p-video-url').value.trim(),
      tags: document.getElementById('p-tags').value.trim(),
      short_desc: document.getElementById('p-short-desc').value.trim(),
      full_desc: document.getElementById('p-full-desc').value.trim(),
      challenge: document.getElementById('p-challenge').value.trim(),
      objective: document.getElementById('p-objective').value.trim(),
      strategy: document.getElementById('p-strategy').value.trim(),
      process: document.getElementById('p-process').value.trim(),
      solution: document.getElementById('p-solution').value.trim(),
      results: document.getElementById('p-results').value.trim(),
      highlights: document.getElementById('p-highlights').value.trim(),
      cover_image: document.getElementById('p-cover-image').value,
      status: document.getElementById('p-status').value,
      sort_order: Number(document.getElementById('p-sort-order').value) || 0,
      is_featured: document.getElementById('p-featured').checked ? 1 : 0
    };

    try {
      if (id) {
        await apiFetch(`/api/admin/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Project updated successfully', 'success');
        closeModal('modal-project');
        loadProjectsData();
      } else {
        const createRes = await apiFetch('/api/admin/projects', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Project created successfully', 'success');
        closeModal('modal-project');
        loadProjectsData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Project';
      }
    }
  });
}

function openAddProjectModal() {
  document.getElementById('modal-project-title').textContent = 'Add New Project';
  document.getElementById('project-form-id').value = '';
  document.getElementById('p-title').value = '';
  document.getElementById('p-slug').value = '';
  document.getElementById('p-category').value = '';
  document.getElementById('p-client').value = '';
  document.getElementById('p-industry').value = '';
  document.getElementById('p-year').value = new Date().getFullYear();
  document.getElementById('p-duration').value = '';
  document.getElementById('p-role').value = '';
  document.getElementById('p-team').value = '';
  document.getElementById('p-services-used').value = '';
  document.getElementById('p-technologies').value = '';
  document.getElementById('p-skills').value = '';
  document.getElementById('p-url').value = '';
  document.getElementById('p-video-url').value = '';
  document.getElementById('p-tags').value = '';
  document.getElementById('p-short-desc').value = '';
  document.getElementById('p-full-desc').value = '';
  document.getElementById('p-challenge').value = '';
  document.getElementById('p-objective').value = '';
  document.getElementById('p-strategy').value = '';
  document.getElementById('p-process').value = '';
  document.getElementById('p-solution').value = '';
  document.getElementById('p-results').value = '';
  document.getElementById('p-highlights').value = '';
  document.getElementById('p-status').value = 'published';
  document.getElementById('p-sort-order').value = allProjectsData.length + 1;
  document.getElementById('p-featured').checked = false;
  setProjectCoverPreview('');
  renderProjectGallery(null, [], '');
  openModal('modal-project');
}

function openEditProjectModal(id) {
  const p = allProjectsData.find(item => item.id === id);
  if (!p) return;

  document.getElementById('modal-project-title').textContent = 'Edit Project: ' + (p.title || '');
  document.getElementById('project-form-id').value = p.id;
  document.getElementById('p-title').value = p.title || '';
  document.getElementById('p-slug').value = p.slug || '';
  document.getElementById('p-category').value = p.category || '';
  document.getElementById('p-client').value = p.client || '';
  document.getElementById('p-industry').value = p.industry || '';
  document.getElementById('p-year').value = p.year || '';
  document.getElementById('p-duration').value = p.duration || '';
  document.getElementById('p-role').value = p.role || '';
  document.getElementById('p-team').value = p.team || '';
  document.getElementById('p-services-used').value = p.services_used || '';
  document.getElementById('p-technologies').value = p.technologies || '';
  document.getElementById('p-skills').value = p.skills || '';
  document.getElementById('p-url').value = p.project_url || '';
  document.getElementById('p-video-url').value = p.video_url || '';
  document.getElementById('p-tags').value = p.tags || '';
  document.getElementById('p-short-desc').value = p.short_desc || '';
  document.getElementById('p-full-desc').value = p.full_desc || '';
  document.getElementById('p-challenge').value = p.challenge || '';
  document.getElementById('p-objective').value = p.objective || '';
  document.getElementById('p-strategy').value = p.strategy || '';
  document.getElementById('p-process').value = p.process || '';
  document.getElementById('p-solution').value = p.solution || '';
  document.getElementById('p-results').value = p.results || '';
  document.getElementById('p-highlights').value = p.highlights || '';
  document.getElementById('p-status').value = p.status || 'published';
  document.getElementById('p-sort-order').value = p.sort_order || 0;
  document.getElementById('p-featured').checked = !!p.is_featured;
  setProjectCoverPreview(p.cover_image || '');
  renderProjectGallery(p.id, p.gallery || [], p.cover_image || '');
  openModal('modal-project');
}

function setProjectCoverPreview(url) {
  const previewWrap = document.getElementById('project-image-preview-wrap');
  const previewImg = document.getElementById('project-image-preview');
  const prompt = document.getElementById('project-upload-prompt');
  const hiddenInput = document.getElementById('p-cover-image');

  hiddenInput.value = url || '';

  if (url && url.trim() !== '') {
    previewImg.src = url;
    previewWrap.style.display = 'block';
    prompt.style.display = 'none';
  } else {
    previewImg.src = '';
    previewWrap.style.display = 'none';
    prompt.style.display = 'block';
  }
}

async function handleBatchGalleryUpload(projectId, files) {
  if (!files || files.length === 0) return;
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }

  showToast(`Uploading ${files.length} image(s)...`, 'success');

  try {
    const res = await apiFetch(`/api/admin/projects/${projectId}/images`, {
      method: 'POST',
      body: formData
    });

    if (res && res.success) {
      showToast(`Uploaded ${files.length} image(s)`, 'success');
      await loadProjectsData();
      const updated = allProjectsData.find(p => p.id === Number(projectId));
      if (updated) {
        renderProjectGallery(updated.id, updated.gallery || [], updated.cover_image);
        if (updated.cover_image) setProjectCoverPreview(updated.cover_image);
      }
      const batchInput = document.getElementById('gallery-batch-input');
      if (batchInput) batchInput.value = '';
    }
  } catch (err) {
    showToast(err.message || 'Gallery upload failed', 'error');
  }
}

function renderProjectGallery(projectId, gallery, coverImage) {
  const grid = document.getElementById('project-gallery-grid');
  const countBadge = document.getElementById('p-gallery-count-badge');
  const unsavedNotice = document.getElementById('gallery-unsaved-notice');

  if (!grid) return;

  if (!projectId) {
    if (unsavedNotice) unsavedNotice.style.display = 'block';
    if (countBadge) countBadge.textContent = '0 Images';
    grid.innerHTML = '';
    return;
  }

  if (unsavedNotice) unsavedNotice.style.display = 'none';
  if (countBadge) countBadge.textContent = `${gallery.length} Images`;

  if (!gallery || gallery.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--admin-text-muted); font-size: 13px;">No gallery images yet. Select or drop images above to add to this project.</div>`;
    return;
  }

  grid.innerHTML = gallery.map((img, idx) => {
    const isCover = coverImage && coverImage === img.image_url;
    return `
      <div class="gallery-admin-card ${isCover ? 'is-cover' : ''}" data-image-id="${img.id}">
        <div class="gallery-thumb-wrap">
          <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.alt_text || 'Gallery image')}" class="gallery-thumb-img" />
          ${isCover ? '<span class="cover-badge-pill">Cover</span>' : ''}
        </div>
        <div class="gallery-card-controls">
          <div class="gallery-card-inputs">
            <input type="text" class="gallery-input-sm" placeholder="Caption (optional)" value="${escapeHtml(img.caption || '')}" onchange="updateGalleryImageDetails(${img.id}, this.value, this.nextElementSibling.value)" />
            <input type="text" class="gallery-input-sm" placeholder="Alt text / description" value="${escapeHtml(img.alt_text || '')}" onchange="updateGalleryImageDetails(${img.id}, this.previousElementSibling.value, this.value)" />
          </div>
          <div class="gallery-card-actions">
            <div style="display: flex; gap: 4px;">
              <button type="button" class="btn-icon-xs" title="Move Up" onclick="reorderGalleryImage(${projectId}, ${img.id}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
              <button type="button" class="btn-icon-xs" title="Move Down" onclick="reorderGalleryImage(${projectId}, ${img.id}, 1)" ${idx === gallery.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
            </div>
            <div style="display: flex; gap: 4px;">
              ${!isCover ? `<button type="button" class="btn-icon-xs" title="Set as Project Cover" onclick="setProjectCoverFromGallery(${projectId}, '${escapeHtml(img.image_url)}')">★ Cover</button>` : ''}
              <button type="button" class="btn-icon-xs" style="color: var(--admin-danger);" title="Delete Image" onclick="deleteGalleryImage(${projectId}, ${img.id})">✕</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function reorderGalleryImage(projectId, imgId, direction) {
  const p = allProjectsData.find(item => item.id === Number(projectId));
  if (!p || !p.gallery) return;

  const index = p.gallery.findIndex(g => g.id === Number(imgId));
  if (index < 0) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= p.gallery.length) return;

  const reordered = [...p.gallery];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  const orderedImageIds = reordered.map(img => img.id);
  try {
    await apiFetch(`/api/admin/projects/${projectId}/images/reorder`, {
      method: 'POST',
      body: JSON.stringify({ orderedImageIds })
    });
    p.gallery = reordered;
    renderProjectGallery(projectId, p.gallery, p.cover_image);
  } catch (err) {
    showToast('Failed to reorder images', 'error');
  }
}

async function setProjectCoverFromGallery(projectId, imageUrl) {
  try {
    await apiFetch(`/api/admin/projects/${projectId}/set-cover`, {
      method: 'POST',
      body: JSON.stringify({ image_url: imageUrl })
    });
    setProjectCoverPreview(imageUrl);
    const p = allProjectsData.find(item => item.id === Number(projectId));
    if (p) p.cover_image = imageUrl;
    renderProjectGallery(projectId, p?.gallery || [], imageUrl);
    showToast('Project cover updated', 'success');
    loadProjectsData();
  } catch (err) {
    showToast('Failed to set cover image', 'error');
  }
}

async function deleteGalleryImage(projectId, imageId) {
  if (!confirm('Remove this image from the gallery?')) return;
  try {
    await apiFetch(`/api/admin/project-images/${imageId}`, { method: 'DELETE' });
    showToast('Image removed from gallery', 'success');
    await loadProjectsData();
    const p = allProjectsData.find(item => item.id === Number(projectId));
    if (p) renderProjectGallery(projectId, p.gallery || [], p.cover_image);
  } catch (err) {
    showToast('Failed to delete image', 'error');
  }
}

async function updateGalleryImageDetails(imageId, caption, altText) {
  try {
    await apiFetch(`/api/admin/project-images/${imageId}`, {
      method: 'PUT',
      body: JSON.stringify({ caption, alt_text: altText })
    });
  } catch (err) {
    console.warn('Failed to auto-save image details:', err);
  }
}

async function duplicateProject(id) {
  try {
    showToast('Duplicating project...', 'success');
    const res = await apiFetch(`/api/admin/projects/${id}/duplicate`, { method: 'POST' });
    if (res && res.success) {
      showToast('Project duplicated successfully', 'success');
      loadProjectsData();
    }
  } catch (err) {
    showToast(err.message || 'Failed to duplicate project', 'error');
  }
}

async function toggleProjectStatus(id, status) {
  try {
    await apiFetch(`/api/admin/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    showToast(`Project marked as ${status}`, 'success');
    loadProjectsData();
  } catch (err) {
    showToast('Failed to update project status', 'error');
  }
}

async function deleteProject(id) {
  if (!confirm('Are you sure you want to permanently delete this project?')) return;
  try {
    await apiFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
    showToast('Project deleted', 'success');
    loadProjectsData();
  } catch (err) {
    showToast('Failed to delete project', 'error');
  }
}

async function reorderProject(id, direction) {
  const index = allProjectsData.findIndex(p => p.id === id);
  if (index < 0) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= allProjectsData.length) return;

  const reordered = [...allProjectsData];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  const orderedIds = reordered.map(p => p.id);
  try {
    await apiFetch('/api/admin/projects/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    });
    allProjectsData = reordered;
    renderProjectsList(allProjectsData);
  } catch (err) {
    showToast('Failed to reorder projects', 'error');
  }
}

// ==========================================================================
// 5. SERVICES MODULE
// ==========================================================================

async function loadServicesData() {
  try {
    const res = await apiFetch('/api/admin/services');
    if (res && res.success && res.data) {
      allServicesData = res.data;
      renderServicesList(allServicesData);
      loadOverview();
    }
  } catch (err) {
    console.error('Error loading services:', err);
  }
}

function renderServicesList(services) {
  const container = document.getElementById('services-list-container');
  if (!container) return;

  if (services.length === 0) {
    container.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--admin-text-muted);">No services created yet. Click "Add Service" to create one.</div>`;
    return;
  }

  container.innerHTML = services.map((s, idx) => {
    const statusPill = s.status === 'draft'
      ? `<span class="status-pill draft">Draft</span>`
      : `<span class="status-pill published">Published</span>`;

    const nextStatus = s.status === 'published' ? 'draft' : 'published';
    const statusLabel = s.status === 'published' ? 'Unpublish' : 'Publish';

    return `
      <div class="list-row-item" data-id="${s.id}">
        <div class="item-main-info">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <button class="btn-icon-logout" title="Move Up" onclick="reorderService(${s.id}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
            <button class="btn-icon-logout" title="Move Down" onclick="reorderService(${s.id}, 1)" ${idx === services.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
          </div>
          <div>
            <div class="item-title-text">${escapeHtml(s.title)} <span style="font-size: 11px; color: var(--admin-text-muted); margin-left: 6px;">[${escapeHtml(s.category || 'General')}]</span></div>
            <div class="item-meta-text">${escapeHtml(s.short_desc)}</div>
          </div>
        </div>

        <div class="item-actions-group">
          ${statusPill}
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="duplicateService(${s.id})">Duplicate</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="toggleServiceStatus(${s.id}, '${nextStatus}')">${statusLabel}</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openEditServiceModal(${s.id})">Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteService(${s.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function setupServicesModule() {
  document.getElementById('btn-add-service').addEventListener('click', openAddServiceModal);

  document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('service-form-id').value;
    const title = document.getElementById('s-title').value.trim();
    const payload = {
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category: document.getElementById('s-category').value.trim(),
      icon_name: document.getElementById('s-icon').value.trim(),
      short_desc: document.getElementById('s-short-desc').value.trim(),
      full_desc: document.getElementById('s-full-desc').value.trim(),
      deliverables: document.getElementById('s-deliverables').value.trim(),
      outcomes: document.getElementById('s-outcomes').value.trim(),
      status: document.getElementById('s-status').value,
      sort_order: Number(document.getElementById('s-sort-order').value) || 0
    };

    try {
      if (id) {
        await apiFetch(`/api/admin/services/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Service updated', 'success');
      } else {
        await apiFetch('/api/admin/services', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Service created', 'success');
      }
      closeModal('modal-service');
      loadServicesData();
    } catch (err) {
      showToast(err.message || 'Failed to save service', 'error');
    }
  });
}

function openAddServiceModal() {
  document.getElementById('modal-service-title').textContent = 'Add Service';
  document.getElementById('service-form-id').value = '';
  document.getElementById('s-title').value = '';
  document.getElementById('s-category').value = 'Design & Direction';
  document.getElementById('s-icon').value = 'sparkles';
  document.getElementById('s-short-desc').value = '';
  document.getElementById('s-full-desc').value = '';
  document.getElementById('s-deliverables').value = '';
  document.getElementById('s-outcomes').value = '';
  document.getElementById('s-status').value = 'published';
  document.getElementById('s-sort-order').value = allServicesData.length + 1;
  openModal('modal-service');
}

function openEditServiceModal(id) {
  const s = allServicesData.find(item => item.id === id);
  if (!s) return;

  document.getElementById('modal-service-title').textContent = 'Edit Service';
  document.getElementById('service-form-id').value = s.id;
  document.getElementById('s-title').value = s.title || '';
  document.getElementById('s-category').value = s.category || '';
  document.getElementById('s-icon').value = s.icon_name || '';
  document.getElementById('s-short-desc').value = s.short_desc || '';
  document.getElementById('s-full-desc').value = s.full_desc || '';
  document.getElementById('s-deliverables').value = s.deliverables || '';
  document.getElementById('s-outcomes').value = s.outcomes || '';
  document.getElementById('s-status').value = s.status || 'published';
  document.getElementById('s-sort-order').value = s.sort_order || 0;
  openModal('modal-service');
}

async function duplicateService(id) {
  try {
    showToast('Duplicating service...', 'success');
    const res = await apiFetch(`/api/admin/services/${id}/duplicate`, { method: 'POST' });
    if (res && res.success) {
      showToast('Service duplicated', 'success');
      loadServicesData();
    }
  } catch (err) {
    showToast(err.message || 'Failed to duplicate service', 'error');
  }
}

async function toggleServiceStatus(id, status) {
  try {
    await apiFetch(`/api/admin/services/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    showToast(`Service set to ${status}`, 'success');
    loadServicesData();
  } catch (err) {
    showToast('Failed to update service status', 'error');
  }
}

async function deleteService(id) {
  if (!confirm('Permanently delete this service?')) return;
  try {
    await apiFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    showToast('Service deleted', 'success');
    loadServicesData();
  } catch (err) {
    showToast('Failed to delete service', 'error');
  }
}

async function reorderService(id, direction) {
  const index = allServicesData.findIndex(s => s.id === id);
  if (index < 0) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= allServicesData.length) return;

  const reordered = [...allServicesData];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  const orderedIds = reordered.map(s => s.id);
  try {
    await apiFetch('/api/admin/services/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    });
    allServicesData = reordered;
    renderServicesList(allServicesData);
  } catch (err) {
    showToast('Failed to reorder services', 'error');
  }
}

// ==========================================================================
// 6. SKILLS CMS MODULE
// ==========================================================================

async function loadSkillsData() {
  try {
    const res = await apiFetch('/api/admin/skills');
    if (res && res.success && res.data) {
      allSkillsData = res.data;
      renderSkillsList(allSkillsData);
      loadOverview();
    }
  } catch (err) {
    console.error('Error loading skills:', err);
  }
}

function renderSkillsList(skills) {
  const container = document.getElementById('skills-list-container');
  if (!container) return;

  if (skills.length === 0) {
    container.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--admin-text-muted);">No skills recorded yet. Click "Add Skill" to create one.</div>`;
    return;
  }

  container.innerHTML = skills.map((sk, idx) => {
    const statusPill = sk.status === 'draft'
      ? `<span class="status-pill draft">Draft</span>`
      : `<span class="status-pill published">Published</span>`;

    const nextStatus = sk.status === 'published' ? 'draft' : 'published';
    const statusLabel = sk.status === 'published' ? 'Unpublish' : 'Publish';

    return `
      <div class="list-row-item" data-id="${sk.id}">
        <div class="item-main-info">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <button class="btn-icon-logout" title="Move Up" onclick="reorderSkill(${sk.id}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
            <button class="btn-icon-logout" title="Move Down" onclick="reorderSkill(${sk.id}, 1)" ${idx === skills.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
          </div>
          <div>
            <div class="item-title-text">
              ${escapeHtml(sk.name)}
              <span class="skill-category-badge" style="margin-left: 8px;">${escapeHtml(sk.category)}</span>
            </div>
            <div class="item-meta-text">
              Proficiency: ${escapeHtml(sk.proficiency || '90%')}
              ${sk.description ? ` • ${escapeHtml(sk.description)}` : ''}
            </div>
          </div>
        </div>

        <div class="item-actions-group">
          ${statusPill}
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="duplicateSkill(${sk.id})">Duplicate</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="toggleSkillStatus(${sk.id}, '${nextStatus}')">${statusLabel}</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openEditSkillModal(${sk.id})">Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteSkill(${sk.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function setupSkillsModule() {
  document.getElementById('btn-add-skill').addEventListener('click', openAddSkillModal);

  document.getElementById('skill-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('skill-form-id').value;
    const payload = {
      name: document.getElementById('sk-name').value.trim(),
      category: document.getElementById('sk-category').value.trim(),
      proficiency: document.getElementById('sk-proficiency').value.trim() || '90%',
      description: document.getElementById('sk-desc').value.trim(),
      related_services: document.getElementById('sk-related').value.trim(),
      status: document.getElementById('sk-status').value,
      sort_order: Number(document.getElementById('sk-sort-order').value) || 0
    };

    try {
      if (id) {
        await apiFetch(`/api/admin/skills/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Skill updated', 'success');
      } else {
        await apiFetch('/api/admin/skills', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Skill created', 'success');
      }
      closeModal('modal-skill');
      loadSkillsData();
    } catch (err) {
      showToast(err.message || 'Failed to save skill', 'error');
    }
  });
}

function openAddSkillModal() {
  document.getElementById('modal-skill-title').textContent = 'Add Skill';
  document.getElementById('skill-form-id').value = '';
  document.getElementById('sk-name').value = '';
  document.getElementById('sk-category').value = 'Design Systems';
  document.getElementById('sk-proficiency').value = '95%';
  document.getElementById('sk-desc').value = '';
  document.getElementById('sk-related').value = '';
  document.getElementById('sk-status').value = 'published';
  document.getElementById('sk-sort-order').value = allSkillsData.length + 1;
  openModal('modal-skill');
}

function openEditSkillModal(id) {
  const sk = allSkillsData.find(item => item.id === id);
  if (!sk) return;

  document.getElementById('modal-skill-title').textContent = 'Edit Skill';
  document.getElementById('skill-form-id').value = sk.id;
  document.getElementById('sk-name').value = sk.name || '';
  document.getElementById('sk-category').value = sk.category || '';
  document.getElementById('sk-proficiency').value = sk.proficiency || '';
  document.getElementById('sk-desc').value = sk.description || '';
  document.getElementById('sk-related').value = sk.related_services || '';
  document.getElementById('sk-status').value = sk.status || 'published';
  document.getElementById('sk-sort-order').value = sk.sort_order || 0;
  openModal('modal-skill');
}

async function duplicateSkill(id) {
  try {
    showToast('Duplicating skill...', 'success');
    const res = await apiFetch(`/api/admin/skills/${id}/duplicate`, { method: 'POST' });
    if (res && res.success) {
      showToast('Skill duplicated', 'success');
      loadSkillsData();
    }
  } catch (err) {
    showToast(err.message || 'Failed to duplicate skill', 'error');
  }
}

async function toggleSkillStatus(id, status) {
  try {
    await apiFetch(`/api/admin/skills/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    showToast(`Skill set to ${status}`, 'success');
    loadSkillsData();
  } catch (err) {
    showToast('Failed to update skill status', 'error');
  }
}

async function deleteSkill(id) {
  if (!confirm('Delete this skill?')) return;
  try {
    await apiFetch(`/api/admin/skills/${id}`, { method: 'DELETE' });
    showToast('Skill deleted', 'success');
    loadSkillsData();
  } catch (err) {
    showToast('Failed to delete skill', 'error');
  }
}

async function reorderSkill(id, direction) {
  const index = allSkillsData.findIndex(s => s.id === id);
  if (index < 0) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= allSkillsData.length) return;

  const reordered = [...allSkillsData];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  const orderedIds = reordered.map(s => s.id);
  try {
    await apiFetch('/api/admin/skills/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    });
    allSkillsData = reordered;
    renderSkillsList(allSkillsData);
  } catch (err) {
    showToast('Failed to reorder skills', 'error');
  }
}

// ==========================================================================
// 7. EXPERIENCE CMS MODULE
// ==========================================================================

async function loadExperienceData() {
  try {
    const res = await apiFetch('/api/admin/experience');
    if (res && res.success && res.data) {
      allExperienceData = res.data;
      renderExperienceList(allExperienceData);
      loadOverview();
    }
  } catch (err) {
    console.error('Error loading experience:', err);
  }
}

function renderExperienceList(experience) {
  const container = document.getElementById('experience-list-container');
  if (!container) return;

  if (experience.length === 0) {
    container.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--admin-text-muted);">No career milestones recorded yet. Click "Add Experience" to add one.</div>`;
    return;
  }

  container.innerHTML = experience.map((ex, idx) => {
    const statusPill = ex.status === 'draft'
      ? `<span class="status-pill draft">Draft</span>`
      : `<span class="status-pill published">Published</span>`;

    const nextStatus = ex.status === 'published' ? 'draft' : 'published';
    const statusLabel = ex.status === 'published' ? 'Unpublish' : 'Publish';
    const dates = ex.is_current ? `${escapeHtml(ex.start_date)} — Present` : `${escapeHtml(ex.start_date)}${ex.end_date ? ` — ${escapeHtml(ex.end_date)}` : ''}`;

    return `
      <div class="list-row-item" data-id="${ex.id}">
        <div class="item-main-info">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <button class="btn-icon-logout" title="Move Up" onclick="reorderExperience(${ex.id}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
            <button class="btn-icon-logout" title="Move Down" onclick="reorderExperience(${ex.id}, 1)" ${idx === experience.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
          </div>
          <div>
            <div class="item-title-text">${escapeHtml(ex.role)} <span style="font-weight: 400; color: var(--admin-text-secondary);">at ${escapeHtml(ex.company)}</span></div>
            <div class="item-meta-text">${escapeHtml(dates)}${ex.location ? ` • ${escapeHtml(ex.location)}` : ''}</div>
          </div>
        </div>

        <div class="item-actions-group">
          ${statusPill}
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="duplicateExperience(${ex.id})">Duplicate</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="toggleExperienceStatus(${ex.id}, '${nextStatus}')">${statusLabel}</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openEditExperienceModal(${ex.id})">Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteExperience(${ex.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function setupExperienceModule() {
  document.getElementById('btn-add-experience').addEventListener('click', openAddExperienceModal);

  document.getElementById('experience-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('experience-form-id').value;
    const payload = {
      company: document.getElementById('ex-company').value.trim(),
      role: document.getElementById('ex-role').value.trim(),
      start_date: document.getElementById('ex-start-date').value.trim(),
      end_date: document.getElementById('ex-end-date').value.trim(),
      is_current: document.getElementById('ex-is-current').checked ? 1 : 0,
      location: document.getElementById('ex-location').value.trim(),
      description: document.getElementById('ex-desc').value.trim(),
      responsibilities: document.getElementById('ex-responsibilities').value.trim(),
      technologies: document.getElementById('ex-technologies').value.trim(),
      status: document.getElementById('ex-status').value,
      sort_order: Number(document.getElementById('ex-sort-order').value) || 0
    };

    try {
      if (id) {
        await apiFetch(`/api/admin/experience/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Experience updated', 'success');
      } else {
        await apiFetch('/api/admin/experience', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Experience milestone added', 'success');
      }
      closeModal('modal-experience');
      loadExperienceData();
    } catch (err) {
      showToast(err.message || 'Failed to save experience', 'error');
    }
  });
}

function openAddExperienceModal() {
  document.getElementById('modal-experience-title').textContent = 'Add Career Milestone';
  document.getElementById('experience-form-id').value = '';
  document.getElementById('ex-company').value = '';
  document.getElementById('ex-role').value = '';
  document.getElementById('ex-start-date').value = '2022';
  document.getElementById('ex-end-date').value = '';
  document.getElementById('ex-is-current').checked = true;
  document.getElementById('ex-location').value = 'Remote';
  document.getElementById('ex-desc').value = '';
  document.getElementById('ex-responsibilities').value = '';
  document.getElementById('ex-technologies').value = '';
  document.getElementById('ex-status').value = 'published';
  document.getElementById('ex-sort-order').value = allExperienceData.length + 1;
  openModal('modal-experience');
}

function openEditExperienceModal(id) {
  const ex = allExperienceData.find(item => item.id === id);
  if (!ex) return;

  document.getElementById('modal-experience-title').textContent = 'Edit Career Milestone';
  document.getElementById('experience-form-id').value = ex.id;
  document.getElementById('ex-company').value = ex.company || '';
  document.getElementById('ex-role').value = ex.role || '';
  document.getElementById('ex-start-date').value = ex.start_date || '';
  document.getElementById('ex-end-date').value = ex.end_date || '';
  document.getElementById('ex-is-current').checked = !!ex.is_current;
  document.getElementById('ex-location').value = ex.location || '';
  document.getElementById('ex-desc').value = ex.description || '';
  document.getElementById('ex-responsibilities').value = ex.responsibilities || '';
  document.getElementById('ex-technologies').value = ex.technologies || '';
  document.getElementById('ex-status').value = ex.status || 'published';
  document.getElementById('ex-sort-order').value = ex.sort_order || 0;
  openModal('modal-experience');
}

async function duplicateExperience(id) {
  try {
    showToast('Duplicating milestone...', 'success');
    const res = await apiFetch(`/api/admin/experience/${id}/duplicate`, { method: 'POST' });
    if (res && res.success) {
      showToast('Experience duplicated', 'success');
      loadExperienceData();
    }
  } catch (err) {
    showToast(err.message || 'Failed to duplicate experience', 'error');
  }
}

async function toggleExperienceStatus(id, status) {
  try {
    await apiFetch(`/api/admin/experience/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    showToast(`Experience set to ${status}`, 'success');
    loadExperienceData();
  } catch (err) {
    showToast('Failed to update experience status', 'error');
  }
}

async function deleteExperience(id) {
  if (!confirm('Delete this career milestone?')) return;
  try {
    await apiFetch(`/api/admin/experience/${id}`, { method: 'DELETE' });
    showToast('Experience milestone deleted', 'success');
    loadExperienceData();
  } catch (err) {
    showToast('Failed to delete experience', 'error');
  }
}

async function reorderExperience(id, direction) {
  const index = allExperienceData.findIndex(e => e.id === id);
  if (index < 0) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= allExperienceData.length) return;

  const reordered = [...allExperienceData];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  const orderedIds = reordered.map(e => e.id);
  try {
    await apiFetch('/api/admin/experience/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    });
    allExperienceData = reordered;
    renderExperienceList(allExperienceData);
  } catch (err) {
    showToast('Failed to reorder experience', 'error');
  }
}

// ==========================================================================
// 8. TESTIMONIALS MODULE
// ==========================================================================

async function loadTestimonialsData() {
  try {
    const res = await apiFetch('/api/admin/testimonials');
    if (res && res.success && res.data) {
      allTestimonialsData = res.data;
      renderTestimonialsList(allTestimonialsData);
      loadOverview();
    }
  } catch (err) {
    console.error('Error loading testimonials:', err);
  }
}

function renderTestimonialsList(testimonials) {
  const container = document.getElementById('testimonials-list-container');
  if (!container) return;

  if (testimonials.length === 0) {
    container.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--admin-text-muted);">No testimonials recorded yet.</div>`;
    return;
  }

  container.innerHTML = testimonials.map((t, idx) => {
    const avatarHtml = t.avatar_url && t.avatar_url.trim() !== ''
      ? `<img src="${escapeHtml(t.avatar_url)}" alt="${escapeHtml(t.client_name)}" class="item-thumb" style="border-radius: 50%;" />`
      : `<div class="item-thumb-placeholder" style="border-radius: 50%;">${escapeHtml(t.client_name.charAt(0))}</div>`;

    const statusPill = t.status === 'draft'
      ? `<span class="status-pill draft">Draft</span>`
      : `<span class="status-pill published">Published</span>`;

    const nextStatus = t.status === 'published' ? 'draft' : 'published';
    const statusLabel = t.status === 'published' ? 'Unpublish' : 'Publish';

    return `
      <div class="list-row-item" data-id="${t.id}">
        <div class="item-main-info">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <button class="btn-icon-logout" title="Move Up" onclick="reorderTestimonial(${t.id}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
            <button class="btn-icon-logout" title="Move Down" onclick="reorderTestimonial(${t.id}, 1)" ${idx === testimonials.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
          </div>
          ${avatarHtml}
          <div>
            <div class="item-title-text">${escapeHtml(t.client_name)} <span style="font-size: 11px; color: var(--admin-text-muted);">(${escapeHtml(t.company || t.client_role || '')})</span></div>
            <div class="item-meta-text">"${escapeHtml(t.testimonial_text.substring(0, 75))}..."</div>
          </div>
        </div>

        <div class="item-actions-group">
          ${statusPill}
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="duplicateTestimonial(${t.id})">Duplicate</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="toggleTestimonialStatus(${t.id}, '${nextStatus}')">${statusLabel}</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openEditTestimonialModal(${t.id})">Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteTestimonial(${t.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function setupTestimonialsModule() {
  document.getElementById('btn-add-testimonial').addEventListener('click', openAddTestimonialModal);

  const dropzone = document.getElementById('testimonial-avatar-dropzone');
  const fileInput = document.getElementById('testimonial-file-input');
  const removeBtn = document.getElementById('btn-remove-t-avatar');

  dropzone.addEventListener('click', (e) => {
    if (e.target !== removeBtn) fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files[0]) {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      showToast('Uploading avatar...', 'success');
      try {
        const uploadRes = await apiFetch('/api/admin/upload', { method: 'POST', body: formData });
        if (uploadRes && uploadRes.success) {
          setTestimonialAvatarPreview(uploadRes.url);
          showToast('Avatar ready', 'success');
        }
      } catch (err) {
        showToast('Avatar upload failed', 'error');
      }
    }
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setTestimonialAvatarPreview('');
  });

  document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('testimonial-form-id').value;
    const payload = {
      client_name: document.getElementById('t-name').value.trim(),
      client_role: document.getElementById('t-role').value.trim(),
      company: document.getElementById('t-company').value.trim(),
      testimonial_text: document.getElementById('t-text').value.trim(),
      avatar_url: document.getElementById('t-avatar').value,
      status: document.getElementById('t-status').value,
      sort_order: Number(document.getElementById('t-sort-order').value) || 0
    };

    try {
      if (id) {
        await apiFetch(`/api/admin/testimonials/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Testimonial updated', 'success');
      } else {
        await apiFetch('/api/admin/testimonials', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Testimonial added', 'success');
      }
      closeModal('modal-testimonial');
      loadTestimonialsData();
    } catch (err) {
      showToast(err.message || 'Failed to save testimonial', 'error');
    }
  });
}

function setTestimonialAvatarPreview(url) {
  const wrap = document.getElementById('t-avatar-preview-wrap');
  const img = document.getElementById('t-avatar-preview');
  const prompt = document.getElementById('t-upload-prompt');
  const hidden = document.getElementById('t-avatar');

  hidden.value = url || '';
  if (url) {
    img.src = url;
    wrap.style.display = 'block';
    prompt.style.display = 'none';
  } else {
    img.src = '';
    wrap.style.display = 'none';
    prompt.style.display = 'block';
  }
}

function openAddTestimonialModal() {
  document.getElementById('modal-testimonial-title').textContent = 'Add Testimonial';
  document.getElementById('testimonial-form-id').value = '';
  document.getElementById('t-name').value = '';
  document.getElementById('t-role').value = '';
  document.getElementById('t-company').value = '';
  document.getElementById('t-text').value = '';
  document.getElementById('t-status').value = 'published';
  document.getElementById('t-sort-order').value = allTestimonialsData.length + 1;
  setTestimonialAvatarPreview('');
  openModal('modal-testimonial');
}

function openEditTestimonialModal(id) {
  const t = allTestimonialsData.find(item => item.id === id);
  if (!t) return;

  document.getElementById('modal-testimonial-title').textContent = 'Edit Testimonial';
  document.getElementById('testimonial-form-id').value = t.id;
  document.getElementById('t-name').value = t.client_name || '';
  document.getElementById('t-role').value = t.client_role || '';
  document.getElementById('t-company').value = t.company || '';
  document.getElementById('t-text').value = t.testimonial_text || '';
  document.getElementById('t-status').value = t.status || 'published';
  document.getElementById('t-sort-order').value = t.sort_order || 0;
  setTestimonialAvatarPreview(t.avatar_url || '');
  openModal('modal-testimonial');
}

async function duplicateTestimonial(id) {
  try {
    showToast('Duplicating testimonial...', 'success');
    const res = await apiFetch(`/api/admin/testimonials/${id}/duplicate`, { method: 'POST' });
    if (res && res.success) {
      showToast('Testimonial duplicated', 'success');
      loadTestimonialsData();
    }
  } catch (err) {
    showToast(err.message || 'Failed to duplicate testimonial', 'error');
  }
}

async function toggleTestimonialStatus(id, status) {
  try {
    await apiFetch(`/api/admin/testimonials/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    showToast(`Testimonial set to ${status}`, 'success');
    loadTestimonialsData();
  } catch (err) {
    showToast('Failed to update status', 'error');
  }
}

async function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    await apiFetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
    showToast('Testimonial deleted', 'success');
    loadTestimonialsData();
  } catch (err) {
    showToast('Failed to delete testimonial', 'error');
  }
}

async function reorderTestimonial(id, direction) {
  const index = allTestimonialsData.findIndex(t => t.id === id);
  if (index < 0) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= allTestimonialsData.length) return;

  const reordered = [...allTestimonialsData];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  const orderedIds = reordered.map(t => t.id);
  try {
    await apiFetch('/api/admin/testimonials/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    });
    allTestimonialsData = reordered;
    renderTestimonialsList(allTestimonialsData);
  } catch (err) {
    showToast('Failed to reorder testimonials', 'error');
  }
}

// ==========================================================================
// 9. PROFILE & ABOUT CMS (PORTRAIT, RESUME PDF, HERO, ABOUT, SOCIAL)
// ==========================================================================

async function loadProfileData() {
  try {
    // 1. Hero
    const heroRes = await apiFetch('/api/admin/hero');
    if (heroRes && heroRes.success && heroRes.data) {
      currentHeroData = heroRes.data;
      document.getElementById('field-hero-greeting').value = currentHeroData.greeting || '';
      document.getElementById('field-hero-name').value = currentHeroData.name || '';
      document.getElementById('field-hero-role').value = currentHeroData.role_title || '';
      document.getElementById('field-hero-positioning').value = currentHeroData.positioning_statement || '';
      document.getElementById('field-hero-primary-cta-text').value = currentHeroData.primary_cta_text || '';
      document.getElementById('field-hero-primary-cta-url').value = currentHeroData.primary_cta_url || '';
      document.getElementById('field-hero-secondary-cta-text').value = currentHeroData.secondary_cta_text || '';
      document.getElementById('field-hero-secondary-cta-url').value = currentHeroData.secondary_cta_url || '';
      document.getElementById('field-hero-availability').value = currentHeroData.availability_status || '';
      updateProfileImagePreview(currentHeroData.profile_image_url);
    }

    // 2. About
    const aboutRes = await apiFetch('/api/admin/about');
    if (aboutRes && aboutRes.success && aboutRes.data) {
      const a = aboutRes.data;
      document.getElementById('field-about-eyebrow').value = a.eyebrow || '';
      document.getElementById('field-about-headline').value = a.headline || '';
      document.getElementById('field-about-headline-accent').value = a.headline_accent || '';
      document.getElementById('field-about-p1').value = a.bio_paragraph_1 || '';
      document.getElementById('field-about-p2').value = a.bio_paragraph_2 || '';
      document.getElementById('field-about-quote').value = a.quote || '';
      document.getElementById('field-about-quote-accent').value = a.quote_accent || '';
      document.getElementById('field-about-experience').value = a.experience_years || '';
      document.getElementById('field-about-badge').value = a.availability_badge || '';
    }

    // 3. Resume URL from Site Settings
    const settingsRes = await apiFetch('/api/admin/settings');
    if (settingsRes && settingsRes.success && settingsRes.data) {
      const resumeUrl = settingsRes.data.resume_url;
      const infoWrap = document.getElementById('resume-current-info');
      const linkElem = document.getElementById('resume-file-link');
      if (resumeUrl) {
        if (infoWrap) infoWrap.style.display = 'flex';
        if (linkElem) linkElem.setAttribute('href', resumeUrl);
      }
    }

    // 4. Contact
    const contactRes = await apiFetch('/api/admin/contact');
    if (contactRes && contactRes.success && contactRes.data) {
      const c = contactRes.data;
      document.getElementById('field-contact-heading').value = c.heading || '';
      document.getElementById('field-contact-subheading').value = c.subheading || '';
      document.getElementById('field-contact-email').value = c.email || '';
      document.getElementById('field-contact-phone').value = c.phone || '';
      document.getElementById('field-contact-location').value = c.location || '';
      document.getElementById('field-contact-availability').value = c.availability_text || '';
    }

    // 5. Social Links
    loadSocialLinks();
  } catch (err) {
    console.error('Error loading profile data:', err);
  }
}

function setupProfileModule() {
  // Portrait upload
  const dropzone = document.getElementById('hero-profile-dropzone');
  const fileInput = document.getElementById('hero-profile-file-input');
  const triggerBtn = document.getElementById('btn-trigger-profile-upload');
  const removeBtn = document.getElementById('btn-remove-profile-photo');

  dropzone.addEventListener('click', () => fileInput.click());
  triggerBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files[0]) {
      await handleProfileImageUpload(fileInput.files[0]);
    }
  });

  removeBtn.addEventListener('click', async () => {
    if (!confirm('Remove official profile photo?')) return;
    try {
      await apiFetch('/api/admin/hero', {
        method: 'PUT',
        body: JSON.stringify({ ...currentHeroData, profile_image_url: '' })
      });
      if (currentHeroData) currentHeroData.profile_image_url = '';
      updateProfileImagePreview('');
      showToast('Profile photo removed', 'success');
    } catch (err) {
      showToast('Failed to remove photo', 'error');
    }
  });

  // Resume PDF upload
  const uploadResumeBtn = document.getElementById('btn-upload-resume');
  const resumeFileInput = document.getElementById('resume-file-input');

  uploadResumeBtn.addEventListener('click', () => resumeFileInput.click());

  resumeFileInput.addEventListener('change', async () => {
    if (!resumeFileInput.files || !resumeFileInput.files[0]) return;
    const file = resumeFileInput.files[0];
    const formData = new FormData();
    formData.append('resume', file);

    showToast('Uploading Curriculum Vitae (PDF)...', 'success');

    try {
      const res = await apiFetch('/api/admin/profile/resume', {
        method: 'POST',
        body: formData
      });

      if (res && res.success) {
        showToast('Resume published successfully', 'success');
        const infoWrap = document.getElementById('resume-current-info');
        const linkElem = document.getElementById('resume-file-link');
        if (infoWrap && linkElem) {
          infoWrap.style.display = 'flex';
          linkElem.setAttribute('href', res.url);
        }
        loadMediaData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload resume', 'error');
    }
  });

  // Hero form submit
  document.getElementById('hero-content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      greeting: document.getElementById('field-hero-greeting').value.trim(),
      name: document.getElementById('field-hero-name').value.trim(),
      role_title: document.getElementById('field-hero-role').value.trim(),
      positioning_statement: document.getElementById('field-hero-positioning').value.trim(),
      primary_cta_text: document.getElementById('field-hero-primary-cta-text').value.trim(),
      primary_cta_url: document.getElementById('field-hero-primary-cta-url').value.trim(),
      secondary_cta_text: document.getElementById('field-hero-secondary-cta-text').value.trim(),
      secondary_cta_url: document.getElementById('field-hero-secondary-cta-url').value.trim(),
      availability_status: document.getElementById('field-hero-availability').value.trim(),
      profile_image_url: currentHeroData?.profile_image_url || ''
    };

    try {
      await apiFetch('/api/admin/hero', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      currentHeroData = { ...currentHeroData, ...payload };
      showToast('Hero section updated successfully', 'success');
    } catch (err) {
      showToast('Failed to save hero changes', 'error');
    }
  });

  // About form submit
  document.getElementById('about-content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      eyebrow: document.getElementById('field-about-eyebrow').value.trim(),
      headline: document.getElementById('field-about-headline').value.trim(),
      headline_accent: document.getElementById('field-about-headline-accent').value.trim(),
      bio_paragraph_1: document.getElementById('field-about-p1').value.trim(),
      bio_paragraph_2: document.getElementById('field-about-p2').value.trim(),
      quote: document.getElementById('field-about-quote').value.trim(),
      quote_accent: document.getElementById('field-about-quote-accent').value.trim(),
      experience_years: document.getElementById('field-about-experience').value.trim(),
      availability_badge: document.getElementById('field-about-badge').value.trim()
    };

    try {
      await apiFetch('/api/admin/about', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('About section saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save about section', 'error');
    }
  });

  // Contact form submit
  document.getElementById('contact-info-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      heading: document.getElementById('field-contact-heading').value.trim(),
      subheading: document.getElementById('field-contact-subheading').value.trim(),
      email: document.getElementById('field-contact-email').value.trim(),
      phone: document.getElementById('field-contact-phone').value.trim(),
      location: document.getElementById('field-contact-location').value.trim(),
      availability_text: document.getElementById('field-contact-availability').value.trim()
    };

    try {
      await apiFetch('/api/admin/contact', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('Contact information saved', 'success');
    } catch (err) {
      showToast('Failed to save contact info', 'error');
    }
  });

  // Social links setup
  document.getElementById('btn-add-social').addEventListener('click', openAddSocialModal);

  document.getElementById('social-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('social-form-id').value;
    const payload = {
      platform: document.getElementById('soc-platform').value.trim(),
      label: document.getElementById('soc-label').value.trim(),
      url: document.getElementById('soc-url').value.trim(),
      sort_order: allSocialData.length + 1,
      is_active: 1
    };

    try {
      if (id) {
        await apiFetch(`/api/admin/social-links/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/api/admin/social-links', { method: 'POST', body: JSON.stringify(payload) });
      }
      showToast('Social link saved', 'success');
      closeModal('modal-social');
      loadSocialLinks();
    } catch (err) {
      showToast('Failed to save link', 'error');
    }
  });
}

function updateProfileImagePreview(url) {
  const previewImg = document.getElementById('hero-profile-preview');
  const emptyState = document.getElementById('hero-profile-empty');
  const removeBtn = document.getElementById('btn-remove-profile-photo');
  const badge = document.getElementById('profile-status-badge');

  if (url && url.trim() !== '') {
    previewImg.src = url;
    previewImg.style.display = 'block';
    emptyState.style.display = 'none';
    removeBtn.style.display = 'inline-block';
    badge.textContent = 'Custom Photo Active';
  } else {
    previewImg.src = '';
    previewImg.style.display = 'none';
    emptyState.style.display = 'block';
    removeBtn.style.display = 'none';
    badge.textContent = 'Monogram Frame Active';
  }
}

async function handleProfileImageUpload(file) {
  const formData = new FormData();
  formData.append('file', file);
  showToast('Uploading profile image...', 'success');

  try {
    const uploadRes = await apiFetch('/api/admin/upload', { method: 'POST', body: formData });
    if (uploadRes && uploadRes.success && uploadRes.url) {
      const newUrl = uploadRes.url;
      await apiFetch('/api/admin/hero', {
        method: 'PUT',
        body: JSON.stringify({ ...currentHeroData, profile_image_url: newUrl })
      });
      if (currentHeroData) currentHeroData.profile_image_url = newUrl;
      updateProfileImagePreview(newUrl);
      showToast('Profile photo updated & persisted', 'success');
      loadMediaData();
    }
  } catch (err) {
    showToast(err.message || 'Image upload failed', 'error');
  }
}

async function loadSocialLinks() {
  try {
    const res = await apiFetch('/api/admin/social-links');
    if (res && res.success && res.data) {
      allSocialData = res.data;
      renderSocialList(allSocialData);
    }
  } catch (err) {
    console.error('Error loading social links:', err);
  }
}

function renderSocialList(links) {
  const container = document.getElementById('social-list-container');
  if (!container) return;

  if (links.length === 0) {
    container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--admin-text-muted);">No social links yet.</div>`;
    return;
  }

  container.innerHTML = links.map(l => `
    <div class="list-row-item" data-id="${l.id}">
      <div>
        <div class="item-title-text">${escapeHtml(l.label || l.platform)}</div>
        <div class="item-meta-text"><a href="${escapeHtml(l.url)}" target="_blank" style="color: var(--admin-accent);">${escapeHtml(l.url)}</a></div>
      </div>
      <div class="item-actions-group">
        <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteSocialLink(${l.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openAddSocialModal() {
  document.getElementById('modal-social-title').textContent = 'Add Social Link';
  document.getElementById('social-form-id').value = '';
  document.getElementById('soc-platform').value = '';
  document.getElementById('soc-label').value = '';
  document.getElementById('soc-url').value = '';
  openModal('modal-social');
}

async function deleteSocialLink(id) {
  if (!confirm('Delete this social link?')) return;
  try {
    await apiFetch(`/api/admin/social-links/${id}`, { method: 'DELETE' });
    showToast('Social link deleted', 'success');
    loadSocialLinks();
  } catch (err) {
    showToast('Failed to delete social link', 'error');
  }
}

// ==========================================================================
// 10. MEDIA LIBRARY MODULE
// ==========================================================================

async function loadMediaData() {
  try {
    const res = await apiFetch('/api/admin/media');
    if (res && res.success && res.data) {
      allMediaData = res.data;
      renderMediaGrid(allMediaData);
      const countBadge = document.getElementById('media-count-badge');
      if (countBadge) countBadge.textContent = `${allMediaData.length} Files`;
      loadOverview();
    }
  } catch (err) {
    console.error('Error loading media library:', err);
  }
}

function renderMediaGrid(mediaList) {
  const grid = document.getElementById('media-library-grid');
  if (!grid) return;

  if (mediaList.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: var(--admin-text-muted);">No media files in library. Upload files above.</div>`;
    return;
  }

  grid.innerHTML = mediaList.map(m => {
    const isImage = m.mime_type && m.mime_type.startsWith('image/');
    const isVideo = m.mime_type && m.mime_type.startsWith('video/');
    const isPdf = m.mime_type === 'application/pdf';

    let thumbHtml = '';
    if (isImage) {
      thumbHtml = `<img src="${escapeHtml(m.file_path)}" alt="${escapeHtml(m.alt_text || m.original_name)}" class="media-thumb-img" loading="lazy" />`;
    } else if (isVideo) {
      thumbHtml = `<div class="media-thumb-icon">🎬</div>`;
    } else {
      thumbHtml = `<div class="media-thumb-icon">📄</div>`;
    }

    const sizeFormatted = formatFileSize(m.file_size);

    return `
      <div class="media-card" data-id="${m.id}">
        <div class="media-thumb-box">
          ${thumbHtml}
        </div>
        <div class="media-info">
          <div class="media-filename" title="${escapeHtml(m.original_name)}">${escapeHtml(m.original_name)}</div>
          <div class="media-meta-row">
            <span>${escapeHtml(sizeFormatted)}</span>
            <span class="status-pill active" style="font-size:10px; padding: 2px 6px;">${escapeHtml(m.mime_type ? m.mime_type.split('/')[1] : 'file')}</span>
          </div>
        </div>
        <div class="media-actions-bar">
          <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" style="font-size: 11px; padding: 4px 8px;" onclick="copyMediaUrl('${escapeHtml(m.file_path)}')">Copy URL</button>
          <button type="button" class="btn-icon-xs" style="color: var(--admin-danger);" title="Delete file" onclick="deleteMediaItem(${m.id})">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function setupMediaModule() {
  const fileInput = document.getElementById('media-library-file-input');
  const dropzone = document.getElementById('media-library-dropzone');

  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      if (!fileInput.files || fileInput.files.length === 0) return;
      const formData = new FormData();
      for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('files', fileInput.files[i]);
      }

      showToast(`Uploading ${fileInput.files.length} file(s)...`, 'success');

      try {
        const res = await apiFetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData
        });

        if (res && res.success) {
          showToast(res.message || 'Files uploaded successfully', 'success');
          loadMediaData();
          fileInput.value = '';
        }
      } catch (err) {
        showToast(err.message || 'Media upload failed', 'error');
      }
    });
  }

  // Filter tabs
  const filterBtns = document.querySelectorAll('[data-media-filter]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-media-filter');

      if (filter === 'all') {
        renderMediaGrid(allMediaData);
      } else if (filter === 'image') {
        renderMediaGrid(allMediaData.filter(m => m.mime_type && m.mime_type.startsWith('image/')));
      } else if (filter === 'video') {
        renderMediaGrid(allMediaData.filter(m => m.mime_type && m.mime_type.startsWith('video/')));
      } else if (filter === 'pdf') {
        renderMediaGrid(allMediaData.filter(m => m.mime_type === 'application/pdf'));
      }
    });
  });
}

function copyMediaUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast(`Copied URL: ${url}`, 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'warning');
  });
}

async function deleteMediaItem(id) {
  if (!confirm('Permanently delete this file from server?')) return;
  try {
    await apiFetch(`/api/admin/media/${id}`, { method: 'DELETE' });
    showToast('Media file deleted', 'success');
    loadMediaData();
  } catch (err) {
    showToast('Failed to delete media file', 'error');
  }
}

// ==========================================================================
// 11. GLOBAL SETTINGS, NAVIGATION & SECTIONS MODULE
// ==========================================================================

async function loadSettingsData() {
  try {
    const res = await apiFetch('/api/admin/settings');
    if (res && res.success && res.data) {
      currentSettingsData = res.data;
      document.getElementById('field-settings-title').value = currentSettingsData.site_title || '';
      document.getElementById('field-settings-desc').value = currentSettingsData.meta_description || '';
      document.getElementById('field-settings-keywords').value = currentSettingsData.meta_keywords || '';
      document.getElementById('field-settings-logo').value = currentSettingsData.logo_text || '';
      document.getElementById('field-settings-og-image').value = currentSettingsData.social_image || '';
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

async function loadSectionSettings() {
  try {
    const res = await apiFetch('/api/admin/sections');
    if (res && res.success && res.data) {
      allSectionsData = res.data;
      renderSectionsTable(allSectionsData);
    }
  } catch (err) {
    console.error('Error loading sections:', err);
  }
}

function renderSectionsTable(sections) {
  const tbody = document.getElementById('sections-table-body');
  if (!tbody) return;

  tbody.innerHTML = sections.map((sec, idx) => {
    return `
      <tr data-sec-id="${sec.id}">
        <td><strong>#${escapeHtml(sec.section_key)}</strong></td>
        <td>
          <input type="text" class="admin-input" style="padding: 6px 10px; font-size: 12.5px;" value="${escapeHtml(sec.section_title || '')}" placeholder="Default title" onchange="updateSectionField(${sec.id}, 'section_title', this.value)" />
        </td>
        <td>
          <input type="text" class="admin-input" style="padding: 6px 10px; font-size: 12.5px;" value="${escapeHtml(sec.section_eyebrow || '')}" placeholder="Default eyebrow" onchange="updateSectionField(${sec.id}, 'section_eyebrow', this.value)" />
        </td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" ${sec.is_enabled ? 'checked' : ''} onchange="toggleSectionEnabled(${sec.id}, this.checked)" />
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td>
          <button class="btn-icon-logout" title="Move Up" onclick="reorderSectionItem(${sec.id}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
          <button class="btn-icon-logout" title="Move Down" onclick="reorderSectionItem(${sec.id}, 1)" ${idx === sections.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateSectionField(id, field, value) {
  try {
    const sec = allSectionsData.find(s => s.id === id);
    if (!sec) return;
    const payload = { ...sec, [field]: value };
    await apiFetch(`/api/admin/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    showToast('Section settings updated', 'success');
  } catch (err) {
    showToast('Failed to update section', 'error');
  }
}

async function toggleSectionEnabled(id, isEnabled) {
  try {
    const sec = allSectionsData.find(s => s.id === id);
    if (!sec) return;
    const payload = { ...sec, is_enabled: isEnabled ? 1 : 0 };
    await apiFetch(`/api/admin/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    sec.is_enabled = isEnabled ? 1 : 0;
    showToast(`Section #${sec.section_key} ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
  } catch (err) {
    showToast('Failed to update section toggle', 'error');
  }
}

async function reorderSectionItem(id, direction) {
  const index = allSectionsData.findIndex(s => s.id === id);
  if (index < 0) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= allSectionsData.length) return;

  const reordered = [...allSectionsData];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  const orderedIds = reordered.map(s => s.id);
  try {
    await apiFetch('/api/admin/sections/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    });
    allSectionsData = reordered;
    renderSectionsTable(allSectionsData);
  } catch (err) {
    showToast('Failed to reorder sections', 'error');
  }
}

async function loadNavigationData() {
  try {
    const res = await apiFetch('/api/admin/navigation');
    if (res && res.success && res.data) {
      allNavigationData = res.data;
      renderNavigationTable(allNavigationData);
    }
  } catch (err) {
    console.error('Error loading navigation:', err);
  }
}

function renderNavigationTable(links) {
  const tbody = document.getElementById('nav-table-body');
  if (!tbody) return;

  tbody.innerHTML = links.map((link, idx) => {
    return `
      <tr data-nav-id="${link.id}">
        <td>${link.sort_order || idx + 1}</td>
        <td><strong>${escapeHtml(link.label)}</strong></td>
        <td><code>${escapeHtml(link.url)}</code></td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" ${link.is_active ? 'checked' : ''} onchange="toggleNavActive(${link.id}, this.checked)" />
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td style="text-align: right;">
          <button class="btn-icon-logout" title="Move Up" onclick="reorderNavItem(${link.id}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
          <button class="btn-icon-logout" title="Move Down" onclick="reorderNavItem(${link.id}, 1)" ${idx === links.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openEditNavModal(${link.id})">Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteNavItem(${link.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function setupSettingsModule() {
  // Identity & Meta
  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      site_title: document.getElementById('field-settings-title').value.trim(),
      meta_description: document.getElementById('field-settings-desc').value.trim(),
      meta_keywords: document.getElementById('field-settings-keywords').value.trim(),
      logo_text: document.getElementById('field-settings-logo').value.trim(),
      social_image: document.getElementById('field-settings-og-image').value.trim()
    };

    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('Global settings saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  });

  // Navigation Links Setup
  document.getElementById('btn-add-nav-link').addEventListener('click', openAddNavModal);

  document.getElementById('nav-link-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('nav-link-form-id').value;
    const payload = {
      label: document.getElementById('nav-label').value.trim(),
      url: document.getElementById('nav-url').value.trim(),
      sort_order: Number(document.getElementById('nav-sort-order').value) || 0,
      is_active: document.getElementById('nav-is-active').checked ? 1 : 0
    };

    try {
      if (id) {
        await apiFetch(`/api/admin/navigation/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Navigation link updated', 'success');
      } else {
        await apiFetch('/api/admin/navigation', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Navigation link added', 'success');
      }
      closeModal('modal-nav-link');
      loadNavigationData();
    } catch (err) {
      showToast(err.message || 'Failed to save navigation link', 'error');
    }
  });

  // Security Credentials form
  document.getElementById('profile-security-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('field-admin-username').value.trim();
    const email = document.getElementById('field-admin-email').value.trim();
    const currentPassword = document.getElementById('field-admin-current-pass').value;
    const newPassword = document.getElementById('field-admin-new-pass').value;

    const payload = { username, email };
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    try {
      const res = await apiFetch('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res && res.success) {
        showToast('Security credentials updated', 'success');
        document.getElementById('field-admin-current-pass').value = '';
        document.getElementById('field-admin-new-pass').value = '';
      }
    } catch (err) {
      showToast(err.message || 'Failed to update credentials', 'error');
    }
  });
}

function openAddNavModal() {
  document.getElementById('modal-nav-title').textContent = 'Add Navigation Link';
  document.getElementById('nav-link-form-id').value = '';
  document.getElementById('nav-label').value = '';
  document.getElementById('nav-url').value = '#';
  document.getElementById('nav-sort-order').value = allNavigationData.length + 1;
  document.getElementById('nav-is-active').checked = true;
  openModal('modal-nav-link');
}

function openEditNavModal(id) {
  const item = allNavigationData.find(n => n.id === id);
  if (!item) return;

  document.getElementById('modal-nav-title').textContent = 'Edit Navigation Link';
  document.getElementById('nav-link-form-id').value = item.id;
  document.getElementById('nav-label').value = item.label || '';
  document.getElementById('nav-url').value = item.url || '';
  document.getElementById('nav-sort-order').value = item.sort_order || 0;
  document.getElementById('nav-is-active').checked = !!item.is_active;
  openModal('modal-nav-link');
}

async function toggleNavActive(id, isActive) {
  try {
    const item = allNavigationData.find(n => n.id === id);
    if (!item) return;
    const payload = { ...item, is_active: isActive ? 1 : 0 };
    await apiFetch(`/api/admin/navigation/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    item.is_active = isActive ? 1 : 0;
    showToast(`Nav link ${isActive ? 'activated' : 'deactivated'}`, 'success');
  } catch (err) {
    showToast('Failed to update nav link', 'error');
  }
}

async function deleteNavItem(id) {
  if (!confirm('Delete this navigation link?')) return;
  try {
    await apiFetch(`/api/admin/navigation/${id}`, { method: 'DELETE' });
    showToast('Navigation link deleted', 'success');
    loadNavigationData();
  } catch (err) {
    showToast('Failed to delete navigation link', 'error');
  }
}

async function reorderNavItem(id, direction) {
  const index = allNavigationData.findIndex(n => n.id === id);
  if (index < 0) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= allNavigationData.length) return;

  const reordered = [...allNavigationData];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  const orderedIds = reordered.map(n => n.id);
  try {
    await apiFetch('/api/admin/navigation/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    });
    allNavigationData = reordered;
    renderNavigationTable(allNavigationData);
  } catch (err) {
    showToast('Failed to reorder navigation', 'error');
  }
}

// ==========================================================================
// 12. NUMBERS / STATISTICS MODULE
// ==========================================================================

async function loadStatsData() {
  try {
    const res = await apiFetch('/api/admin/statistics');
    if (res && res.success && res.data) {
      allStatsData = res.data;
      renderStatsList(allStatsData);
    }
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

function renderStatsList(stats) {
  const container = document.getElementById('stats-list-container');
  if (!container) return;

  if (stats.length === 0) {
    container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--admin-text-muted);">No metrics yet.</div>`;
    return;
  }

  container.innerHTML = stats.map((st, idx) => `
    <div class="list-row-item" data-id="${st.id}">
      <div>
        <div class="item-title-text">${escapeHtml(st.metric_value)}${escapeHtml(st.metric_suffix || '')} — ${escapeHtml(st.label)}</div>
        <div class="item-meta-text">${escapeHtml(st.description || '')}</div>
      </div>
      <div class="item-actions-group">
        <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteStat(${st.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function setupStatsModule() {
  document.getElementById('btn-add-stat').addEventListener('click', openAddStatModal);

  document.getElementById('stat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('stat-form-id').value;
    const payload = {
      metric_value: document.getElementById('stat-value').value.trim(),
      metric_suffix: document.getElementById('stat-suffix').value.trim(),
      label: document.getElementById('stat-label').value.trim(),
      description: document.getElementById('stat-desc').value.trim(),
      sort_order: allStatsData.length + 1,
      is_active: 1
    };

    try {
      if (id) {
        await apiFetch(`/api/admin/statistics/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/api/admin/statistics', { method: 'POST', body: JSON.stringify(payload) });
      }
      showToast('Metric saved', 'success');
      closeModal('modal-stat');
      loadStatsData();
    } catch (err) {
      showToast('Failed to save metric', 'error');
    }
  });
}

function openAddStatModal() {
  document.getElementById('modal-stat-title').textContent = 'Add Metric';
  document.getElementById('stat-form-id').value = '';
  document.getElementById('stat-value').value = '';
  document.getElementById('stat-suffix').value = '';
  document.getElementById('stat-label').value = '';
  document.getElementById('stat-desc').value = '';
  openModal('modal-stat');
}

async function deleteStat(id) {
  if (!confirm('Delete this metric?')) return;
  try {
    await apiFetch(`/api/admin/statistics/${id}`, { method: 'DELETE' });
    showToast('Metric deleted', 'success');
    loadStatsData();
  } catch (err) {
    showToast('Failed to delete metric', 'error');
  }
}

// ==========================================================================
// 13. INBOX / MESSAGES MODULE
// ==========================================================================

async function loadMessagesData() {
  try {
    const res = await apiFetch('/api/admin/messages');
    if (res && res.success && res.data) {
      renderMessagesList(res.data);
      const pill = document.getElementById('messages-count-pill');
      if (pill) pill.textContent = `${res.data.length} Total`;
    }
  } catch (err) {
    console.error('Error loading messages:', err);
  }
}

function renderMessagesList(messages) {
  const container = document.getElementById('messages-list-container');
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--admin-text-muted);">No visitor inquiries yet.</div>`;
    return;
  }

  container.innerHTML = messages.map(m => `
    <div class="list-row-item" style="${m.is_read ? 'opacity: 0.8;' : 'border-left: 3px solid var(--admin-accent);'}" data-id="${m.id}">
      <div style="flex-grow: 1;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <div class="item-title-text">${escapeHtml(m.name)} <span style="font-weight: 400; font-size: 13px; color: var(--admin-text-secondary);">&lt;${escapeHtml(m.email)}&gt;</span></div>
          <div style="font-size: 11.5px; color: var(--admin-text-muted);">${escapeHtml(m.created_at || '')}</div>
        </div>
        <div style="font-weight: 600; font-size: 13px; color: var(--admin-text-primary); margin-bottom: 6px;">${escapeHtml(m.subject || 'No Subject')}</div>
        <div style="font-size: 13px; color: var(--admin-text-secondary); line-height: 1.5; white-space: pre-wrap;">${escapeHtml(m.message)}</div>
      </div>
      <div class="item-actions-group" style="align-self: flex-start; margin-left: 16px;">
        <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteMessage(${m.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function setupMessagesModule() {}

async function deleteMessage(id) {
  if (!confirm('Permanently delete this message?')) return;
  try {
    await apiFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
    showToast('Message deleted', 'success');
    loadMessagesData();
    loadOverview();
  } catch (err) {
    showToast('Failed to delete message', 'error');
  }
}

// ==========================================================================
// 14. MODAL CONTROLS & UTILITIES
// ==========================================================================

function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('closing');
  m.classList.add('open');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('closing');
  setTimeout(() => {
    m.classList.remove('open');
    m.classList.remove('closing');
  }, 220);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// 15. INTRO LOADER ANIMATION
// ==========================================================================

function setupIntroLoader() {
  const loader = document.getElementById('intro-loader');
  const bar = document.getElementById('intro-progress-bar');
  const percentElem = document.getElementById('intro-progress-percent');
  const tracker = document.getElementById('intro-infinity-tracker');

  if (!loader || !bar) return;

  let progress = 0;
  let isReady = false;

  window.markAdminReady = function() {
    isReady = true;
  };

  const interval = setInterval(() => {
    if (!isReady) {
      if (progress < 85) progress += 3;
    } else {
      progress += 6;
    }

    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      if (bar) bar.style.width = '100%';
      if (tracker) tracker.style.left = '100%';
      if (percentElem) percentElem.textContent = '100%';

      setTimeout(() => {
        loader.classList.add('loader-exiting');
        setTimeout(() => {
          loader.classList.add('loader-hidden');
        }, 350);
      }, 150);
      return;
    }

    if (bar) bar.style.width = `${progress}%`;
    if (tracker) tracker.style.left = `${progress}%`;
    if (percentElem) percentElem.textContent = `${Math.floor(progress)}%`;
  }, 25);
}
