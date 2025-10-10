import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Create a VITE_* only object for client-side
  const clientEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('VITE_')) {
      clientEnv[key] = value;
    }
  }

  return {
    root: '.',
    define: {
      'import.meta.env': JSON.stringify(clientEnv),
      'process.env': {},
    },
    server: {
      port: 3000,
      open: true,
      cors: true,
      // Proxy API requests to avoid CORS issues in development
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // Copy API directory to dist
      rollupOptions: {
        input: {
          main: './index.html',
          notif: './notif.html',
          app: './app.html',
        },
        output: {
          // Preserve directory structure in dist
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis',
        },
      },
    },
  };
});
