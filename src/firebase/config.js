// src/firebase/config.js
function readEnv(key) {
  // Works in Vite context
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[key];
    if (!value) {
      console.error(`[Firebase Config] Missing environment variable: ${key}`);
    } else {
      // Log the first few characters of the value for debugging (don't log full API keys)
      console.log(`[Firebase Config] Loaded ${key}: ${value.substring(0, 5)}...`);
    }
    return value || '';
  }
  
  // Fallback for non-Vite contexts
  console.warn(`[Firebase Config] Running in non-Vite context, using empty string for ${key}`);
  return '';
}

export const firebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
  measurementId: readEnv('VITE_FIREBASE_MEASUREMENT_ID')
};

// Debug
console.log('[Firebase Config] Loaded config:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain
});

export default firebaseConfig;