// src/index.ts
import * as fs from "fs";
import * as path from "path";
import { oxContent } from "vite-plugin-ox-content";

// src/transform.ts
var COMPONENT_REGEX = /<([A-Z][a-zA-Z0-9]*)\s*([^>]*?)\s*\/?>(?:<\/\1>)?/g;
var PROP_REGEX = /([a-zA-Z0-9-]+)(?:=(?:"([^"]*)"|'([^']*)'|{([^}]*)}))?/g;
async function transformMarkdownWithReact(code, id, options) {
  const components = options.components;
  const usedComponents = [];
  const slots = [];
  let slotIndex = 0;
  const { content: markdownContent, frontmatter } = extractFrontmatter(code);
  let processedContent = markdownContent;
  let match;
  while ((match = COMPONENT_REGEX.exec(markdownContent)) !== null) {
    const [fullMatch, componentName, propsString] = match;
    if (componentName in components) {
      if (!usedComponents.includes(componentName)) {
        usedComponents.push(componentName);
      }
      const props = parseProps(propsString);
      const slotId = `__ox_slot_${slotIndex++}__`;
      slots.push({
        name: componentName,
        props,
        position: match.index,
        id: slotId
      });
      processedContent = processedContent.replace(
        fullMatch,
        `<div data-ox-slot="${slotId}"></div>`
      );
    }
  }
  const jsxCode = generateReactModule(
    processedContent,
    usedComponents,
    slots,
    frontmatter,
    options
  );
  return {
    code: jsxCode,
    map: null,
    usedComponents,
    frontmatter
  };
}
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = frontmatterRegex.exec(content);
  if (!match) {
    return { content, frontmatter: {} };
  }
  const frontmatterStr = match[1];
  const frontmatter = {};
  for (const line of frontmatterStr.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      try {
        value = JSON.parse(value);
      } catch {
        if (typeof value === "string" && value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
      }
      frontmatter[key] = value;
    }
  }
  return { content: content.slice(match[0].length), frontmatter };
}
function parseProps(propsString) {
  const props = {};
  if (!propsString) return props;
  let match;
  while ((match = PROP_REGEX.exec(propsString)) !== null) {
    const [, name, doubleQuoted, singleQuoted, braceValue] = match;
    if (name) {
      if (doubleQuoted !== void 0) props[name] = doubleQuoted;
      else if (singleQuoted !== void 0) props[name] = singleQuoted;
      else if (braceValue !== void 0) {
        try {
          props[name] = JSON.parse(braceValue);
        } catch {
          props[name] = braceValue;
        }
      } else props[name] = true;
    }
  }
  return props;
}
function generateReactModule(content, usedComponents, slots, frontmatter, options) {
  const imports = usedComponents.map((name) => `import ${name} from '${options.components[name]}';`).join("\n");
  return `
import React, { useState, useEffect } from 'react';
${imports}

const frontmatter = ${JSON.stringify(frontmatter)};
const rawHtml = ${JSON.stringify(content)};
const slots = ${JSON.stringify(slots)};

const components = { ${usedComponents.join(", ")} };

export default function MarkdownContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="ox-content" dangerouslySetInnerHTML={{ __html: rawHtml }} />;
  }

  return (
    <div className="ox-content">
      {slots.map((slot) => {
        const Component = components[slot.name];
        return Component ? <Component key={slot.id} {...slot.props} /> : null;
      })}
    </div>
  );
}

export { frontmatter };
`;
}

// src/environment.ts
function createReactMarkdownEnvironment(mode, options) {
  const isSSR = mode === "ssr";
  return {
    build: {
      outDir: isSSR ? `${options.outDir}/.ox-content/ssr` : `${options.outDir}/.ox-content/client`,
      ssr: isSSR,
      rollupOptions: {
        output: {
          format: "esm",
          entryFileNames: isSSR ? "[name].js" : "[name].[hash].js"
        }
      },
      ...isSSR && { target: "node18", minify: false }
    },
    resolve: {
      conditions: isSSR ? ["node", "import"] : ["browser", "import"]
    },
    optimizeDeps: {
      include: isSSR ? [] : ["react", "react-dom"],
      exclude: ["vite-plugin-ox-content", "vite-plugin-ox-content-react"]
    }
  };
}

// src/index.ts
import { oxContent as oxContent2 } from "vite-plugin-ox-content";
function oxContentReact(options = {}) {
  const resolved = resolveReactOptions(options);
  let componentMap = /* @__PURE__ */ new Map();
  let config;
  if (typeof options.components === "object" && !Array.isArray(options.components)) {
    componentMap = new Map(Object.entries(options.components));
  }
  const reactTransformPlugin = {
    name: "ox-content:react-transform",
    enforce: "pre",
    async configResolved(resolvedConfig) {
      config = resolvedConfig;
      const componentsOption = options.components;
      if (componentsOption) {
        const resolvedComponents = await resolveComponentsGlob(
          componentsOption,
          config.root
        );
        componentMap = new Map(Object.entries(resolvedComponents));
      }
    },
    async transform(code, id) {
      if (!id.endsWith(".md")) {
        return null;
      }
      const result = await transformMarkdownWithReact(code, id, {
        ...resolved,
        components: Object.fromEntries(componentMap)
      });
      return {
        code: result.code,
        map: result.map
      };
    }
  };
  const reactEnvironmentPlugin = {
    name: "ox-content:react-environment",
    config() {
      const envOptions = {
        ...resolved,
        components: Object.fromEntries(componentMap)
      };
      return {
        environments: {
          oxcontent_ssr: createReactMarkdownEnvironment("ssr", envOptions),
          oxcontent_client: createReactMarkdownEnvironment("client", envOptions)
        }
      };
    },
    resolveId(id) {
      if (id === "virtual:ox-content-react/runtime") {
        return "\0virtual:ox-content-react/runtime";
      }
      if (id === "virtual:ox-content-react/components") {
        return "\0virtual:ox-content-react/components";
      }
      return null;
    },
    load(id) {
      if (id === "\0virtual:ox-content-react/runtime") {
        return generateRuntimeModule();
      }
      if (id === "\0virtual:ox-content-react/components") {
        return generateComponentsModule(componentMap);
      }
      return null;
    },
    applyToEnvironment(environment) {
      return ["oxcontent_ssr", "oxcontent_client", "client", "ssr"].includes(
        environment.name
      );
    }
  };
  const reactHmrPlugin = {
    name: "ox-content:react-hmr",
    apply: "serve",
    handleHotUpdate({ file, server, modules }) {
      const isComponent = Array.from(componentMap.values()).some(
        (path2) => file.endsWith(path2.replace(/^\.\//, ""))
      );
      if (isComponent) {
        const mdModules = Array.from(
          server.moduleGraph.idToModuleMap.values()
        ).filter((mod) => mod.file?.endsWith(".md"));
        if (mdModules.length > 0) {
          server.ws.send({
            type: "custom",
            event: "ox-content:react-update",
            data: { file }
          });
          return [...modules, ...mdModules];
        }
      }
      return modules;
    }
  };
  const basePlugins = oxContent(options);
  const environmentPlugin = basePlugins.find((p) => p.name === "ox-content:environment");
  return [
    reactTransformPlugin,
    reactEnvironmentPlugin,
    reactHmrPlugin,
    ...environmentPlugin ? [environmentPlugin] : []
  ];
}
function resolveReactOptions(options) {
  return {
    srcDir: options.srcDir ?? "docs",
    outDir: options.outDir ?? "dist",
    base: options.base ?? "/",
    gfm: options.gfm ?? true,
    frontmatter: options.frontmatter ?? true,
    toc: options.toc ?? true,
    tocMaxDepth: options.tocMaxDepth ?? 3,
    jsxRuntime: options.jsxRuntime ?? "automatic"
  };
}
function generateRuntimeModule() {
  return `
import React, { useState, useEffect } from 'react';

export function OxContentRenderer({ content, components = {} }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!content) return null;

  const { html, frontmatter, slots } = content;

  if (!mounted) {
    return React.createElement('div', {
      className: 'ox-content',
      dangerouslySetInnerHTML: { __html: html },
    });
  }

  return React.createElement('div', { className: 'ox-content' },
    slots.map((slot) => {
      const Component = components[slot.name];
      return Component
        ? React.createElement(Component, { key: slot.id, ...slot.props })
        : null;
    })
  );
}

export function useOxContent() {
  return { OxContentRenderer };
}
`;
}
function generateComponentsModule(componentMap) {
  const imports = [];
  const exports = [];
  componentMap.forEach((path2, name) => {
    imports.push(`import ${name} from '${path2}';`);
    exports.push(`  ${name},`);
  });
  return `
${imports.join("\n")}

export const components = {
${exports.join("\n")}
};

export default components;
`;
}
async function resolveComponentsGlob(componentsOption, root) {
  if (typeof componentsOption === "object" && !Array.isArray(componentsOption)) {
    return componentsOption;
  }
  const patterns = Array.isArray(componentsOption) ? componentsOption : [componentsOption];
  const result = {};
  for (const pattern of patterns) {
    const files = await globFiles(pattern, root);
    for (const file of files) {
      const baseName = path.basename(file, path.extname(file));
      const componentName = toPascalCase(baseName);
      const relativePath = "./" + path.relative(root, file).replace(/\\/g, "/");
      result[componentName] = relativePath;
    }
  }
  return result;
}
async function globFiles(pattern, root) {
  const files = [];
  const isGlob = pattern.includes("*");
  if (!isGlob) {
    const fullPath = path.resolve(root, pattern);
    if (fs.existsSync(fullPath)) {
      files.push(fullPath);
    }
    return files;
  }
  const parts = pattern.split("*");
  const baseDir = path.resolve(root, parts[0]);
  const ext = parts[1] || "";
  if (!fs.existsSync(baseDir)) {
    return files;
  }
  if (pattern.includes("**")) {
    await walkDir(baseDir, files, ext);
  } else {
    const entries = await fs.promises.readdir(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(path.join(baseDir, entry.name));
      }
    }
  }
  return files;
}
async function walkDir(dir, files, ext) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, files, ext);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
}
function toPascalCase(str) {
  return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase()).replace(/^\w/, (c) => c.toUpperCase());
}
export {
  oxContent2 as oxContent,
  oxContentReact
};
