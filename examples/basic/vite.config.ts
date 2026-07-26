import { litsx } from '@litsx/vite-plugin';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [litsx()],
  resolve: {
    alias: [
      {
        find: /^@litsx\/core$/,
        replacement: fileURLToPath(new URL('./node_modules/@litsx/core', import.meta.url)),
      },
    ],
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.litsx', '.json'],
  },
});
