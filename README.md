# Ox Content

<p align="center">
  <img src="./assets/logo.svg" alt="Ox Content Logo" width="200" height="200" />
</p>

<p align="center">
  <strong>Framework-agnostic documentation tooling</strong><br>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#playground">Playground</a>
</p>

---

## Features

Ox Content provides high-performance documentation tooling built on the Oxc philosophy:

- **Blazing Fast Markdown Parser** - Arena-allocated parser with [bumpalo](https://docs.rs/bumpalo) for zero-copy parsing
- **mdast Compatible AST** - Full compatibility with the [mdast](https://github.com/syntax-tree/mdast) specification
- **GFM Extensions** - Tables, task lists, strikethrough, autolinks, and footnotes
- **Vite Environment API** - SSG-focused rendering (Astro-like) with minimal JavaScript
- **Plugin System** - Compatible with markdown-it, remark, and unified ecosystems
- **OG Image Generation** - Automatic social media preview images
- **Source Code Docs** - cargo docs-like documentation from source code using OXC
- **Node.js Bindings** - High-performance NAPI bindings via [napi-rs](https://napi.rs/)

## Crates

| Crate                                                   | Description                                 |
| ------------------------------------------------------- | ------------------------------------------- |
| [`ox_content_allocator`](./crates/ox_content_allocator) | Arena allocator wrapper around bumpalo      |
| [`ox_content_ast`](./crates/ox_content_ast)             | Markdown AST definitions (mdast compatible) |
| [`ox_content_parser`](./crates/ox_content_parser)       | High-performance Markdown parser            |
| [`ox_content_renderer`](./crates/ox_content_renderer)   | HTML and other format renderers             |
| [`ox_content_napi`](./crates/ox_content_napi)           | Node.js bindings via napi-rs                |
| [`ox_content_vite`](./crates/ox_content_vite)           | Vite Environment API integration            |
| [`ox_content_og_image`](./crates/ox_content_og_image)   | OG image generation                         |
| [`ox_content_docs`](./crates/ox_content_docs)           | Source code documentation generator         |

## Installation

### Prerequisites

- **Rust 1.83+** - [Install Rust](https://rustup.rs/)
- **Node.js 22+** - For NAPI bindings ([Install Node.js](https://nodejs.org/))
- **mise** - Recommended for environment setup ([Install mise](https://mise.jdx.dev/))

### Setup with mise (Recommended)

```bash
# Clone the repository
git clone https://github.com/ubugeeei/ox-content.git
cd ox-content

# Trust mise configuration and install dependencies
mise trust
mise install

# Build all crates
mise run build

# Run tests
mise run test
```

### Manual Setup

```bash
# Clone and build with cargo
git clone https://github.com/ubugeeei/ox-content.git
cd ox-content
cargo build --workspace
cargo test --workspace
```

## Quick Start

### Rust API

```rust
use ox_content_allocator::Allocator;
use ox_content_parser::{Parser, ParserOptions};
use ox_content_renderer::HtmlRenderer;

fn main() {
    // Create an arena allocator
    let allocator = Allocator::new();

    // Parse Markdown
    let source = r#"
# Hello World

This is a **bold** and *italic* text.

## Code Example

```rust
fn main() {
    println!("Hello from Ox Content!");
}
```
"#;

    let parser = Parser::new(&allocator, source);
    let document = parser.parse().expect("Failed to parse");

    // Render to HTML
    let mut renderer = HtmlRenderer::new();
    let html = renderer.render(&document);

    println!("{}", html);
}
```

### With GFM Extensions

```rust
use ox_content_allocator::Allocator;
use ox_content_parser::{Parser, ParserOptions};

let allocator = Allocator::new();
let source = r#"
| Feature    | Status |
| ---------- | ------ |
| Tables     | ✅      |
| Task Lists | ✅      |

- [x] Completed task
- [ ] Pending task

~~strikethrough~~
"#;

let options = ParserOptions::gfm();
let parser = Parser::with_options(&allocator, source, options);
let document = parser.parse().unwrap();
```

### Node.js API (via NAPI)

```javascript
import { parseMarkdown, parseAndRender } from '@ox-content/napi';

// Parse only (returns AST as JSON)
const ast = parseMarkdown('# Hello World', { gfm: true });
console.log(JSON.stringify(ast, null, 2));

// Parse and render to HTML
const result = parseAndRender('# Hello World\n\nParagraph text.', {
  gfm: true
});
console.log(result.html);
```

## Documentation

- [Getting Started](./docs/getting-started.md) - Installation and setup guide
- [Architecture](./docs/architecture.md) - Design principles and crate structure
- [API Reference](https://ubugeeei.github.io/ox-content/api/) - Generated Rust documentation

## Examples

Try Ox Content with various frameworks and tools:

| Example          | Description            | Command                 |
| ---------------- | ---------------------- | ----------------------- |
| Basic Playground | Interactive playground | `mise run playground`   |
| Vue 3            | Vue integration        | `mise run integ-vue`    |
| React 18         | React integration      | `mise run integ-react`  |
| Svelte 5         | Svelte integration     | `mise run integ-svelte` |
| Vite SSG         | Static site generation | `mise run ssg-vite`     |

See the [examples directory](./examples) for more integrations including markdown-it, rehype, and source code documentation.

## Development

### Available Tasks

```bash
# Development
mise run build          # Build all crates
mise run test           # Run all tests
mise run test-verbose   # Run tests with verbose output
mise run watch          # Watch for changes and run tests

# Code Quality
mise run fmt            # Format code
mise run fmt-check      # Check formatting
mise run clippy         # Run clippy lints
mise run lint           # Run all lints

# Pre-commit Check
mise run ready          # Run all checks (fmt, clippy, test)

# Examples
mise run install        # Install pnpm dependencies for examples
mise run playground     # Basic playground
mise run integ-vue      # Vue integration
mise run integ-react    # React integration
mise run integ-svelte   # Svelte integration
mise run ssg-vite       # Vite SSG
```

### Project Structure

```
ox-content/
├── Cargo.toml              # Workspace configuration
├── mise.toml               # mise task configuration
├── crates/
│   ├── ox_content_allocator/   # Arena allocator
│   ├── ox_content_ast/         # AST definitions + visitor pattern
│   ├── ox_content_parser/      # Markdown parser
│   ├── ox_content_renderer/    # HTML renderer
│   ├── ox_content_napi/        # Node.js bindings
│   ├── ox_content_vite/        # Vite integration
│   ├── ox_content_og_image/    # OG image generation
│   └── ox_content_docs/        # Source code docs generator
├── examples/               # Integration examples
├── packages/               # JavaScript packages (Vite plugin)
├── docs/                   # Documentation (self-hosted)
└── .github/workflows/      # CI/CD configuration
```

## Architecture Highlights

### Arena-Based Memory Management

Ox Content uses [bumpalo](https://docs.rs/bumpalo) for arena-based allocation:

- **Zero-Copy Parsing** - AST nodes reference the source directly
- **Fast Allocation** - Allocating is just bumping a pointer
- **Efficient Deallocation** - Entire arena freed at once when done
- **Cache-Friendly** - Related data stored contiguously in memory

### mdast-Compatible AST

The AST follows the [mdast](https://github.com/syntax-tree/mdast) specification:

**Block Nodes:**
- `Document`, `Paragraph`, `Heading` (h1-h6)
- `CodeBlock`, `BlockQuote`, `List`, `ListItem`
- `Table`, `TableRow`, `TableCell` (GFM)
- `ThematicBreak`, `Html`

**Inline Nodes:**
- `Text`, `Emphasis`, `Strong`, `InlineCode`
- `Link`, `Image`, `Break`
- `Delete`, `FootnoteReference` (GFM)

### Visitor Pattern

Traverse and transform the AST using the visitor pattern:

```rust
use ox_content_ast::{Visit, Document, Heading};

struct HeadingCollector {
    headings: Vec<String>,
}

impl<'a> Visit<'a> for HeadingCollector {
    fn visit_heading(&mut self, heading: &Heading<'a>) {
        // Collect heading text
        for child in &heading.children {
            if let Node::Text(text) = child {
                self.headings.push(text.value.to_string());
            }
        }
    }
}
```

## CI/CD

This project uses GitHub Actions for:

- **CI** - Check, format, clippy, tests (Ubuntu/macOS/Windows)
- **Deploy** - GitHub Pages (Rust docs + Playground)
- **Release** - Multi-platform NAPI builds + npm publish

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run checks (`mise run ready`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Acknowledgments

- [Oxc](https://github.com/oxc-project/oxc) - Inspiration for high-performance Rust tooling
- [bumpalo](https://docs.rs/bumpalo) - Arena allocator
- [napi-rs](https://napi.rs/) - Node.js bindings
- [mdast](https://github.com/syntax-tree/mdast) - AST specification
