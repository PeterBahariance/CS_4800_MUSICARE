// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Determine if we're in production mode
  const isProduction = mode === 'production';
  
  // Load all environment variables
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  // Log environment variables for debugging
  console.log('Vite Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    MODE: mode,
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY ? '***' : 'MISSING',
    VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN ? '***' : 'MISSING'
  });
  
  return {
    base: '/',
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
      proxy: !isProduction ? {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      } : undefined,
      cors: !isProduction ? {
        origin: true,
        credentials: true
      } : undefined,
      hmr: !isProduction ? {
        overlay: true
      } : undefined
    },
    envPrefix: 'VITE_',
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : []
    },
    define: {
      'process.env': {}
    }
  };
});