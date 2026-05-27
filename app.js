/**
 * app.js — Portfolio rendering engine
 * =====================================
 * Handles:
 *   - Populating nav and config-driven text
 *   - Fetching and rendering projects from JSON
 *   - Fetching and rendering Markdown pages
 */

/* ============================================================
   INIT — runs on every page to set up shared elements
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
});

function applyConfig() {
  if (typeof SITE_CONFIG === 'undefined') return;

  // Set page title
  document.title = SITE_CONFIG.name + ' — Portfolio';

  // Set logo text (all .logo elements)
  document.querySelectorAll('.logo').forEach(el => {
    el.textContent = SITE_CONFIG.logo;
  });

  // Populate top-bar bio (only present on index.html)
  const topBar = document.getElementById('top-bar-description');
  if (topBar) {
    topBar.textContent = SITE_CONFIG.shortBio;
  }

  // Populate homepage headline (only present on index.html)
  const headline = document.getElementById('projects-headline');
  if (headline) {
    headline.textContent = SITE_CONFIG.headline;
  }
}

/* ============================================================
   PROJECTS — fetch JSON and render
   ============================================================ */

async function renderProjects() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  try {
    const res = await fetch(SITE_CONFIG.projectsData);
    if (!res.ok) throw new Error('Could not load projects.json');
    const projects = await res.json();

    container.innerHTML = '';

    projects.forEach(project => {
      container.appendChild(buildProjectEntry(project));
    });

  } catch (err) {
    container.innerHTML = `<p class="loading">Could not load projects. (${err.message})</p>`;
  }
}

function buildProjectEntry(project) {
  const article = document.createElement('article');
  article.className = 'project-entry';

  // Image
  let imageHtml;
  if (project.image) {
    imageHtml = `<img
      class="project-image"
      src="${escapeHtml(project.image)}"
      alt="${escapeHtml(project.title)}"
      loading="lazy"
    />`;
  } else {
    imageHtml = `<div class="project-image-placeholder">No image</div>`;
  }

  // Tags
  const tagsHtml = (project.tags || [])
    .map(tag => `<span class="project-tag">${escapeHtml(tag)}</span>`)
    .join('');

  // Details (two-column: learned + approach)
  let detailsHtml = '';
  if (project.thingsLearned || project.approach) {
    detailsHtml = `<div class="project-details">`;
    if (project.thingsLearned) {
      detailsHtml += `
        <div class="project-detail-block">
          <h4>Things Learned</h4>
          <p>${escapeHtml(project.thingsLearned)}</p>
        </div>`;
    }
    if (project.approach) {
      detailsHtml += `
        <div class="project-detail-block">
          <h4>Approach</h4>
          <p>${escapeHtml(project.approach)}</p>
        </div>`;
    }
    detailsHtml += `</div>`;
  }

  // Link
  const linkHtml = project.link
    ? `<a class="project-link" href="${escapeHtml(project.link)}" target="_blank" rel="noopener">
        View project
       </a>`
    : '';

  article.innerHTML = `
    ${imageHtml}
    <h2 class="project-title">${escapeHtml(project.title)}</h2>
    <p class="project-description">${escapeHtml(project.description)}</p>
    <div class="project-tags">${tagsHtml}</div>
    ${detailsHtml}
    ${linkHtml}
  `;

  return article;
}

/* ============================================================
   MARKDOWN PAGES — fetch .md and convert to HTML
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
    container.innerHTML = `<p class="loading">Could not load page. (${err.message})</p>`;
  }
}

/**
 * parseMarkdown — lightweight Markdown → HTML converter
 *
 * Supports:
 *   - # h1, ## h2, ### h3
 *   - **bold**, *italic/em*
 *   - [link](url)
 *   - - unordered lists
 *   - 1. ordered lists
 *   - --- horizontal rules
 *   - Paragraphs (blank-line separated)
 */
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

    // Headings
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

    // HR
    if (/^---+$/.test(line.trim())) {
      flushPara(); closeList();
      html += '<hr />\n';
      continue;
    }

    // Unordered list
    if (/^- (.+)/.test(line)) {
      flushPara();
      if (!inUl) { if (inOl) { html += '</ol>\n'; inOl = false; } html += '<ul>\n'; inUl = true; }
      html += `<li>${inlineMarkdown(line.replace(/^- /, ''))}</li>\n`;
      continue;
    }

    // Ordered list
    if (/^\d+\. (.+)/.test(line)) {
      flushPara();
      if (!inOl) { if (inUl) { html += '</ul>\n'; inUl = false; } html += '<ol>\n'; inOl = true; }
      html += `<li>${inlineMarkdown(line.replace(/^\d+\. /, ''))}</li>\n`;
      continue;
    }

    // Blank line = paragraph break
    if (line.trim() === '') {
      flushPara(); closeList();
      continue;
    }

    // Non-list text after an open list = close list first
    if (inUl || inOl) {
      closeList();
    }

    // Accumulate paragraph lines
    para.push(line);
  }

  flushPara();
  closeList();

  return html;
}

function inlineMarkdown(text) {
  return text
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links [text](url)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

/* ============================================================
   UTILITIES
   ============================================================ */

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
