/**
 * Vite Plugin for Ox Content
 *
 * Uses Vite's Environment API for SSG-focused Markdown processing.
 * Provides separate environments for client and server rendering.
 */

import type { Plugin, ViteDevServer, ResolvedConfig } from 'vite';
import { createMarkdownEnvironment } from './environment';
import { transformMarkdown } from './transform';
import type { OxContentOptions, ResolvedOptions } from './types';

export type { OxContentOptions } from './types';

/**
 * Creates the Ox Content Vite plugin.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { oxContent } from 'vite-plugin-ox-content';
 *
 * export default defineConfig({
 *   plugins: [
 *     oxContent({
 *       srcDir: 'docs',
 *       gfm: true,
 *     }),
 *   ],
 * });
 * ```
 */
export function oxContent(options: OxContentOptions = {}): Plugin[] {
  const resolvedOptions = resolveOptions(options);
  let config: ResolvedConfig;
  let server: ViteDevServer | undefined;

  const mainPlugin: Plugin = {
    name: 'ox-content',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(devServer) {
      server = devServer;

      // Add middleware for serving Markdown files
      devServer.middlewares.use(async (req, res, next) => {
        const url = req.url;
        if (!url || !url.endsWith('.md')) {
          return next();
        }

        // Let Vite handle the transformation
        next();
      });
    },

    resolveId(id) {
      // Handle virtual modules for Markdown imports
      if (id.startsWith('virtual:ox-content/')) {
        return '\0' + id;
      }

      // Resolve .md files
      if (id.endsWith('.md')) {
        return id;
      }

      return null;
    },

    async load(id) {
      // Handle virtual modules
      if (id.startsWith('\0virtual:ox-content/')) {
        const path = id.slice('\0virtual:ox-content/'.length);
        return generateVirtualModule(path, resolvedOptions);
      }

      return null;
    },

    async transform(code, id) {
      if (!id.endsWith('.md')) {
        return null;
      }

      // Transform Markdown to JavaScript module
      const result = await transformMarkdown(code, id, resolvedOptions);

      return {
        code: result.code,
        map: result.map,
      };
    },

    // Hot Module Replacement support
    async handleHotUpdate({ file, server }) {
      if (file.endsWith('.md')) {
        // Notify client about the update
        server.ws.send({
          type: 'custom',
          event: 'ox-content:update',
          data: { file },
        });

        // Return empty array to prevent default HMR
        // We handle it ourselves
        const modules = server.moduleGraph.getModulesByFile(file);
        return modules ? Array.from(modules) : [];
      }
    },
  };

  // Environment API plugin for SSG
  const environmentPlugin: Plugin = {
    name: 'ox-content:environment',

    config() {
      return {
        environments: {
          // Markdown processing environment
          markdown: createMarkdownEnvironment(resolvedOptions),
        },
      };
    },
  };

  return [mainPlugin, environmentPlugin];
}

/**
 * Resolves plugin options with defaults.
 */
function resolveOptions(options: OxContentOptions): ResolvedOptions {
  return {
    srcDir: options.srcDir ?? 'docs',
    outDir: options.outDir ?? 'dist',
    base: options.base ?? '/',
    gfm: options.gfm ?? true,
    footnotes: options.footnotes ?? true,
    tables: options.tables ?? true,
    taskLists: options.taskLists ?? true,
    strikethrough: options.strikethrough ?? true,
    highlight: options.highlight ?? false,
    highlightTheme: options.highlightTheme ?? 'github-dark',
    frontmatter: options.frontmatter ?? true,
    toc: options.toc ?? true,
    tocMaxDepth: options.tocMaxDepth ?? 3,
    ogImage: options.ogImage ?? false,
    ogImageOptions: options.ogImageOptions ?? {},
    transformers: options.transformers ?? [],
  };
}

/**
 * Generates virtual module content.
 */
function generateVirtualModule(
  path: string,
  options: ResolvedOptions
): string {
  if (path === 'config') {
    return `export default ${JSON.stringify(options)};`;
  }

  if (path === 'runtime') {
    return `
      export function useMarkdown() {
        return {
          render: (content) => {
            // Client-side rendering if needed
            return content;
          },
        };
      }
    `;
  }

  return 'export default {};';
}

// Re-export types and utilities
export { createMarkdownEnvironment } from './environment';
export { transformMarkdown } from './transform';
export * from './types';
