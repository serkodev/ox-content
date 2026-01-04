# Ox Content

A VoidZero Oxc family project - Framework-agnostic documentation tooling for Vite+.

## What is Ox Content?

Ox Content is a high-performance documentation toolkit built in Rust, designed to bring the speed and reliability of the Oxc ecosystem to Markdown processing. It provides everything you need to build documentation sites, technical blogs, and content-driven applications.

### Why Ox Content?

| Feature | Ox Content | Traditional JS Parsers |
|---------|------------|------------------------|
| Parse Speed | **~10x faster** | Baseline |
| Memory Usage | **Zero-copy** | Multiple allocations |
| Type Safety | **Rust + TypeScript** | Runtime checks only |
| AST Spec | **mdast compatible** | Varies by library |
| Bundle Size | **Native binary** | Large JS bundles |

### Core Philosophy

1. **Performance First** - Arena-based allocation for zero-copy parsing
2. **Standards Compliant** - Full CommonMark + GFM support with mdast-compatible AST
3. **Framework Agnostic** - Works with any JavaScript framework via NAPI
4. **Developer Experience** - Excellent TypeScript types and error messages

## Features

### Blazing Fast Markdown Parser

The parser uses [bumpalo](https://docs.rs/bumpalo) arena allocation for maximum performance:

```rust
use ox_content_allocator::Allocator;
use ox_content_parser::Parser;

let allocator = Allocator::new();
let parser = Parser::new(&allocator, "# Hello World");
let doc = parser.parse().unwrap();
// All AST nodes are allocated in the arena
// Freed all at once when allocator is dropped
```

### mdast-Compatible AST

The AST follows the [mdast](https://github.com/syntax-tree/mdast) specification, making it compatible with the unified ecosystem:

**Block Nodes:**
- `Document` - Root node containing all content
- `Paragraph` - Block of text
- `Heading` - h1-h6 headings with depth
- `CodeBlock` - Fenced (```) or indented code blocks
- `BlockQuote` - Quoted content (>)
- `List` / `ListItem` - Ordered and unordered lists
- `Table` / `TableRow` / `TableCell` - GFM tables
- `ThematicBreak` - Horizontal rules (---, ***, ___)
- `Html` - Raw HTML blocks

**Inline Nodes:**
- `Text` - Plain text content
- `Emphasis` - Italic (*text* or _text_)
- `Strong` - Bold (**text** or __text__)
- `InlineCode` - Inline code spans (`code`)
- `Link` - Hyperlinks [text](url)
- `Image` - Images ![alt](url)
- `Break` - Hard line breaks
- `Delete` - Strikethrough (~~text~~) (GFM)
- `FootnoteReference` - Footnote references (GFM)

### GFM Extensions

Full support for GitHub Flavored Markdown:

```markdown
| Feature | Status |
|---------|--------|
| Tables | ✅ |
| Task Lists | ✅ |
| Strikethrough | ✅ |
| Autolinks | ✅ |
| Footnotes | ✅ |

- [x] Completed task
- [ ] Pending task

~~deleted text~~

www.example.com (autolinked)

Here is a footnote[^1].

[^1]: Footnote content.
```

### Vite Environment API Integration

SSG-focused rendering with Astro-like islands architecture:

```typescript
// vite.config.ts
import { oxContent } from '@ox-content/vite';

export default {
  plugins: [
    oxContent({
      // Markdown source directory
      srcDir: 'docs',
      // Output directory
      outDir: 'dist',
      // Enable syntax highlighting
      highlight: true,
    })
  ]
};
```

### OG Image Generation

Automatic social media preview images for your content:

```typescript
import { generateOgImage } from '@ox-content/og-image';

const image = await generateOgImage({
  title: 'My Article Title',
  description: 'A brief description',
  background: '#1a1a2e',
  textColor: '#ffffff',
});
```

### Node.js Bindings

High-performance NAPI bindings for seamless JavaScript integration:

```javascript
import { parseMarkdown, parseAndRender } from '@ox-content/napi';

// Parse to AST
const ast = parseMarkdown('# Hello', { gfm: true });

// Parse and render in one call
const { html, frontmatter } = parseAndRender(content, {
  gfm: true,
  highlight: true,
});
```

## Crates Overview

| Crate | Description | Key Features |
|-------|-------------|--------------|
| `ox_content_allocator` | Arena allocator | bumpalo wrapper, Vec/Box/String types |
| `ox_content_ast` | AST definitions | mdast-compatible nodes, Visitor pattern |
| `ox_content_parser` | Markdown parser | CommonMark + GFM, streaming support |
| `ox_content_renderer` | HTML renderer | Customizable, XHTML support, sanitization |
| `ox_content_napi` | Node.js bindings | napi-rs, TypeScript types |
| `ox_content_vite` | Vite plugin | Environment API, HMR support |
| `ox_content_og_image` | OG images | SVG-based, customizable templates |
| `ox_content_docs` | Source docs | OXC-powered, cargo docs-like |

## Quick Links

- [Getting Started](./getting-started.md) - Installation and first steps
- [Architecture](./architecture.md) - Deep dive into the design
- [API Reference](./api/) - Generated Rust documentation
- [Playground](/playground/) - Try it in your browser
- [GitHub](https://github.com/ubugeeei/ox-content) - Source code and issues

## License

MIT License - Free for personal and commercial use.
