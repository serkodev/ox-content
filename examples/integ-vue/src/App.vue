<script setup lang="ts">
import { ref, computed } from 'vue';
import MarkdownEditor from './components/MarkdownEditor.vue';
import MarkdownPreview from './components/MarkdownPreview.vue';

const markdown = ref(`# Hello Ox Content!

This is a **Vue 3** integration example.

## Features

- Live preview
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

- [x] Create Vue component
- [ ] Add more features
`);
</script>

<template>
  <div class="app">
    <header>
      <h1>Ox Content + Vue 3</h1>
      <p>High-performance Markdown rendering with Vue</p>
    </header>
    <main>
      <MarkdownEditor v-model="markdown" />
      <MarkdownPreview :content="markdown" />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
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
