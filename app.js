/**
 * app.js — Portfolio rendering engine
 */

let cachedProjects = null;

document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

async function initPage() {
  if (typeof SITE_CONFIG === 'undefined') return;

  const activePage = detectActivePage();
  let projects = [];

  try {
    projects = await fetchProjects();
  } catch {
    projects = [];
  }

  renderSiteHeader(activePage, projects);
  applyConfig();

  const projectPage = document.getElementById('project-page');
  if (projectPage) {
    await renderProjectPage(projects);
    return;
  }

  if (document.getElementById('projects-grid')) {
    renderProjectsFromList(projects);
  }
}

function detectActivePage() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'index.html' || path === '') return 'home';
  if (path === 'project.html') return 'project';
  if (path === 'about.html') return 'about';
  if (path === 'resume.html') return 'resume';
  return 'home';
}

async function fetchProjects() {
  if (cachedProjects) return cachedProjects;
  const res = await fetch(SITE_CONFIG.projectsData);
  if (!res.ok) throw new Error('Could not load projects.json');
  cachedProjects = await res.json();
  return cachedProjects;
}

function projectPageUrl(id) {
  const base = SITE_CONFIG.projectPage || 'project.html';
  return `${base}?id=${encodeURIComponent(id)}`;
}

function applyConfig() {
  const headline = document.getElementById('projects-headline');
  if (headline) {
    headline.textContent = SITE_CONFIG.headline;
  }

  const topBar = document.getElementById('top-bar-description');
  if (topBar && SITE_CONFIG.shortBio) {
    topBar.textContent = SITE_CONFIG.shortBio;
  }

  renderHomeAbout();

  if (!document.getElementById('project-page')) {
    document.title = SITE_CONFIG.name + ' - Portfolio';
  }

  document.querySelectorAll('.site-header .logo').forEach(el => {
    el.textContent = SITE_CONFIG.logo;
  });
}

function renderHomeAbout() {
  const section = document.getElementById('home-about');
  if (!section || !SITE_CONFIG.homeAbout) return;

  const { photo, lines } = SITE_CONFIG.homeAbout;
  const name = escapeHtml(SITE_CONFIG.name || '');
  const photoSrc = photo ? escapeHtml(photo) : '';

  const linesHtml = (lines || [])
    .slice(0, 4)
    .map((line, i) => {
      const cls = i === 0 ? 'home-about-line home-about-line-lead' : 'home-about-line';
      return `<p class="${cls}">${escapeHtml(line)}</p>`;
    })
    .join('');

  section.innerHTML = `
    ${photoSrc ? `<img class="home-about-photo" src="${photoSrc}" alt="${name}" loading="lazy" />` : ''}
    <div class="home-about-lines">${linesHtml}</div>
  `;
}

/* ============================================================
   SITE HEADER
   ============================================================ */

function renderSiteHeader(activePage, projects) {
  const inner = document.getElementById('site-header-inner');
  if (!inner) return;

  const homeActive = activePage === 'home' ? ' active' : '';
  const projectActive = activePage === 'project' ? ' active' : '';
  const aboutActive = activePage === 'about' ? ' active' : '';
  const resumeActive = activePage === 'resume' ? ' active' : '';

  const dropdownItems = projects
    .map(
      p => `<a class="site-nav-dropdown-link" href="${escapeHtml(projectPageUrl(p.id))}">${escapeHtml(p.title)}</a>`
    )
    .join('');

  inner.innerHTML = `
    <a href="index.html" class="logo">${escapeHtml(SITE_CONFIG.logo)}</a>
    <nav class="site-nav" aria-label="Main">
      <a href="index.html" class="site-nav-link${homeActive}">Home</a>
      <div class="site-nav-dropdown${projectActive ? ' active' : ''}">
        <button type="button" class="site-nav-dropdown-toggle site-nav-link${projectActive}" aria-expanded="false" aria-haspopup="true">
          Projects
        </button>
        <div class="site-nav-dropdown-menu" role="menu">
          ${dropdownItems || '<span class="site-nav-dropdown-empty">No projects</span>'}
        </div>
      </div>
      <a href="about.html" class="site-nav-link${aboutActive}">About Me</a>
      <a href="resume.html" class="site-nav-link${resumeActive}">Resume</a>
    </nav>
  `;

  setupProjectsDropdown(inner);
}

function setupProjectsDropdown(headerInner) {
  const dropdown = headerInner.querySelector('.site-nav-dropdown');
  const toggle = headerInner.querySelector('.site-nav-dropdown-toggle');
  if (!dropdown || !toggle) return;

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  });

  dropdown.addEventListener('click', e => e.stopPropagation());
}

/* ============================================================
   PROJECTS — home page
   ============================================================ */

async function renderProjects() {
  try {
    const projects = await fetchProjects();
    renderProjectsFromList(projects);
  } catch (err) {
    const grid = document.getElementById('projects-grid');
    if (grid) {
      grid.innerHTML = `<p class="loading">Could not load projects. (${escapeHtml(err.message)})</p>`;
    }
  }
}

function renderProjectsFromList(projects) {
  const grid = document.getElementById('projects-grid');
  const highlightContainer = document.getElementById('highlighted-project');
  if (!grid) return;

  const highlightId = SITE_CONFIG.highlightedProjectId;
  const highlighted = highlightId ? projects.find(p => p.id === highlightId) : null;

  if (highlightContainer) {
    highlightContainer.innerHTML = '';
    if (highlighted) {
      highlightContainer.appendChild(
        buildProjectEntry(highlighted, { variant: 'featured' })
      );
    }
  }

  grid.innerHTML = '';
  const rest = highlightId ? projects.filter(p => p.id !== highlightId) : projects;

  rest.forEach(project => {
    grid.appendChild(buildProjectEntry(project, { variant: 'card' }));
  });
}

/* ============================================================
   PROJECT DETAIL PAGE
   ============================================================ */

async function renderProjectPage(projects) {
  const container = document.getElementById('project-page');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const project = id ? projects.find(p => p.id === id) : null;

  if (!project) {
    container.innerHTML = `<p class="loading">Project not found.</p>`;
    document.title = 'Project not found - ' + SITE_CONFIG.name;
    return;
  }

  document.title = project.title + ' - ' + SITE_CONFIG.name;

  const isHighlight = project.id === SITE_CONFIG.highlightedProjectId;
  const mediaHtml = buildProjectMedia(project, { mode: 'page' });
  const tagsHtml = buildProjectTagsHtml(project);
  const detailsHtml = buildProjectDetailsHtml(project, { detailed: isHighlight });
  const externalLink = project.link
    ? `<a class="project-link project-link--external" href="${escapeHtml(project.link)}" target="_blank" rel="noopener">${escapeHtml(project.linkText || 'View project')}</a>`
    : '';
  const footerHtml = buildProjectIndexFooter(projects, project.id);

  container.innerHTML = `
    <article class="project-page">
      <div class="project-page-media">${mediaHtml}</div>
      <h1 class="project-page-title">${escapeHtml(project.title)}</h1>
      <p class="project-description project-page-description">${escapeHtml(project.description)}</p>
      <div class="project-tags">${tagsHtml}</div>
      ${detailsHtml}
      ${externalLink ? `<div class="project-page-external-link">${externalLink}</div>` : ''}
      ${footerHtml}
    </article>
  `;
}

function buildProjectIndexFooter(projects, currentId) {
  const links = projects
    .map(p => {
      const isCurrent = p.id === currentId;
      const cls = isCurrent ? 'project-index-link is-current' : 'project-index-link';
      const label = p.shortTitle || p.title;
      return `<a href="${escapeHtml(projectPageUrl(p.id))}" class="${cls}">${escapeHtml(label)}</a>`;
    })
    .join('');

  return `
    <div class="project-index-section">
      <h2 class="project-index-heading">Other Projects</h2>
      <nav class="project-index-footer" aria-label="All projects">
        ${links}
        <a href="index.html" class="project-index-home">HOME</a>
      </nav>
    </div>
  `;
}

/* ============================================================
   PROJECT BUILDERS
   ============================================================ */

function youtubeEmbedSrc(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^pending$/i.test(trimmed)) return null;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (parsed.pathname.startsWith('/embed/')) {
      return `https://www.youtube.com/embed/${parsed.pathname.split('/embed/')[1].split('/')[0]}`;
    }
    const vid = parsed.searchParams.get('v');
    if (vid) return `https://www.youtube.com/embed/${vid}`;
  }
  if (host === 'youtu.be') {
    const vid = parsed.pathname.replace(/^\//, '').split('/')[0];
    if (vid) return `https://www.youtube.com/embed/${vid}`;
  }
  return null;
}

function buildProjectMedia(project, options = {}) {
  const mode = options.mode || 'card';
  const embedSrc = project.video ? youtubeEmbedSrc(project.video) : null;

  if (embedSrc) {
    const safeSrc = escapeHtml(embedSrc);
    return `
      <div class="project-media-wrap project-video">
        <iframe
          class="project-video-iframe"
          src="${safeSrc}"
          title="${escapeHtml(project.title)} video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      </div>`;
  }

  if (project.image) {
    if (mode === 'page') {
      return `
        <img
          class="project-page-image"
          src="${escapeHtml(project.image)}"
          alt="${escapeHtml(project.title)}"
          loading="lazy"
        />`;
    }
    return `
      <div class="project-media-wrap project-media-wrap--zoom">
        <img
          class="project-image"
          src="${escapeHtml(project.image)}"
          alt="${escapeHtml(project.title)}"
          loading="lazy"
        />
      </div>`;
  }

  return `<div class="project-image-placeholder">No image</div>`;
}

function buildProjectTagsHtml(project) {
  return (project.tags || [])
    .map(tag => {
      const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return `<span class="project-tag tag-${slug}">${escapeHtml(tag)}</span>`;
    })
    .join('');
}

function projectChallengesAndResults(project) {
  return project.challengesAndResults || '';
}

function buildProjectDetailsHtml(project, options = {}) {
  const detailed = options.detailed === true;
  const blocks = detailed
    ? [
        { field: 'approachDetailed', label: 'Approach' },
        { field: 'challengesAndResultsDetailed', label: 'Challenges & Results' },
        { field: 'thingsLearnedDetailed', label: 'Things Learned' },
      ]
    : [
        { field: 'approach', label: 'Approach' },
        { field: '__challengesAndResults', label: 'Challenges & Results' },
        { field: 'thingsLearned', label: 'Things Learned' },
      ];

  const inner = blocks
    .map(({ field, label }) => {
      const value =
        field === '__challengesAndResults'
          ? projectChallengesAndResults(project)
          : project[field];
      if (!value) return '';
      return `
      <div class="project-detail-block">
        <h4>${label}</h4>
        <p>${escapeHtml(value)}</p>
      </div>`;
    })
    .join('');

  if (!inner) return '';
  return `<div class="project-details">${inner}</div>`;
}

function buildProjectLinksHtml(project) {
  const parts = [];
  if (project.link) {
    parts.push(
      `<a class="project-link project-link--external" href="${escapeHtml(project.link)}" target="_blank" rel="noopener">${escapeHtml(project.linkText || 'View project')}</a>`
    );
  }
  parts.push(
    `<a class="project-link project-link--more" href="${escapeHtml(projectPageUrl(project.id))}">Learn More</a>`
  );
  return `<div class="project-links">${parts.join('')}</div>`;
}

function buildProjectCardBodyHtml(project) {
  const tagsHtml = buildProjectTagsHtml(project);
  const linksHtml = buildProjectLinksHtml(project);

  return `
    <h2 class="project-title">${escapeHtml(project.title)}</h2>
    <p class="project-description">${escapeHtml(project.description)}</p>
    <div class="project-tags">${tagsHtml}</div>
    ${linksHtml}
  `;
}

function buildFeaturedProjectHtml(project, mediaHtml) {
  const tagsHtml = buildProjectTagsHtml(project);
  const detailsHtml = buildProjectDetailsHtml(project, { detailed: false });
  const linksHtml = buildProjectLinksHtml(project);

  return `
    <div class="project-entry-left">
      ${mediaHtml}
      <p class="project-description project-description--featured-left">${escapeHtml(project.description)}</p>
      <div class="project-tags project-tags--featured-left">${tagsHtml}</div>
    </div>
    <div class="project-entry-copy">
      <h2 class="project-title">${escapeHtml(project.title)}</h2>
      ${detailsHtml}
      ${linksHtml}
    </div>
  `;
}

function buildProjectEntry(project, options = {}) {
  const variant = options.variant || 'card';
  const article = document.createElement('article');
  article.className =
    variant === 'featured'
      ? 'project-entry project-entry--featured'
      : 'project-entry project-entry--card';

  const mediaHtml = buildProjectMedia(project, { mode: 'card' });

  if (variant === 'featured') {
    article.innerHTML = buildFeaturedProjectHtml(project, mediaHtml);
  } else {
    article.innerHTML = `${mediaHtml}${buildProjectCardBodyHtml(project)}`;
  }

  return article;
}

/* ============================================================
   MARKDOWN PAGES
   ============================================================ */

async function renderMarkdownPage(containerId, mdPath) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch(mdPath);
    if (!res.ok) throw new Error('Could not load ' + mdPath);
    const raw = await res.text();
    container.innerHTML = parseMarkdown(raw);
  } catch (err) {
    container.innerHTML = `<p class="loading">Could not load page. (${escapeHtml(err.message)})</p>`;
  }
}

function setupResumePdfDownload() {
  const btn = document.getElementById('resume-pdf-download');
  const source = document.getElementById('resume-pdf-source');
  if (!btn || !source) return;

  btn.addEventListener('click', async () => {
    if (typeof html2pdf === 'undefined') {
      window.alert('PDF download is not available right now. Please try again later.');
      return;
    }

    btn.disabled = true;
    const baseName =
      typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.name
        ? SITE_CONFIG.name.replace(/\s+/g, '_')
        : 'Resume';

    try {
      await html2pdf()
        .set({
          margin: [0.45, 0.45, 0.45, 0.45],
          filename: `${baseName}_Resume.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(source)
        .save();
    } finally {
      btn.disabled = false;
    }
  });
}

function parseMarkdown(md) {
  const lines = md.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;
  let para = [];

  function flushPara() {
    if (para.length > 0) {
      const text = para.join(' ').trim();
      if (text) html += `<p>${inlineMarkdown(text)}</p>\n`;
      para = [];
    }
  }

  function closeList() {
    if (inUl) { html += '</ul>\n'; inUl = false; }
    if (inOl) { html += '</ol>\n'; inOl = false; }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^### (.+)/.test(line)) {
      flushPara(); closeList();
      html += `<h3>${inlineMarkdown(line.replace(/^### /, ''))}</h3>\n`;
      continue;
    }
    if (/^## (.+)/.test(line)) {
      flushPara(); closeList();
      html += `<h2>${inlineMarkdown(line.replace(/^## /, ''))}</h2>\n`;
      continue;
    }
    if (/^# (.+)/.test(line)) {
      flushPara(); closeList();
      html += `<h1>${inlineMarkdown(line.replace(/^# /, ''))}</h1>\n`;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushPara(); closeList();
      html += '<hr />\n';
      continue;
    }

    if (/^- (.+)/.test(line)) {
      flushPara();
      if (!inUl) { if (inOl) { html += '</ol>\n'; inOl = false; } html += '<ul>\n'; inUl = true; }
      html += `<li>${inlineMarkdown(line.replace(/^- /, ''))}</li>\n`;
      continue;
    }

    if (/^\d+\. (.+)/.test(line)) {
      flushPara();
      if (!inOl) { if (inUl) { html += '</ul>\n'; inUl = false; } html += '<ol>\n'; inOl = true; }
      html += `<li>${inlineMarkdown(line.replace(/^\d+\. /, ''))}</li>\n`;
      continue;
    }

    if (line.trim() === '') {
      flushPara(); closeList();
      continue;
    }

    if (inUl || inOl) closeList();
    para.push(line);
  }

  flushPara();
  closeList();

  return html;
}

function inlineMarkdown(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
