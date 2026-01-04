/**
 * Markdown transformation logic.
 *
 * Transforms Markdown source into JavaScript modules
 * that can be imported by the application.
 */

import type { ResolvedOptions, TransformResult, TocEntry } from './types';

/**
 * Transforms Markdown content into a JavaScript module.
 *
 * The generated module exports:
 * - `html`: The rendered HTML string
 * - `frontmatter`: Parsed YAML frontmatter object
 * - `toc`: Table of contents array
 * - `render`: Function to render with custom options
 */
export async function transformMarkdown(
  source: string,
  filePath: string,
  options: ResolvedOptions
): Promise<TransformResult> {
  // Parse frontmatter
  const { content, frontmatter } = parseFrontmatter(source);

  // Generate table of contents
  const toc = options.toc ? generateToc(content, options.tocMaxDepth) : [];

  // Render HTML
  // In production, this would use @ox-content/napi
  const html = renderToHtml(content, options);

  // Generate JavaScript module code
  const code = generateModuleCode(html, frontmatter, toc, filePath, options);

  return {
    code,
    html,
    frontmatter,
    toc,
  };
}

/**
 * Parses YAML frontmatter from Markdown content.
 */
function parseFrontmatter(source: string): {
  content: string;
  frontmatter: Record<string, unknown>;
} {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
  const match = source.match(frontmatterRegex);

  if (!match) {
    return { content: source, frontmatter: {} };
  }

  const frontmatterStr = match[1];
  const content = source.slice(match[0].length);

  // Simple YAML parsing (in production, use a proper YAML parser)
  const frontmatter: Record<string, unknown> = {};
  const lines = frontmatterStr.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value: unknown = line.slice(colonIndex + 1).trim();

      // Parse basic types
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(Number(value)) && value !== '') value = Number(value);
      else if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      frontmatter[key] = value;
    }
  }

  return { content, frontmatter };
}

/**
 * Generates table of contents from Markdown content.
 */
function generateToc(content: string, maxDepth: number): TocEntry[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const entries: TocEntry[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length;
    if (depth > maxDepth) continue;

    const text = match[2].trim();
    const slug = slugify(text);

    entries.push({
      depth,
      text,
      slug,
      children: [],
    });
  }

  // Build nested structure
  return buildTocTree(entries);
}

/**
 * Builds nested TOC tree from flat list.
 */
function buildTocTree(entries: TocEntry[]): TocEntry[] {
  const root: TocEntry[] = [];
  const stack: TocEntry[] = [];

  for (const entry of entries) {
    // Pop stack until we find a parent with smaller depth
    while (stack.length > 0 && stack[stack.length - 1].depth >= entry.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(entry);
    } else {
      stack[stack.length - 1].children.push(entry);
    }

    stack.push(entry);
  }

  return root;
}

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
 * Renders Markdown content to HTML.
 *
 * In production, this uses @ox-content/napi for high-performance rendering.
 * This is a fallback implementation for development.
 */
function renderToHtml(content: string, options: ResolvedOptions): string {
  // TODO: Replace with actual @ox-content/napi call
  // import { parseAndRender } from '@ox-content/napi';
  // const result = parseAndRender(content, {
  //   gfm: options.gfm,
  //   footnotes: options.footnotes,
  //   tables: options.tables,
  //   taskLists: options.taskLists,
  //   strikethrough: options.strikethrough,
  // });
  // return result.html;

  // Fallback: Simple Markdown rendering
  let html = content
    // Headers with IDs for linking
    .replace(/^### (.+)$/gm, (_, text) => `<h3 id="${slugify(text)}">${text}</h3>`)
    .replace(/^## (.+)$/gm, (_, text) => `<h2 id="${slugify(text)}">${text}</h2>`)
    .replace(/^# (.+)$/gm, (_, text) => `<h1 id="${slugify(text)}">${text}</h1>`)
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const langClass = lang ? ` class="language-${lang}"` : '';
      return `<pre><code${langClass}>${escapeHtml(code)}</code></pre>`;
    })
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Task lists (GFM)
    .replace(/^- \[x\] (.+)$/gm, '<li class="task-list-item"><input type="checkbox" checked disabled> $1</li>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="task-list-item"><input type="checkbox" disabled> $1</li>')
    // Regular lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>');

  return `<div class="ox-content">${html}</div>`;
}

/**
 * Escapes HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates the JavaScript module code.
 */
function generateModuleCode(
  html: string,
  frontmatter: Record<string, unknown>,
  toc: TocEntry[],
  filePath: string,
  options: ResolvedOptions
): string {
  const htmlJson = JSON.stringify(html);
  const frontmatterJson = JSON.stringify(frontmatter);
  const tocJson = JSON.stringify(toc);

  return `
// Generated by vite-plugin-ox-content
// Source: ${filePath}

/**
 * Rendered HTML content.
 */
export const html = ${htmlJson};

/**
 * Parsed frontmatter.
 */
export const frontmatter = ${frontmatterJson};

/**
 * Table of contents.
 */
export const toc = ${tocJson};

/**
 * Default export with all data.
 */
export default {
  html,
  frontmatter,
  toc,
};

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      // Trigger re-render with new content
      import.meta.hot.invalidate();
    }
  });
}
`;
}

/**
 * Extracts imports from Markdown content.
 *
 * Supports importing components for interactive islands.
 */
export function extractImports(content: string): string[] {
  const importRegex = /^import\s+.+\s+from\s+['"](.+)['"]/gm;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}
