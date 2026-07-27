import { defineConfig } from 'rollup';

// TypeScript writes temporary ESM modules to .build. Rollup turns them into
// the single published runtime entrypoint, leaving package dependencies external.
export default defineConfig({
  input: '.build/index.js',
  external: [/^@litsx\//, /^@urql\//],
  output: {
    file: 'dist/index.js',
    format: 'esm',
  },
});
