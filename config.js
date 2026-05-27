/**
 * config.js — Site-wide configuration
 * =====================================
 * Edit this file to update your site's identity,
 * navigation labels, and homepage text.
 */

const SITE_CONFIG = {
  // Your name shown in <title> tags
  name: 'Francisco Zorrilla',

  // The logo text top-left
  logo: 'Francisco',

  // Short bio shown in the top bar on the home page only
  // Keep this to one sentence or two short ones.
  shortBio: 'Francisco is a game developer and designer based in Vancouver, Canada. Studied Operations Research and IT Engineering at Universidad Católica de Chile.',

  // Homepage tagline (the large text under "Projects" heading)
  headline: 'Game Development and Design Portfolio',

  // Navigation labels (and their hrefs)
  nav: [
    { label: 'Projects', href: 'index.html' },
    { label: 'About',    href: 'about.html' },
    { label: 'Resume',   href: 'resume.html' },
  ],

  // Path to your projects JSON file
  projectsData: 'data/projects.json',

  // Path to your about markdown
  aboutMarkdown: 'pages/about.md',

  // Path to your resume markdown
  resumeMarkdown: 'pages/resume.md',
};
