<script setup lang="ts">
import { computed } from 'vue';
// In a real integration, you would import from @ox-content/napi
// import { parseAndRender } from '@ox-content/napi';

const props = defineProps<{
  content: string;
}>();

// Simulated render function - replace with actual Ox Content integration
function renderMarkdown(markdown: string): string {
  // This is a placeholder. In production, use:
  // const result = parseAndRender(markdown, { gfm: true });
  // return result.html;

  // Simple placeholder rendering for demo
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Task lists
    .replace(/^- \[x\] (.+)$/gm, '<li class="task done"><input type="checkbox" checked disabled> $1</li>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="task"><input type="checkbox" disabled> $1</li>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>');

  return `<div class="markdown-body"><p>${html}</p></div>`;
}

const renderedHtml = computed(() => renderMarkdown(props.content));
</script>

<template>
  <div class="preview-container">
    <div class="preview-header">
      <span>Preview</span>
    </div>
    <div class="preview" v-html="renderedHtml" />
  </div>
</template>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  background: #16213e;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  padding: 12px 16px;
  background: #0f3460;
  font-weight: 600;
  color: #e94560;
}

.preview {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.preview :deep(h1),
.preview :deep(h2),
.preview :deep(h3) {
  color: #e94560;
  margin: 16px 0 8px;
}

.preview :deep(h1) { font-size: 1.8em; }
.preview :deep(h2) { font-size: 1.4em; }
.preview :deep(h3) { font-size: 1.2em; }

.preview :deep(p) {
  margin: 8px 0;
  line-height: 1.6;
}

.preview :deep(code) {
  background: #0f3460;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
}

.preview :deep(pre) {
  background: #0f3460;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 12px 0;
}

.preview :deep(pre code) {
  background: transparent;
  padding: 0;
}

.preview :deep(li) {
  margin: 4px 0;
  margin-left: 20px;
}

.preview :deep(li.task) {
  list-style: none;
  margin-left: 0;
}

.preview :deep(strong) {
  color: #fff;
}
</style>
