import { defineConfig } from 'vite';
import { resolve } from 'path';

/** 개발 서버에서 /ascmosaic-app.js 요청을 ascmosaic-app.ts 컴파일로 응답 */
function ascmosaicAppJsPlugin() {
  return {
    name: 'ascmosaic-app-js',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/ascmosaic-app.js' || req.url?.startsWith('/ascmosaic-app.js?')) {
          req.url = '/ascmosaic-app.ts' + (req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: resolve(__dirname, 'editor'),
  publicDir: resolve(__dirname, 'public'),
  plugins: [ascmosaicAppJsPlugin()],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'editor/index.html'),
        'ascmosaic-app': resolve(__dirname, 'editor/ascmosaic-app.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === 'ascmosaic-app' ? 'ascmosaic-app.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
