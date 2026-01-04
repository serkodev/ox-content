/**
 * Type definitions for vite-plugin-ox-content
 */

/**
 * Plugin options.
 */
export interface OxContentOptions {
  /**
   * Source directory for Markdown files.
   * @default 'docs'
   */
  srcDir?: string;

  /**
   * Output directory for built files.
   * @default 'dist'
   */
  outDir?: string;

  /**
   * Base path for the site.
   * @default '/'
   */
  base?: string;

  /**
   * Enable GitHub Flavored Markdown extensions.
   * @default true
   */
  gfm?: boolean;

  /**
   * Enable footnotes.
   * @default true
   */
  footnotes?: boolean;

  /**
   * Enable tables.
   * @default true
   */
  tables?: boolean;

  /**
   * Enable task lists.
   * @default true
   */
  taskLists?: boolean;

  /**
   * Enable strikethrough.
   * @default true
   */
  strikethrough?: boolean;

  /**
   * Enable syntax highlighting for code blocks.
   * @default false
   */
  highlight?: boolean;

  /**
   * Syntax highlighting theme.
   * @default 'github-dark'
   */
  highlightTheme?: string;

  /**
   * Parse YAML frontmatter.
   * @default true
   */
  frontmatter?: boolean;

  /**
   * Generate table of contents.
   * @default true
   */
  toc?: boolean;

  /**
   * Maximum heading depth for TOC.
   * @default 3
   */
  tocMaxDepth?: number;

  /**
   * Enable OG image generation.
   * @default false
   */
  ogImage?: boolean;

  /**
   * OG image generation options.
   */
  ogImageOptions?: OgImageOptions;

  /**
   * Custom AST transformers.
   */
  transformers?: MarkdownTransformer[];
}

/**
 * Resolved options with all defaults applied.
 */
export interface ResolvedOptions {
  srcDir: string;
  outDir: string;
  base: string;
  gfm: boolean;
  footnotes: boolean;
  tables: boolean;
  taskLists: boolean;
  strikethrough: boolean;
  highlight: boolean;
  highlightTheme: string;
  frontmatter: boolean;
  toc: boolean;
  tocMaxDepth: number;
  ogImage: boolean;
  ogImageOptions: OgImageOptions;
  transformers: MarkdownTransformer[];
}

/**
 * OG image generation options.
 */
export interface OgImageOptions {
  /**
   * Background color.
   * @default '#1a1a2e'
   */
  background?: string;

  /**
   * Text color.
   * @default '#ffffff'
   */
  textColor?: string;

  /**
   * Accent color.
   * @default '#e94560'
   */
  accentColor?: string;

  /**
   * Font family.
   */
  fontFamily?: string;

  /**
   * Image width.
   * @default 1200
   */
  width?: number;

  /**
   * Image height.
   * @default 630
   */
  height?: number;
}

/**
 * Custom AST transformer.
 */
export interface MarkdownTransformer {
  /**
   * Transformer name.
   */
  name: string;

  /**
   * Transform function.
   */
  transform: (ast: MarkdownNode, context: TransformContext) => MarkdownNode | Promise<MarkdownNode>;
}

/**
 * Transform context passed to transformers.
 */
export interface TransformContext {
  /**
   * File path being processed.
   */
  filePath: string;

  /**
   * Frontmatter data.
   */
  frontmatter: Record<string, unknown>;

  /**
   * Resolved plugin options.
   */
  options: ResolvedOptions;
}

/**
 * Markdown AST node (simplified for TypeScript).
 */
export interface MarkdownNode {
  type: string;
  children?: MarkdownNode[];
  value?: string;
  [key: string]: unknown;
}

/**
 * Transform result.
 */
export interface TransformResult {
  /**
   * Generated JavaScript code.
   */
  code: string;

  /**
   * Source map.
   */
  map?: unknown;

  /**
   * Rendered HTML.
   */
  html: string;

  /**
   * Parsed frontmatter.
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
export interface TocEntry {
  /**
   * Heading depth (1-6).
   */
  depth: number;

  /**
   * Heading text.
   */
  text: string;

  /**
   * Slug/ID for linking.
   */
  slug: string;

  /**
   * Child entries.
   */
  children: TocEntry[];
}
