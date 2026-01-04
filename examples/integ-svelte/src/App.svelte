<script lang="ts">
  import MarkdownEditor from './lib/MarkdownEditor.svelte';
  import MarkdownPreview from './lib/MarkdownPreview.svelte';

  let markdown = $state(`# Hello Ox Content!

This is a **Svelte 5** integration example.

## Features

- Live preview with reactive state
- Syntax highlighting
- GFM support

\`\`\`typescript
const message = 'Hello from Ox Content!';
console.log(message);
\`\`\`

| Feature | Status |
|---------|--------|
| Tables | ✅ |
| Task Lists | ✅ |

- [x] Create Svelte component
- [ ] Add more features
`);
</script>

<div class="app">
  <header>
    <h1>Ox Content + Svelte 5</h1>
    <p>High-performance Markdown rendering with Svelte</p>
  </header>
  <main>
    <MarkdownEditor bind:value={markdown} />
    <MarkdownPreview content={markdown} />
  </main>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1a1a2e;
    color: #eee;
    min-height: 100vh;
  }

  .app {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  header {
    text-align: center;
    margin-bottom: 30px;
  }

  header h1 {
    color: #e94560;
    margin-bottom: 10px;
  }

  header p {
    color: #888;
  }

  main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    min-height: 600px;
  }

  @media (max-width: 768px) {
    main {
      grid-template-columns: 1fr;
    }
  }
</style>
