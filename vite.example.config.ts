import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'examples'),
  build: {
    outDir: resolve(__dirname, 'dist-example'),
    emptyOutDir: true,
  },
});
