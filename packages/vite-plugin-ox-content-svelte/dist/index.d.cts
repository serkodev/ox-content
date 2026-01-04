import { PluginOption } from 'vite';
import { OxContentOptions } from 'vite-plugin-ox-content';
export { oxContent } from 'vite-plugin-ox-content';

type ComponentsMap = Record<string, string>;
/**
 * Component registration options.
 * Can be a map, a glob pattern, or an array of glob patterns.
 */
type ComponentsOption = ComponentsMap | string | string[];
interface SvelteIntegrationOptions extends OxContentOptions {
    /**
     * Components to register for use in Markdown.
     * Can be a map of names to paths, a glob pattern, or an array of globs.
     * When using glob patterns, component names are derived from file names.
     *
     * @example
     * ```ts
     * // Glob pattern (recommended)
     * components: './src/components/*.svelte'
     *
     * // Explicit map
     * components: { Counter: './src/components/Counter.svelte' }
     * ```
     */
    components?: ComponentsOption;
    runes?: boolean;
}
interface ResolvedSvelteOptions {
    srcDir: string;
    outDir: string;
    base: string;
    gfm: boolean;
    frontmatter: boolean;
    toc: boolean;
    tocMaxDepth: number;
    components: ComponentsMap;
    runes: boolean;
}
interface SvelteTransformResult {
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
 * Vite Plugin for Ox Content Svelte Integration
 *
 * Uses Vite's Environment API to enable embedding Svelte components in Markdown.
 */

/**
 * Creates the Ox Content Svelte integration plugin.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { svelte } from '@sveltejs/vite-plugin-svelte';
 * import { oxContentSvelte } from 'vite-plugin-ox-content-svelte';
 *
 * export default defineConfig({
 *   plugins: [
 *     svelte(),
 *     oxContentSvelte({
 *       srcDir: 'docs',
 *       components: {
 *         Counter: './src/components/Counter.svelte',
 *       },
 *     }),
 *   ],
 * });
 * ```
 */
declare function oxContentSvelte(options?: SvelteIntegrationOptions): PluginOption[];

export { type ComponentSlot, type ComponentsMap, type ComponentsOption, type ResolvedSvelteOptions, type SvelteIntegrationOptions, type SvelteTransformResult, oxContentSvelte };
