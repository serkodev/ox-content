import { useState } from 'react';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MarkdownPreview } from './components/MarkdownPreview';

const defaultMarkdown = `# Hello Ox Content!

This is a **React 18** integration example.

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

- [x] Create React component
- [ ] Add more features
`;

export default function App() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);

  return (
    <div className="app">
      <header>
        <h1>Ox Content + React 18</h1>
        <p>High-performance Markdown rendering with React</p>
      </header>
      <main>
        <MarkdownEditor value={markdown} onChange={setMarkdown} />
        <MarkdownPreview content={markdown} />
      </main>
    </div>
  );
}
