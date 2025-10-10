// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load environment variables - only VITE_ prefixed ones are exposed to client
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          notif: resolve(__dirname, 'notif.html'),
          app: resolve(__dirname, 'app.html')
        }
      }
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    // Only expose environment variables that start with VITE_ to the client
    envPrefix: 'VITE_'
  };
});