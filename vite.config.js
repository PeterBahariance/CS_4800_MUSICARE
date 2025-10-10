// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load environment variables - only VITE_ prefixed ones are exposed to client
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  
  return {
    // Use relative paths for production
    base: isProduction ? '/' : '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext',
      minify: isProduction ? 'terser' : false,
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
          // Ensure proper module loading in production
          format: 'esm',
          // This ensures proper path resolution in the built files
          paths: (id) => {
            // Handle any path remapping if needed
            return id;
          }
        },
        // Ensure proper handling of external dependencies
        external: []
      },
      // Ensure proper module resolution
      commonjsOptions: {
        transformMixedEsModules: true
      },
      // Enable dynamic imports for code splitting
      dynamicImportVarsOptions: {
        exclude: []
      }
    },
    server: {
      port: 5173,
      open: true,
      // Only configure proxy in development
      proxy: !isProduction ? {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying request:', req.method, req.url);
            });
          }
        }
      } : undefined,
      // Enable CORS in development
      cors: !isProduction ? {
        origin: true,
        credentials: true
      } : false,
      // Enable HMR (Hot Module Replacement)
      hmr: !isProduction ? {
        overlay: true
      } : false
    },
    // Only expose environment variables that start with VITE_ to the client
    envPrefix: 'VITE_'
  };
});