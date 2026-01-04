# Source Code Documentation Example

This example demonstrates how Ox Content can generate documentation from source code, similar to `cargo doc` for Rust.

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

## How It Works

1. Parse source files for documentation comments
2. Extract JSDoc/TSDoc annotations
3. Generate Markdown documentation
4. Render with Ox Content

## Supported Comment Formats

### JSDoc

```javascript
/**
 * Adds two numbers together.
 *
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum
 * @example
 * ```javascript
 * add(2, 3) // => 5
 * ```
 */
export function add(a, b) {
  return a + b;
}
```

### TypeScript

```typescript
/**
 * User interface.
 */
export interface User {
  /** User's unique identifier */
  id: string;
  /** User's display name */
  name: string;
}
```

## Integration with Ox Content

The generated Markdown is then processed by Ox Content for:
- High-performance parsing
- Syntax highlighting
- Cross-referencing
- Search indexing
