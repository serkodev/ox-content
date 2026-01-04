import { useMemo } from 'react';
import './MarkdownPreview.css';

interface MarkdownPreviewProps {
  content: string;
}

// Simulated render function - replace with actual Ox Content integration
function renderMarkdown(markdown: string): string {
  // This is a placeholder. In production, use:
  // import { parseAndRender } from '@ox-content/napi';
  // const result = parseAndRender(markdown, { gfm: true });
  // return result.html;

  let html = markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- \[x\] (.+)$/gm, '<li class="task done"><input type="checkbox" checked disabled /> $1</li>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="task"><input type="checkbox" disabled /> $1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  return `<div class="markdown-body"><p>${html}</p></div>`;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const renderedHtml = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div className="preview-container">
      <div className="preview-header">
        <span>Preview</span>
      </div>
      <div
        className="preview"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}
