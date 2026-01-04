import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { oxContent } from 'vite-plugin-ox-content';
import { oxContentVue } from 'vite-plugin-ox-content-vue';

/**
 * Ox Content Documentation Site
 *
 * Dogfooding: Using ox-content to build ox-content's own documentation.
 */
export default defineConfig({
  // Site base path (for GitHub Pages)
  base: '/ox-content/',

  plugins: [
    vue(),

    oxContent({
      srcDir: '.',
      outDir: 'dist/docs',
      base: '/ox-content/',

      // Auto-generate API docs from source
      docs: {
        enabled: true,
        src: ['../packages/vite-plugin-ox-content/src'],
        out: 'api',
        include: ['**/*.ts'],
        exclude: ['**/*.test.*'],
        toc: true,
        groupBy: 'file',
      },

      // OG Image generation
      ogImage: true,
      ogImageOptions: {
        background: '#1a1a2e',
        textColor: '#ffffff',
        accentColor: '#e94560',
      },
    }),

    oxContentVue({
      srcDir: '.',
      components: './src/components/*.vue',
    }),
  ],

  build: {
    outDir: 'dist/docs',
  },
});
