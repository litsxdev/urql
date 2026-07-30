import { defineConfig } from 'rollup';

// TypeScript writes temporary ESM modules to .build. Rollup turns them into
// the single published runtime entrypoint, leaving package dependencies external.
export default defineConfig({
  input: {
    index: '.build/index.js',
    'index-server': '.build/index-server.js',
    'index-browser': '.build/index-browser.js',
    server: '.build/server.js',
    'server-browser': '.build/server-browser.js',
  },
  external: [/^@litsx\//, /^@urql\//, /^node:/],
  output: {
    dir: 'dist',
    entryFileNames: '[name].js',
    format: 'esm',
  },
});
