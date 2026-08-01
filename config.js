const SITE_CONFIG = {
  // Name in title tags
  name: 'Francisco Zorrilla',

  // The text top-left
  logo: 'Francisco',

  // Short bio shown in the top bar on the home page only
  shortBio: 'I\'m a game developer and game designer currently studying at the Centre for Digital Media, based in Vancouver, Canada. I studied Operations Research and IT Engineering at Universidad Católica de Chile',

  // Homepage tagline (the large text under "Projects" heading)
  headline: 'Francisco Zorrilla - Game Developer & Designer Portfolio',

  // Project id from projects.json shown as the full-width highlighted row
  highlightedProjectId: 'project-01',

  // Home "About me" block (replaces the top bar on index.html)
  homeAbout: {
    photo: 'images/PersonalPhoto/portrait.jpg',
    lines: [
      'I am a Game Developer and Designer currently completing my Master of Digital Media at the Centre for Digital Media in Vancouver, Canada.',
      'My background in Operations Research and as a Financial Analyst drives how I approach game systems design, economy balancing, and team leadership.',
      'I build games from concept to code in Unity and Unreal Engine, focusing on intuitive mechanics, UI/UX implementation, and responsive game feel.',
      'Driven by a passion for game design, I have published 450+ reviews analyzing what makes core progression loops and mechanics engaging.',
    ],
  },

  // Navigation labels (and their hrefs)
  nav: [
    { label: 'Projects', href: 'index.html' },
    { label: 'About Me',    href: 'about.html' },
    { label: 'Resume',   href: 'resume.html' },
  ],

  // Path to your projects JSON file
  projectsData: 'data/projects.json',

  // Individual project pages (query: ?id=project-01)
  projectPage: 'project.html',

  // Path to your about markdown
  aboutMarkdown: 'pages/about.md',

  // Path to your resume markdown
  resumeMarkdown: 'pages/resume.md',
};
