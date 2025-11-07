// src/config/firebase.js
const fromEnv = (key) => {
  const value = import.meta.env[key] ?? process.env?.[key];
  if (typeof value !== 'string') return value;
  return value.replace(/^['"]+|['"]+$/g, '');
};

const firebaseConfig = {
  apiKey: fromEnv('VITE_FIREBASE_API_KEY'),
  authDomain: fromEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: fromEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: fromEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: fromEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: fromEnv('VITE_FIREBASE_APP_ID'),
  measurementId: fromEnv('VITE_FIREBASE_MEASUREMENT_ID')
};

// Debug log
console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'MISSING'
});

export { firebaseConfig };

