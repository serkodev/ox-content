// src/index.ts
import * as fs from "fs";
import * as path from "path";
import { oxContent } from "vite-plugin-ox-content";

// src/transform.ts
var COMPONENT_REGEX = /<([A-Z][a-zA-Z0-9]*)\s*([^>]*?)\s*\/?>(?:<\/\1>)?/g;
var PROP_REGEX = /([a-zA-Z0-9-]+)(?:=(?:"([^"]*)"|'([^']*)'|{([^}]*)}))?/g;
async function transformMarkdownWithSvelte(code, id, options) {
  const { components } = options;
  const usedComponents = [];
  const slots = [];
  let slotIndex = 0;
  const { content: markdownContent, frontmatter } = extractFrontmatter(code);
  let processedContent = markdownContent;
  let match;
  while ((match = COMPONENT_REGEX.exec(markdownContent)) !== null) {
    const [fullMatch, componentName, propsString] = match;
    if (components.has(componentName)) {
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
  const svelteCode = generateSvelteModule(
    processedContent,
    usedComponents,
    slots,
    frontmatter,
    options
  );
  return {
    code: svelteCode,
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
function generateSvelteModule(content, usedComponents, slots, frontmatter, options) {
  const imports = usedComponents.map((name) => `import ${name} from '${options.components.get(name)}';`).join("\n");
  const componentRendering = slots.map((slot) => {
    const propsStr = Object.entries(slot.props).map(([k, v]) => `${k}={${JSON.stringify(v)}}`).join(" ");
    return `{#if slotId === '${slot.id}'}<${slot.name} ${propsStr} />{/if}`;
  }).join("\n    ");
  return `
<script>
  ${imports}

  const frontmatter = ${JSON.stringify(frontmatter)};
  const rawHtml = ${JSON.stringify(content)};
  const slots = ${JSON.stringify(slots)};

  let mounted = $state(false);

  $effect(() => {
    mounted = true;
  });
</script>

{#if !mounted}
  <div class="ox-content">{@html rawHtml}</div>
{:else}
  <div class="ox-content">
    {#each slots as slot (slot.id)}
      {@const slotId = slot.id}
      ${componentRendering}
    {/each}
  </div>
{/if}

<style>
  .ox-content {
    line-height: 1.6;
  }
</style>
`;
}

// src/environment.ts
function createSvelteMarkdownEnvironment(mode, options) {
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
      include: isSSR ? [] : ["svelte"],
      exclude: ["vite-plugin-ox-content", "vite-plugin-ox-content-svelte"]
    }
  };
}

// src/index.ts
import { oxContent as oxContent2 } from "vite-plugin-ox-content";
function oxContentSvelte(options = {}) {
  const resolved = resolveSvelteOptions(options);
  let componentMap = /* @__PURE__ */ new Map();
  let config;
  if (typeof options.components === "object" && !Array.isArray(options.components)) {
    componentMap = new Map(Object.entries(options.components));
  }
  const svelteTransformPlugin = {
    name: "ox-content:svelte-transform",
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
      const result = await transformMarkdownWithSvelte(code, id, {
        components: componentMap,
        ...resolved
      });
      return {
        code: result.code,
        map: result.map
      };
    }
  };
  const svelteEnvironmentPlugin = {
    name: "ox-content:svelte-environment",
    config() {
      return {
        environments: {
          "ox-content-ssr": createSvelteMarkdownEnvironment("ssr", resolved),
          "ox-content-client": createSvelteMarkdownEnvironment("client", resolved)
        }
      };
    },
    resolveId(id) {
      if (id === "virtual:ox-content-svelte/runtime") {
        return "\0virtual:ox-content-svelte/runtime";
      }
      if (id === "virtual:ox-content-svelte/components") {
        return "\0virtual:ox-content-svelte/components";
      }
      return null;
    },
    load(id) {
      if (id === "\0virtual:ox-content-svelte/runtime") {
        return generateRuntimeModule();
      }
      if (id === "\0virtual:ox-content-svelte/components") {
        return generateComponentsModule(componentMap);
      }
      return null;
    },
    applyToEnvironment(environment) {
      return ["ox-content-ssr", "ox-content-client", "client", "ssr"].includes(
        environment.name
      );
    }
  };
  const svelteHmrPlugin = {
    name: "ox-content:svelte-hmr",
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
            event: "ox-content:svelte-update",
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
    svelteTransformPlugin,
    svelteEnvironmentPlugin,
    svelteHmrPlugin,
    ...environmentPlugin ? [environmentPlugin] : []
  ];
}
function resolveSvelteOptions(options) {
  return {
    srcDir: options.srcDir ?? "docs",
    outDir: options.outDir ?? "dist",
    base: options.base ?? "/",
    gfm: options.gfm ?? true,
    frontmatter: options.frontmatter ?? true,
    toc: options.toc ?? true,
    tocMaxDepth: options.tocMaxDepth ?? 3,
    components: options.components ?? {},
    runes: options.runes ?? true
  };
}
function generateRuntimeModule() {
  return `
// Svelte 5 runtime for ox-content
export { mount, unmount } from 'svelte';
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
  oxContentSvelte
};
