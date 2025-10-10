// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    base: isProduction ? '/' : '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext',
      minify: isProduction ? 'esbuild' : false,
      sourcemap: !isProduction,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          notif: resolve(__dirname, 'notif.html'),
          app: resolve(__dirname, 'app.html')
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          format: 'esm',
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            vendor: ['@prisma/client']
          }
        },
        external: []
      },
      commonjsOptions: {
        transformMixedEsModules: true
      },
      dynamicImportVarsOptions: {
        exclude: []
      }
    },
    server: {
      port: 5173,
      open: true,
      proxy: !isProduction && {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      },
      cors: !isProduction && {
        origin: true,
        credentials: true
      },
      hmr: !isProduction && {
        overlay: true
      }
    },
    envPrefix: 'VITE_',
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : []
    }
  };
});