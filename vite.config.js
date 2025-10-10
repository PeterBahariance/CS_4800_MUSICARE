import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

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

  // Check if firebase-config.js exists in the root
  let firebaseConfig = {};
  const firebaseConfigPath = resolve(__dirname, 'firebase-config.js');
  
  if (existsSync(firebaseConfigPath)) {
    try {
      // Read and parse the Firebase config
      const configContent = readFileSync(firebaseConfigPath, 'utf-8');
      // Extract the firebaseConfig object using a regex
      const configMatch = configContent.match(/export\s+const\s+firebaseConfig\s*=\s*({[\s\S]*?});/);
      if (configMatch && configMatch[1]) {
        firebaseConfig = JSON.parse(configMatch[1].replace(/'/g, '"'));
      }
    } catch (error) {
      console.warn('Failed to parse firebase-config.js:', error);
    }
  }

  return {
    root: '.',
    define: {
      'import.meta.env': JSON.stringify({
        ...clientEnv,
        VITE_FIREBASE_CONFIG: firebaseConfig
      }),
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
