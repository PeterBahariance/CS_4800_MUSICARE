/**
 * @fileoverview Vite Configuration for Musicare Application
 *
 * Configures Vite build tool for the Musicare multi-page application.
 * Handles frontend bundling, development server, environment variables,
 * and production builds for Vercel deployment.
 *
 * Features:
 * - Multi-page application setup (index, app, signup, notif)
 * - Environment variable injection for Firebase config
 * - Development proxy to Express backend (port 3000)
 * - Production build optimization with code splitting
 * - Asset hashing and caching strategies
 * - ES modules output format
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 *
 * @requires vite ^4.4.9
 * @requires path - Node.js path module
 *
 * @see {@link https://vitejs.dev/config/} - Vite configuration reference
 */

import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

/**
 * Vite Configuration Factory
 *
 * Creates Vite configuration based on the current mode (development/production).
 * Loads environment variables and configures build settings accordingly.
 *
 * @param {Object} config - Vite config object
 * @param {string} config.mode - Build mode ('development' or 'production')
 * @returns {Object} Vite configuration object
 */
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Log environment variables for debugging (API keys masked)
  console.log('Vite Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    MODE: mode,
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY ? '***' : 'MISSING',
    VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN || 'MISSING',
    VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID || 'MISSING'
  });

  return {
    // Root directory for the frontend source files
    root: 'frontend',

    // Base public path when served in production
    base: '/',

    // Directory to serve static assets from
    publicDir: 'public',

    /**
     * Build Configuration
     *
     * Configures how Vite builds the application for production.
     * Output goes to /dist directory for Vercel deployment.
     */
    build: {
      // Output directory relative to project root
      outDir: '../dist',

      // Clear output directory before building
      emptyOutDir: true,

      // Target modern browsers with ES modules support
      target: 'esnext',

      // Minify only in production
      minify: isProduction ? 'esbuild' : false,

      // Generate sourcemaps for development debugging
      sourcemap: !isProduction,

      // Disable asset inlining - emit all assets as separate files
      assetsInlineLimit: 0,

      /**
       * Rollup-specific options for bundling
       */
      rollupOptions: {
        // Multi-page application entry points
        input: {
          main: resolve(__dirname, 'frontend/index.html'),      // Login page
          notif: resolve(__dirname, 'frontend/pages/notif.html'), // Notifications
          app: resolve(__dirname, 'frontend/pages/app.html'),   // Main app
          signup: resolve(__dirname, 'frontend/pages/signup.html') // Signup
        },

        // Output configuration for bundled files
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          format: 'esm',

          // Code splitting strategy - separate chunks for large dependencies
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            vendor: ['@prisma/client']
          }
        },

        // No external dependencies (bundle everything)
        external: []
      },

      // CommonJS compatibility options
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    /**
     * Development Server Configuration
     *
     * Configures the Vite dev server for local development.
     * Proxies API requests to Express backend running on port 3000.
     */
    server: {
      // Development server port
      port: 5173,

      // Enable HTML5 history API fallback for SPA routing
      historyApiFallback: true,

      // Automatically open browser on server start
      open: true,

      // Proxy API requests to Express backend (development only)
      proxy: !isProduction ? {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      } : undefined,

      // Enable CORS in development
      cors: !isProduction,

      // Enable Hot Module Replacement in development
      hmr: !isProduction
    },

    /**
     * Global Constants Definition
     *
     * Injects environment variables into the application at build time.
     * Makes Firebase config available to frontend code via process.env.
     */
    define: {
      'process.env': {
        VITE_FIREBASE_API_KEY: JSON.stringify(env.VITE_FIREBASE_API_KEY),
        VITE_FIREBASE_AUTH_DOMAIN: JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
        VITE_FIREBASE_PROJECT_ID: JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
        VITE_FIREBASE_STORAGE_BUCKET: JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
        VITE_FIREBASE_MESSAGING_SENDER_ID: JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
        VITE_FIREBASE_APP_ID: JSON.stringify(env.VITE_FIREBASE_APP_ID),
        VITE_FIREBASE_MEASUREMENT_ID: JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID)
      }
    }
  };
});