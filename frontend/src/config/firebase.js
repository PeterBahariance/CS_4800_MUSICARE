/**
 * @fileoverview Firebase Configuration Module
 *
 * Centralized Firebase configuration for the Musicare application. Handles environment
 * variable loading from both Vite (import.meta.env) and Node.js (process.env) contexts,
 * with automatic quote stripping for compatibility across different deployment environments.
 *
 * This configuration is used by all authentication and database features throughout the
 * frontend application.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 *
 * @example
 * // Import Firebase config in your module
 * import { firebaseConfig } from '../config/firebase.js';
 * import { initializeApp } from 'firebase/app';
 *
 * const app = initializeApp(firebaseConfig);
 */

/**
 * Environment Variable Helper Function
 *
 * Retrieves environment variables from either Vite's import.meta.env or Node's process.env,
 * with automatic quote stripping to handle different environment file formats.
 *
 * @function fromEnv
 * @param {string} key - The environment variable key to retrieve
 * @returns {string|undefined} The environment variable value with quotes stripped, or undefined if not found
 *
 * @example
 * // Retrieves VITE_FIREBASE_API_KEY from environment
 * const apiKey = fromEnv('VITE_FIREBASE_API_KEY');
 * // Returns: "AIzaSyAbc123..." (quotes removed if present)
 */
const fromEnv = (key) => {
  const value = import.meta.env[key] ?? process.env?.[key];
  if (typeof value !== 'string') return value;
  // Strip leading and trailing quotes (single or double)
  return value.replace(/^['"]+|['"]+$/g, '');
};

/**
 * Firebase Configuration Object
 *
 * Complete Firebase project configuration loaded from environment variables.
 * All values are automatically loaded from .env file using the VITE_ prefix.
 *
 * @constant {Object} firebaseConfig
 * @property {string} apiKey - Firebase API key for authentication
 * @property {string} authDomain - Firebase authentication domain
 * @property {string} projectId - Firebase project identifier
 * @property {string} storageBucket - Firebase storage bucket URL
 * @property {string} messagingSenderId - Firebase Cloud Messaging sender ID
 * @property {string} appId - Firebase application ID
 * @property {string} measurementId - Google Analytics measurement ID
 *
 * @example
 * // Required environment variables in .env file:
 * // VITE_FIREBASE_API_KEY=your-api-key
 * // VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
 * // VITE_FIREBASE_PROJECT_ID=your-project-id
 * // VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
 * // VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
 * // VITE_FIREBASE_APP_ID=1:123456789:web:abc123
 * // VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
 */
const firebaseConfig = {
  apiKey: fromEnv('VITE_FIREBASE_API_KEY'),
  authDomain: fromEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: fromEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: fromEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: fromEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: fromEnv('VITE_FIREBASE_APP_ID'),
  measurementId: fromEnv('VITE_FIREBASE_MEASUREMENT_ID')
};

/**
 * Debug Logging
 *
 * Logs Firebase configuration to console for debugging purposes.
 * API key is partially masked for security (shows only last 4 characters).
 *
 * @private
 */
console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'MISSING'
});

export { firebaseConfig };

