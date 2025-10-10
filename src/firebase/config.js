// src/firebase/config.js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required configuration
const requiredConfig = ['apiKey', 'authDomain', 'projectId'];
for (const key of requiredConfig) {
  if (!firebaseConfig[key]) {
    console.error(`Missing required Firebase config: ${key}`);
    if (import.meta.env.DEV) {
      console.error('Make sure you have a .env.local file with the correct Firebase configuration');
    }
  }
}

// Debug log (only in development)
if (import.meta.env.DEV) {
  console.log('Firebase Config:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'MISSING'
  });
}

export { firebaseConfig };