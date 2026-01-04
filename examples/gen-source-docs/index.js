/**
 * Source Code Documentation Example
 *
 * Demonstrates how Ox Content can generate documentation
 * from source code comments (similar to cargo docs).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Extracts documentation comments from TypeScript/JavaScript source.
 *
 * Supports:
 * - JSDoc comments (/** ... */)
 * - Single-line comments (// ...)
 * - Module-level documentation
 */
function extractDocComments(source, filename) {
  const docs = {
    filename,
    module: null,
    exports: [],
  };

  // Extract module-level JSDoc (first /** */ comment)
  const moduleDocMatch = source.match(/^\/\*\*\s*\n([\s\S]*?)\*\//);
  if (moduleDocMatch) {
    docs.module = parseJsDoc(moduleDocMatch[1]);
  }

  // Extract function/class documentation
  const exportRegex = /\/\*\*\s*\n([\s\S]*?)\*\/\s*\n\s*export\s+(function|class|const|let|var|interface|type)\s+(\w+)/g;
  let match;

  while ((match = exportRegex.exec(source)) !== null) {
    const [, docComment, kind, name] = match;
    docs.exports.push({
      name,
      kind,
      doc: parseJsDoc(docComment),
    });
  }

  return docs;
}

/**
 * Parses JSDoc comment content.
 */
function parseJsDoc(content) {
  const lines = content.split('\n').map((line) =>
    line.replace(/^\s*\*\s?/, '').trim()
  );

  const doc = {
    description: '',
    params: [],
    returns: null,
    examples: [],
    tags: {},
  };

  let currentSection = 'description';
  let currentExample = null;

  for (const line of lines) {
    if (line.startsWith('@param')) {
      const match = line.match(/@param\s+(?:\{([^}]+)\})?\s*(\w+)\s*(.*)/);
      if (match) {
        doc.params.push({
          type: match[1] || 'any',
          name: match[2],
          description: match[3],
        });
      }
      currentSection = 'param';
    } else if (line.startsWith('@returns') || line.startsWith('@return')) {
      const match = line.match(/@returns?\s+(?:\{([^}]+)\})?\s*(.*)/);
      if (match) {
        doc.returns = {
          type: match[1] || 'any',
          description: match[2],
        };
      }
      currentSection = 'returns';
    } else if (line.startsWith('@example')) {
      currentExample = [];
      currentSection = 'example';
    } else if (line.startsWith('@')) {
      const match = line.match(/@(\w+)\s*(.*)/);
      if (match) {
        doc.tags[match[1]] = match[2];
      }
    } else if (currentSection === 'description' && line) {
      doc.description += (doc.description ? ' ' : '') + line;
    } else if (currentSection === 'example' && currentExample !== null) {
      if (line.startsWith('```')) {
        if (currentExample.length > 0) {
          doc.examples.push(currentExample.join('\n'));
          currentExample = null;
          currentSection = 'description';
        }
      } else {
        currentExample.push(line);
      }
    }
  }

  if (currentExample && currentExample.length > 0) {
    doc.examples.push(currentExample.join('\n'));
  }

  return doc;
}

/**
 * Generates Markdown documentation from extracted docs.
 */
function generateMarkdown(docs) {
  let md = '';

  // Module documentation
  if (docs.module) {
    md += `# ${basename(docs.filename, extname(docs.filename))}\n\n`;
    md += `${docs.module.description}\n\n`;
  } else {
    md += `# ${docs.filename}\n\n`;
  }

  // Exports
  if (docs.exports.length > 0) {
    md += `## Exports\n\n`;

    for (const exp of docs.exports) {
      md += `### \`${exp.kind} ${exp.name}\`\n\n`;
      md += `${exp.doc.description}\n\n`;

      // Parameters
      if (exp.doc.params.length > 0) {
        md += `**Parameters:**\n\n`;
        for (const param of exp.doc.params) {
          md += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
        }
        md += '\n';
      }

      // Returns
      if (exp.doc.returns) {
        md += `**Returns:** \`${exp.doc.returns.type}\` - ${exp.doc.returns.description}\n\n`;
      }

      // Examples
      if (exp.doc.examples.length > 0) {
        md += `**Example:**\n\n`;
        for (const example of exp.doc.examples) {
          md += `\`\`\`javascript\n${example}\n\`\`\`\n\n`;
        }
      }
    }
  }

  return md;
}

// Example source file content
const exampleSource = `
/**
 * Math utilities module.
 *
 * Provides high-performance mathematical operations.
 */

/**
 * Adds two numbers together.
 *
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum of a and b
 * @example
 * \`\`\`javascript
 * const result = add(2, 3);
 * console.log(result); // 5
 * \`\`\`
 */
export function add(a, b) {
  return a + b;
}

/**
 * Multiplies two numbers.
 *
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The product of a and b
 */
export function multiply(a, b) {
  return a * b;
}

/**
 * Calculator class for chained operations.
 *
 * @example
 * \`\`\`javascript
 * const calc = new Calculator(10);
 * const result = calc.add(5).multiply(2).value;
 * \`\`\`
 */
export class Calculator {
  constructor(initial = 0) {
    this.value = initial;
  }

  add(n) {
    this.value += n;
    return this;
  }

  multiply(n) {
    this.value *= n;
    return this;
  }
}
`;

// Generate documentation
console.log('Extracting documentation from source...\n');
const docs = extractDocComments(exampleSource, 'math.ts');
console.log('Extracted:', JSON.stringify(docs, null, 2));

console.log('\n--- Generated Markdown ---\n');
const markdown = generateMarkdown(docs);
console.log(markdown);
