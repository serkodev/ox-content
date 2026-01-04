import { PluginOption } from 'vite';
import { OxContentOptions } from 'vite-plugin-ox-content';
export { oxContent } from 'vite-plugin-ox-content';

type ComponentsMap = Record<string, string>;
/**
 * Component registration options.
 * Can be a map, a glob pattern, or an array of glob patterns.
 */
type ComponentsOption = ComponentsMap | string | string[];
interface ReactIntegrationOptions extends OxContentOptions {
    /**
     * Components to register for use in Markdown.
     * Can be a map of names to paths, a glob pattern, or an array of globs.
     * When using glob patterns, component names are derived from file names.
     *
     * @example
     * ```ts
     * // Glob pattern (recommended)
     * components: './src/components/*.tsx'
     *
     * // Explicit map
     * components: { Counter: './src/components/Counter.tsx' }
     * ```
     */
    components?: ComponentsOption;
    jsxRuntime?: 'automatic' | 'classic';
}
interface ResolvedReactOptions {
    srcDir: string;
    outDir: string;
    base: string;
    gfm: boolean;
    frontmatter: boolean;
    toc: boolean;
    tocMaxDepth: number;
    components: ComponentsMap;
    jsxRuntime: 'automatic' | 'classic';
}
interface ReactTransformResult {
    code: string;
    map: null;
    usedComponents: string[];
    frontmatter: Record<string, unknown>;
}
interface ComponentSlot {
    name: string;
    props: Record<string, unknown>;
    position: number;
    id: string;
}

/**
 * Vite Plugin for Ox Content React Integration
 *
 * Uses Vite's Environment API to enable embedding React components in Markdown.
 */

/**
 * Creates the Ox Content React integration plugin.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import { oxContentReact } from 'vite-plugin-ox-content-react';
 *
 * export default defineConfig({
 *   plugins: [
 *     react(),
 *     oxContentReact({
 *       srcDir: 'docs',
 *       components: {
 *         Counter: './src/components/Counter.tsx',
 *       },
 *     }),
 *   ],
 * });
 * ```
 */
declare function oxContentReact(options?: ReactIntegrationOptions): PluginOption[];

export { type ComponentSlot, type ComponentsMap, type ComponentsOption, type ReactIntegrationOptions, type ReactTransformResult, type ResolvedReactOptions, oxContentReact };
