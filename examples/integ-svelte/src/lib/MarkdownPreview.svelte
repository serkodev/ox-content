<script lang="ts">
  interface Props {
    content: string;
  }

  let { content }: Props = $props();

  // Simulated render - replace with @ox-content/napi
  function renderMarkdown(markdown: string): string {
    let html = markdown
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- \[x\] (.+)$/gm, '<li class="task done"><input type="checkbox" checked disabled> $1</li>')
      .replace(/^- \[ \] (.+)$/gm, '<li class="task"><input type="checkbox" disabled> $1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    return `<div class="markdown-body"><p>${html}</p></div>`;
  }

  let renderedHtml = $derived(renderMarkdown(content));
</script>

<div class="preview-container">
  <div class="preview-header">
    <span>Preview</span>
  </div>
  <div class="preview">
    {@html renderedHtml}
  </div>
</div>

<style>
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

  .preview :global(h1),
  .preview :global(h2),
  .preview :global(h3) {
    color: #e94560;
    margin: 16px 0 8px;
  }

  .preview :global(code) {
    background: #0f3460;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
  }

  .preview :global(pre) {
    background: #0f3460;
    padding: 16px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 12px 0;
  }

  .preview :global(pre code) {
    background: transparent;
    padding: 0;
  }
</style>
