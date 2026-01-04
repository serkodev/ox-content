/// <reference types="vite/client" />

declare module '*.md' {
  const content: {
    html: string;
    frontmatter: Record<string, unknown>;
    toc: Array<{ depth: number; text: string; slug: string }>;
  };
  export default content;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
