/**
 * Ox Content documentation configuration
 * This file configures the self-hosted documentation site
 */

export default {
  title: 'Ox Content',
  description: 'Framework-agnostic documentation tooling for Vite+',

  // Source and output directories
  srcDir: 'docs',
  outDir: 'dist/docs',

  // Site base path (for GitHub Pages)
  base: '/ox-content/',

  // Theme configuration
  theme: {
    darkMode: true,
    primaryColor: '#e94560',
  },

  // Navigation
  nav: [
    { text: 'Home', link: '/' },
    { text: 'Getting Started', link: '/getting-started' },
    { text: 'Architecture', link: '/architecture' },
    { text: 'Playground', link: '/playground/' },
  ],

  // Sidebar
  sidebar: [
    {
      text: 'Introduction',
      items: [
        { text: 'What is Ox Content?', link: '/' },
        { text: 'Getting Started', link: '/getting-started' },
      ],
    },
    {
      text: 'Guide',
      items: [
        { text: 'Architecture', link: '/architecture' },
      ],
    },
  ],

  // Social links
  socialLinks: [
    { icon: 'github', link: 'https://github.com/ubugeeei/ox-content' },
  ],

  // OG Image generation
  ogImage: {
    enabled: true,
    background: '#1a1a2e',
    textColor: '#ffffff',
  },
};
