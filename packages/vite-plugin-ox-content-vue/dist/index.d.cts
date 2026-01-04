import { PluginOption } from 'vite';
import { OxContentOptions } from 'vite-plugin-ox-content';
export { oxContent } from 'vite-plugin-ox-content';

/**
 * Type definitions for Vue integration plugin.
 */

/**
 * Component registration map.
 * Key is the component name to use in Markdown, value is the import path.
 */
type ComponentsMap = Record<string, string>;
/**
 * Component registration options.
 * Can be a map, a glob pattern, or an array of glob patterns.
 *
 * @example
 * ```ts
 * // Using a glob pattern
 * components: './src/components/*.vue'
 *
 * // Using multiple glob patterns
 * components: ['./src/components/*.vue', './src/ui/*.vue']
 *
 * // Using a map for explicit names
 * components: {
 *   Counter: './src/components/Counter.vue',
 * }
 * ```
 */
type ComponentsOption = ComponentsMap | string | string[];
/**
 * Vue integration plugin options.
 */
interface VueIntegrationOptions extends OxContentOptions {
    /**
     * Components to register for use in Markdown.
     * Can be a map of names to paths, a glob pattern, or an array of globs.
     * When using glob patterns, component names are derived from file names.
     *
     * @example
     * ```ts
     * // Glob pattern (recommended)
     * components: './src/components/*.vue'
     *
     * // Explicit map
     * components: {
     *   Counter: './src/components/Counter.vue',
     * }
     * ```
     */
    components?: ComponentsOption;
    /**
     * Enable Vue Reactivity Transform.
     * @default false
     */
    reactivityTransform?: boolean;
    /**
     * Enable custom blocks in Markdown (e.g., `:::tip`).
     * @default true
     */
    customBlocks?: boolean;
}
/**
 * Resolved Vue integration options with all defaults applied.
 */
interface ResolvedVueOptions {
    srcDir: string;
    outDir: string;
    base: string;
    gfm: boolean;
    frontmatter: boolean;
    toc: boolean;
    tocMaxDepth: number;
    components: ComponentsOption;
    reactivityTransform: boolean;
    customBlocks: boolean;
}
/**
 * Transform result with Vue component information.
 */
interface VueTransformResult {
    code: string;
    map: null;
    /**
     * List of components used in the Markdown.
     */
    usedComponents: string[];
    /**
     * Extracted frontmatter.
     */
    frontmatter: Record<string, unknown>;
}
/**
 * Slot information for component rendering.
 */
interface ComponentSlot {
    /**
     * Component name.
     */
    name: string;
    /**
     * Props to pass to the component.
     */
    props: Record<string, unknown>;
    /**
     * Position in the HTML output.
     */
    position: number;
    /**
     * Slot placeholder ID.
     */
    id: string;
}
/**
 * Parsed Markdown content with Vue component slots.
 */
interface ParsedMarkdownContent {
    /**
     * HTML content with slot placeholders.
     */
    html: string;
    /**
     * Component slots to render.
     */
    slots: ComponentSlot[];
    /**
     * Frontmatter data.
     */
    frontmatter: Record<string, unknown>;
    /**
     * Table of contents.
     */
    toc: TocEntry[];
}
/**
 * Table of contents entry.
 */
interface TocEntry {
    level: number;
    text: string;
    slug: string;
    children?: TocEntry[];
}

/**
 * Vite Plugin for Ox Content Vue Integration
 *
 * Uses Vite's Environment API to enable embedding Vue components in Markdown.
 * Provides SSR and client environments for proper hydration.
 */

/**
 * Creates the Ox Content Vue integration plugin with Environment API support.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import vue from '@vitejs/plugin-vue';
 * import { oxContentVue } from 'vite-plugin-ox-content-vue';
 *
 * export default defineConfig({
 *   plugins: [
 *     vue(),
 *     oxContentVue({
 *       srcDir: 'docs',
 *       components: {
 *         Counter: './src/components/Counter.vue',
 *       },
 *     }),
 *   ],
 * });
 * ```
 */
declare function oxContentVue(options?: VueIntegrationOptions): PluginOption[];

export { type ComponentSlot, type ComponentsMap, type ComponentsOption, type ParsedMarkdownContent, type ResolvedVueOptions, type TocEntry, type VueIntegrationOptions, type VueTransformResult, oxContentVue };
