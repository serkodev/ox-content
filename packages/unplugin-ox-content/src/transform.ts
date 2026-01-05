/**
 * Markdown transformation logic for unplugin-ox-content.
 *
 * Supports multiple markdown ecosystems:
 * - markdown-it (default)
 * - unified (remark + rehype)
 */

import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import type Token from 'markdown-it/lib/token.mjs';
import type { ResolvedOptions, TransformResult, TocEntry } from './types';

/**
 * Converts text to URL-friendly slug.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Checks if unified ecosystem should be used.
 */
function shouldUseUnified(options: ResolvedOptions): boolean {
  return (
    options.plugin.remark.length > 0 || options.plugin.rehype.length > 0
  );
}

/**
 * Creates a configured markdown-it instance with TOC collection.
 */
function createMarkdownIt(
  options: ResolvedOptions,
  tocEntries: Array<{ depth: number; text: string; slug: string }>
): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: options.gfm,
    typographer: false,
  });

  // Add anchor plugin for heading IDs
  md.use(anchor, {
    slugify: (s: string) => slugify(s),
    permalink: false,
    callback: (token: Token, info: { title: string; slug: string }) => {
      if (options.toc && token.tag.match(/^h[1-6]$/)) {
        const depth = parseInt(token.tag[1], 10);
        if (depth <= options.tocMaxDepth) {
          tocEntries.push({
            depth,
            text: info.title,
            slug: info.slug,
          });
        }
      }
    },
  });

  // Apply user-provided markdown-it plugins
  for (const plugin of options.plugin.markdownIt) {
    if (Array.isArray(plugin)) {
      md.use(plugin[0], ...plugin.slice(1));
    } else {
      md.use(plugin);
    }
  }

  return md;
}

/**
 * Renders markdown using markdown-it.
 */
function renderWithMarkdownIt(
  content: string,
  options: ResolvedOptions
): { html: string; tocEntries: Array<{ depth: number; text: string; slug: string }> } {
  const tocEntries: Array<{ depth: number; text: string; slug: string }> = [];
  const md = createMarkdownIt(options, tocEntries);
  const html = md.render(content);
  return { html, tocEntries };
}

/**
 * Renders markdown using unified (remark + rehype).
 */
async function renderWithUnified(
  content: string,
  options: ResolvedOptions
): Promise<{ html: string; tocEntries: Array<{ depth: number; text: string; slug: string }> }> {
  const tocEntries: Array<{ depth: number; text: string; slug: string }> = [];

  // Build the unified processor dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let processor: any = unified().use(remarkParse);

  // Apply remark plugins
  for (const plugin of options.plugin.remark) {
    if (Array.isArray(plugin)) {
      processor = processor.use(plugin[0], plugin[1]);
    } else {
      processor = processor.use(plugin);
    }
  }

  // Convert to rehype
  processor = processor.use(remarkRehype);

  // Apply rehype plugins
  for (const plugin of options.plugin.rehype) {
    if (Array.isArray(plugin)) {
      processor = processor.use(plugin[0], plugin[1]);
    } else {
      processor = processor.use(plugin);
    }
  }

  // Stringify to HTML
  processor = processor.use(rehypeStringify);

  const result = await processor.process(content);
  const html = String(result);

  // Extract TOC from the content (simple regex for unified path)
  if (options.toc) {
    const headingRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>([^<]*)</g;
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      const depth = parseInt(match[1], 10);
      if (depth <= options.tocMaxDepth) {
        tocEntries.push({
          depth,
          text: match[3],
          slug: match[2],
        });
      }
    }
  }

  return { html, tocEntries };
}

/**
 * Transforms Markdown content into a JavaScript module.
 */
export async function transformMarkdown(
  source: string,
  filePath: string,
  options: ResolvedOptions
): Promise<TransformResult> {
  // Parse frontmatter
  const { data: frontmatter, content } = matter(source);

  // Render based on plugin configuration
  let html: string;
  let tocEntries: Array<{ depth: number; text: string; slug: string }>;

  if (shouldUseUnified(options)) {
    const result = await renderWithUnified(content, options);
    html = result.html;
    tocEntries = result.tocEntries;
  } else {
    const result = renderWithMarkdownIt(content, options);
    html = result.html;
    tocEntries = result.tocEntries;
  }

  // Apply ox-content native plugins
  for (const plugin of options.plugin.oxContent) {
    html = await plugin(html);
  }

  // Build TOC tree from collected entries
  const toc = options.toc ? buildTocTree(tocEntries) : [];

  // Generate JavaScript module code
  const code = generateModuleCode(html, frontmatter, toc, filePath);

  return {
    code,
    html,
    frontmatter,
    toc,
  };
}

/**
 * Builds nested TOC tree from flat list.
 */
function buildTocTree(
  entries: Array<{ depth: number; text: string; slug: string }>
): TocEntry[] {
  const result: TocEntry[] = [];
  const stack: TocEntry[] = [];

  for (const entry of entries) {
    const tocEntry: TocEntry = {
      depth: entry.depth,
      text: entry.text,
      slug: entry.slug,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].depth >= entry.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(tocEntry);
    } else {
      stack[stack.length - 1].children.push(tocEntry);
    }

    stack.push(tocEntry);
  }

  return result;
}

/**
 * Generates the JavaScript module code.
 */
function generateModuleCode(
  html: string,
  frontmatter: Record<string, unknown>,
  toc: TocEntry[],
  filePath: string
): string {
  const htmlJson = JSON.stringify(html);
  const frontmatterJson = JSON.stringify(frontmatter);
  const tocJson = JSON.stringify(toc);

  return `
// Generated by unplugin-ox-content
// Source: ${filePath}

export const html = ${htmlJson};
export const frontmatter = ${frontmatterJson};
export const toc = ${tocJson};

export default {
  html,
  frontmatter,
  toc,
};
`;
}
