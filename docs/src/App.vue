<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

// Navigation structure
const nav = [
  { title: 'Home', path: '/', file: () => import('../index.md') },
  { title: 'Getting Started', path: '/getting-started', file: () => import('../getting-started.md') },
  { title: 'Architecture', path: '/architecture', file: () => import('../architecture.md') },
  {
    title: 'Packages',
    children: [
      { title: 'vite-plugin-ox-content', path: '/packages/vite-plugin', file: () => import('../packages/vite-plugin-ox-content.md') },
      { title: 'Vue Integration', path: '/packages/vue', file: () => import('../packages/vite-plugin-ox-content-vue.md') },
      { title: 'React Integration', path: '/packages/react', file: () => import('../packages/vite-plugin-ox-content-react.md') },
      { title: 'Svelte Integration', path: '/packages/svelte', file: () => import('../packages/vite-plugin-ox-content-svelte.md') },
    ],
  },
  {
    title: 'Examples',
    children: [
      { title: 'Basic SSG', path: '/examples/ssg-vite', file: () => import('../examples/ssg-vite.md') },
      { title: 'Vue Integration', path: '/examples/integ-vue', file: () => import('../examples/integ-vue.md') },
      { title: 'React Integration', path: '/examples/integ-react', file: () => import('../examples/integ-react.md') },
      { title: 'Svelte Integration', path: '/examples/integ-svelte', file: () => import('../examples/integ-svelte.md') },
    ],
  },
];

const currentPath = ref(window.location.hash.slice(1) || '/');
const content = ref<{ html: string; frontmatter: Record<string, unknown>; toc: any[] } | null>(null);
const sidebarOpen = ref(true);

// Find current nav item
function findNavItem(items: any[], path: string): any {
  for (const item of items) {
    if (item.path === path) return item;
    if (item.children) {
      const found = findNavItem(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

async function loadContent(path: string) {
  const item = findNavItem(nav, path);
  if (item?.file) {
    try {
      const mod = await item.file();
      content.value = mod.default || mod;
    } catch (e) {
      content.value = { html: '<p>Page not found</p>', frontmatter: {}, toc: [] };
    }
  }
}

function navigate(path: string) {
  currentPath.value = path;
  window.location.hash = path;
  loadContent(path);
}

onMounted(() => {
  loadContent(currentPath.value);
  window.addEventListener('hashchange', () => {
    currentPath.value = window.location.hash.slice(1) || '/';
    loadContent(currentPath.value);
  });
});

const pageTitle = computed(() => {
  const item = findNavItem(nav, currentPath.value);
  return item?.title || 'Ox Content';
});
</script>

<template>
  <div class="docs-app">
    <!-- Header -->
    <header class="header">
      <button class="menu-btn" @click="sidebarOpen = !sidebarOpen">
        <span></span><span></span><span></span>
      </button>
      <a href="#/" class="logo" @click.prevent="navigate('/')">
        <span class="logo-icon">OX</span>
        <span class="logo-text">Content</span>
      </a>
      <nav class="header-nav">
        <a href="https://github.com/ubugeeei/ox-content" target="_blank">GitHub</a>
      </nav>
    </header>

    <div class="main-container">
      <!-- Sidebar -->
      <aside class="sidebar" :class="{ open: sidebarOpen }">
        <nav class="sidebar-nav">
          <template v-for="item in nav" :key="item.path || item.title">
            <template v-if="item.children">
              <div class="nav-group">
                <div class="nav-group-title">{{ item.title }}</div>
                <a
                  v-for="child in item.children"
                  :key="child.path"
                  :href="'#' + child.path"
                  class="nav-link"
                  :class="{ active: currentPath === child.path }"
                  @click.prevent="navigate(child.path)"
                >
                  {{ child.title }}
                </a>
              </div>
            </template>
            <a
              v-else
              :href="'#' + item.path"
              class="nav-link"
              :class="{ active: currentPath === item.path }"
              @click.prevent="navigate(item.path)"
            >
              {{ item.title }}
            </a>
          </template>
        </nav>
      </aside>

      <!-- Content -->
      <main class="content-area">
        <article class="content" v-if="content">
          <div v-html="content.html"></div>
        </article>
        <div v-else class="loading">Loading...</div>
      </main>

      <!-- TOC -->
      <aside class="toc" v-if="content?.toc?.length">
        <div class="toc-title">On this page</div>
        <nav class="toc-nav">
          <a
            v-for="item in content.toc"
            :key="item.slug"
            :href="'#' + item.slug"
            class="toc-link"
            :style="{ paddingLeft: (item.depth - 1) * 12 + 'px' }"
          >
            {{ item.text }}
          </a>
        </nav>
      </aside>
    </div>
  </div>
</template>

<style>
:root {
  --bg-color: #1a1a1a;
  --sidebar-bg: #161618;
  --header-bg: #1b1b1f;
  --text-color: #ffffffde;
  --text-muted: #ffffffa6;
  --accent-color: #bd34fe;
  --accent-hover: #cc4dff;
  --border-color: #2e2e32;
  --code-bg: #161618;
  --link-color: #41d1ff;
  --gradient-start: #bd34fe;
  --gradient-end: #41d1ff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.7;
}

.docs-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  z-index: 100;
}

.menu-btn {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  margin-right: 1rem;
}

.menu-btn span {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text-color);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.25rem;
}

.logo-icon {
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 700;
}

.logo-text {
  color: var(--text-color);
}

.header-nav {
  margin-left: auto;
}

.header-nav a {
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.header-nav a:hover {
  color: var(--text-color);
  background: var(--border-color);
}

/* Main Layout */
.main-container {
  display: flex;
  margin-top: 60px;
  min-height: calc(100vh - 60px);
}

/* Sidebar */
.sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 260px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  padding: 1.5rem 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-group {
  margin: 0.5rem 0;
}

.nav-group-title {
  padding: 0.5rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.nav-link {
  display: block;
  padding: 0.5rem 1.5rem;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
  border-left: 2px solid transparent;
}

.nav-link:hover {
  color: var(--text-color);
  background: rgba(255, 255, 255, 0.03);
}

.nav-link.active {
  color: var(--accent-color);
  border-left-color: var(--accent-color);
  background: rgba(189, 52, 254, 0.1);
}

/* Content */
.content-area {
  flex: 1;
  margin-left: 260px;
  margin-right: 200px;
  padding: 2rem 3rem;
  max-width: 900px;
}

.content h1 {
  font-size: 2.25rem;
  margin-bottom: 1rem;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.content h2 {
  font-size: 1.5rem;
  margin: 2rem 0 1rem;
  color: var(--text-color);
}

.content h3 {
  font-size: 1.25rem;
  margin: 1.5rem 0 0.75rem;
  color: var(--text-color);
}

.content p {
  margin: 1rem 0;
  color: var(--text-muted);
}

.content a {
  color: var(--link-color);
  text-decoration: none;
}

.content a:hover {
  text-decoration: underline;
}

.content code {
  background: var(--code-bg);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 0.9em;
}

.content pre {
  background: var(--code-bg);
  padding: 1rem 1.25rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5rem 0;
  border: 1px solid var(--border-color);
}

.content pre code {
  background: none;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.6;
}

.content ul,
.content ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: var(--text-muted);
}

.content li {
  margin: 0.5rem 0;
}

.content blockquote {
  border-left: 3px solid var(--accent-color);
  margin: 1.5rem 0;
  padding: 0.5rem 1rem;
  background: rgba(189, 52, 254, 0.1);
  border-radius: 0 8px 8px 0;
}

.content blockquote p {
  margin: 0;
}

.content strong {
  color: var(--text-color);
}

/* TOC */
.toc {
  position: fixed;
  top: 80px;
  right: 1rem;
  width: 180px;
  font-size: 0.8rem;
}

.toc-title {
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-color);
}

.toc-link {
  padding: 0.25rem 0.75rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.2s;
}

.toc-link:hover {
  color: var(--accent-color);
}

.loading {
  padding: 2rem;
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 1200px) {
  .toc {
    display: none;
  }
  .content-area {
    margin-right: 0;
  }
}

@media (max-width: 768px) {
  .menu-btn {
    display: flex;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s;
    z-index: 50;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .content-area {
    margin-left: 0;
    padding: 1.5rem;
  }
}
</style>
