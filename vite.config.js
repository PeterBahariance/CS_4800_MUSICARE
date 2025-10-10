// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env variables based on current mode
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const isProduction = mode === 'production';
  
  // Log loaded environment variables (for debugging)
  console.log('Vite Config - Environment Variables:', {
    FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY ? '***' : 'MISSING',
    FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN ? '***' : 'MISSING',
    FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID ? '***' : 'MISSING',
  });
  
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