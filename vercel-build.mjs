// This script is used by Vercel to build the application
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync, writeFileSync } from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

console.log('Starting Vercel build process...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the API directory exists in the build output
const apiDir = join(__dirname, 'backend', 'api');
const distApiDir = join(__dirname, 'dist/api');

// Function to copy files and directories recursively
function copyRecursiveSync(src, dest) {
  if (!existsSync(src)) return;
  
  const stats = statSync(src);
  const isDirectory = stats.isDirectory();

  if (isDirectory) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    const items = readdirSync(src);
    for (const item of items) {
      copyRecursiveSync(join(src, item), join(dest, item));
    }
  } else {
    copyFileSync(src, dest);
  }
}

// Create firebase-config.js from environment variables
function createFirebaseConfig() {
  const firebaseConfigPath = join(__dirname, 'firebase-config.js');
  const firebaseConfigContent = `// Auto-generated during build
export const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};`;

  writeFileSync(firebaseConfigPath, firebaseConfigContent);
  console.log('Created firebase-config.js');
}

// Main build function
async function build() {
  try {
    console.log('Installing dependencies...');
    await execAsync('npm install');

    console.log('Generating Prisma client...');
    await execAsync('npx prisma generate');

    // Create firebase config
    createFirebaseConfig();

    console.log('Building the application...');
    await execAsync('npm run build');

    // Copy API files to dist directory
    if (existsSync(apiDir)) {
      console.log('Copying API files...');
      copyRecursiveSync(apiDir, distApiDir);
    }

    console.log('Build completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run the build process
build();

// Create firebase-config.js from environment variables
const firebaseConfigPath = join(__dirname, 'firebase-config.js');
const firebaseConfigContent = `// Auto-generated during build
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};`;

// Write the config file
fs.writeFileSync(firebaseConfigPath, firebaseConfigContent);
console.log('Created firebase-config.js');

// Run Vite build
console.log('Running Vite build...');
try {
  execSync('vite build', { stdio: 'inherit' });
  console.log('Vite build completed successfully');
} catch (error) {
  console.error('Vite build failed:', error);
  process.exit(1);
}

// Run Prisma generate
console.log('Running Prisma generate...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma generate completed successfully');
} catch (error) {
  console.error('Prisma generate failed:', error);
  process.exit(1);
}

console.log('Build completed successfully!');
