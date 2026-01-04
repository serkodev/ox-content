import './MarkdownEditor.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div className="editor-container">
      <div className="editor-header">
        <span>Markdown</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="editor"
        placeholder="Enter Markdown here..."
        spellCheck={false}
      />
    </div>
  );
}
