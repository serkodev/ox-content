"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  oxContent: () => import_vite_plugin_ox_content2.oxContent,
  oxContentVue: () => oxContentVue
});
module.exports = __toCommonJS(index_exports);
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var import_vite_plugin_ox_content = require("vite-plugin-ox-content");

// src/transform.ts
var COMPONENT_REGEX = /<([A-Z][a-zA-Z0-9]*)\s*([^>]*?)\s*\/?>(?:<\/\1>)?/g;
var PROP_REGEX = /(?::|v-bind:)?([a-zA-Z0-9-]+)(?:=(?:"([^"]*)"|'([^']*)'|{([^}]*)}|\[([^\]]*)\]))?/g;
async function transformMarkdownWithVue(code, id, options) {
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
  const sfcCode = generateVueSFC(
    processedContent,
    usedComponents,
    slots,
    frontmatter,
    options,
    id
  );
  return {
    code: sfcCode,
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
        if (typeof value === "string" && (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
      }
      frontmatter[key] = value;
    }
  }
  return {
    content: content.slice(match[0].length),
    frontmatter
  };
}
function parseProps(propsString) {
  const props = {};
  if (!propsString) return props;
  let match;
  while ((match = PROP_REGEX.exec(propsString)) !== null) {
    const [, name, doubleQuoted, singleQuoted, braceValue, bracketValue] = match;
    if (name) {
      if (doubleQuoted !== void 0) {
        props[name] = doubleQuoted;
      } else if (singleQuoted !== void 0) {
        props[name] = singleQuoted;
      } else if (braceValue !== void 0) {
        try {
          props[name] = JSON.parse(`{${braceValue}}`);
        } catch {
          props[name] = braceValue;
        }
      } else if (bracketValue !== void 0) {
        try {
          props[name] = JSON.parse(`[${bracketValue}]`);
        } catch {
          props[name] = bracketValue;
        }
      } else {
        props[name] = true;
      }
    }
  }
  return props;
}
function generateVueSFC(content, usedComponents, slots, frontmatter, options, _id) {
  const componentImports = usedComponents.map((name) => {
    const path2 = options.components.get(name);
    return `import ${name} from '${path2}';`;
  }).join("\n");
  const componentRegistrations = usedComponents.join(",\n    ");
  const slotRenderCases = slots.map(
    (slot) => `
      case '${slot.id}':
        return h(${slot.name}, ${JSON.stringify(slot.props)});`
  ).join("");
  return `
<script setup lang="ts">
import { h, ref, onMounted, VNode } from 'vue';
${componentImports}

// Frontmatter
const frontmatter = ${JSON.stringify(frontmatter)};

// Component registry
const components = {
  ${componentRegistrations}
};

// Markdown content
const rawHtml = ${JSON.stringify(content)};

// Slots data
const slots = ${JSON.stringify(slots)};

// Mounted state for hydration
const mounted = ref(false);

onMounted(() => {
  mounted.value = true;
});

// Render slot component
function renderSlot(slotId: string): VNode | null {
  switch (slotId) {${slotRenderCases}
    default:
      return null;
  }
}

// Expose frontmatter and toc
defineExpose({
  frontmatter,
});
</script>

<template>
  <div class="ox-content" v-if="!mounted" v-html="rawHtml" />
  <div class="ox-content" v-else>
    <template v-for="slot in slots" :key="slot.id">
      <component :is="renderSlot(slot.id)" />
    </template>
  </div>
</template>
`;
}

// src/environment.ts
function createVueMarkdownEnvironment(mode, options) {
  const isSSR = mode === "ssr";
  return {
    build: {
      outDir: isSSR ? `${options.outDir}/.ox-content/ssr` : `${options.outDir}/.ox-content/client`,
      ssr: isSSR,
      rollupOptions: {
        input: isSSR ? void 0 : void 0,
        output: {
          format: isSSR ? "esm" : "esm",
          entryFileNames: isSSR ? "[name].js" : "[name].[hash].js",
          chunkFileNames: isSSR ? "chunks/[name].js" : "chunks/[name].[hash].js"
        }
      },
      // SSR-specific optimizations
      ...isSSR && {
        target: "node18",
        minify: false
      }
    },
    resolve: {
      conditions: isSSR ? ["node", "import"] : ["browser", "import"],
      alias: {
        // Ensure Vue resolves correctly for each environment
        vue: isSSR ? "vue/dist/vue.runtime.esm-bundler.js" : "vue"
      }
    },
    optimizeDeps: {
      // Pre-bundle Vue for faster cold starts
      include: isSSR ? [] : ["vue"],
      // Exclude ox-content packages from optimization (they're local)
      exclude: ["vite-plugin-ox-content", "vite-plugin-ox-content-vue"]
    },
    // Development server options (client only)
    ...!isSSR && {
      dev: {
        warmup: ["./src/**/*.vue", "./docs/**/*.md"]
      }
    }
  };
}

// src/index.ts
var import_vite_plugin_ox_content2 = require("vite-plugin-ox-content");
function oxContentVue(options = {}) {
  const resolved = resolveVueOptions(options);
  let componentMap = /* @__PURE__ */ new Map();
  let config;
  if (typeof options.components === "object" && !Array.isArray(options.components)) {
    componentMap = new Map(Object.entries(options.components));
  }
  const vueTransformPlugin = {
    name: "ox-content:vue-transform",
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
      const result = await transformMarkdownWithVue(code, id, {
        ...resolved,
        components: componentMap
      });
      return {
        code: result.code,
        map: result.map
      };
    }
  };
  const vueEnvironmentPlugin = {
    name: "ox-content:vue-environment",
    config() {
      return {
        environments: {
          // SSR environment for Vue component rendering
          oxcontent_ssr: createVueMarkdownEnvironment("ssr", resolved),
          // Client environment for hydration
          oxcontent_client: createVueMarkdownEnvironment("client", resolved)
        }
      };
    },
    // Environment-specific module resolution
    resolveId: {
      order: "pre",
      async handler(id, _importer, _options) {
        if (id === "virtual:ox-content-vue/runtime") {
          return "\0virtual:ox-content-vue/runtime";
        }
        if (id === "virtual:ox-content-vue/components") {
          return "\0virtual:ox-content-vue/components";
        }
        return null;
      }
    },
    load: {
      order: "pre",
      async handler(id) {
        if (id === "\0virtual:ox-content-vue/runtime") {
          return generateRuntimeModule(resolved);
        }
        if (id === "\0virtual:ox-content-vue/components") {
          return generateComponentsModule(componentMap);
        }
        return null;
      }
    },
    // Per-environment build hooks
    applyToEnvironment(environment) {
      return environment.name === "oxcontent_ssr" || environment.name === "oxcontent_client" || environment.name === "client" || environment.name === "ssr";
    }
  };
  const vueHmrPlugin = {
    name: "ox-content:vue-hmr",
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
            event: "ox-content:vue-update",
            data: { file }
          });
          return [...modules, ...mdModules];
        }
      }
      return modules;
    }
  };
  const basePlugins = (0, import_vite_plugin_ox_content.oxContent)(options);
  const environmentPlugin = basePlugins.find((p) => p.name === "ox-content:environment");
  return [
    vueTransformPlugin,
    vueEnvironmentPlugin,
    vueHmrPlugin,
    ...environmentPlugin ? [environmentPlugin] : []
  ];
}
function resolveVueOptions(options) {
  return {
    srcDir: options.srcDir ?? "docs",
    outDir: options.outDir ?? "dist",
    base: options.base ?? "/",
    gfm: options.gfm ?? true,
    frontmatter: options.frontmatter ?? true,
    toc: options.toc ?? true,
    tocMaxDepth: options.tocMaxDepth ?? 3,
    components: options.components ?? {},
    // Vue-specific options
    reactivityTransform: options.reactivityTransform ?? false,
    customBlocks: options.customBlocks ?? true
  };
}
function generateRuntimeModule(_options) {
  return `
import { h, defineComponent, ref, onMounted } from 'vue';

export const OxContentRenderer = defineComponent({
  name: 'OxContentRenderer',
  props: {
    content: { type: Object, required: true },
    components: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const mounted = ref(false);

    onMounted(() => {
      mounted.value = true;
    });

    return () => {
      if (!props.content) return null;

      const { html, frontmatter, toc, slots } = props.content;

      // Render static HTML with component slots
      return h('div', {
        class: 'ox-content',
        innerHTML: mounted.value ? undefined : html,
      }, mounted.value ? renderWithSlots(html, slots, props.components) : undefined);
    };
  },
});

function renderWithSlots(html, slots, components) {
  // Parse and render slots with Vue components
  // This is a simplified version - full implementation would use proper parsing
  return h('div', { innerHTML: html });
}

export function useOxContent() {
  return {
    OxContentRenderer,
  };
}
`;
}
function generateComponentsModule(componentMap) {
  const imports = [];
  const exports2 = [];
  componentMap.forEach((path2, name) => {
    imports.push(`import ${name} from '${path2}';`);
    exports2.push(`  ${name},`);
  });
  return `
${imports.join("\n")}

export const components = {
${exports2.join("\n")}
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  oxContent,
  oxContentVue
});
