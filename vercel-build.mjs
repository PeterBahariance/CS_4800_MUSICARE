// This script is used by Vercel to build the application
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'fs';
import * as fs from 'fs';

console.log('Running vercel-build.mjs...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the API directory exists in the build output
const apiDir = join(__dirname, 'api');
const distApiDir = join(__dirname, 'dist/api');

if (!existsSync(distApiDir)) {
  mkdirSync(distApiDir, { recursive: true });
}

// Function to copy files and directories recursively
function copyRecursiveSync(src, dest) {
  const stats = existsSync(src) && fs.statSync(src);
  const isDirectory = stats && stats.isDirectory();

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

// Copy all API files to the dist directory
if (existsSync(apiDir)) {
  console.log('Copying API files...');
  const items = readdirSync(apiDir);
  
  for (const item of items) {
    const srcPath = join(apiDir, item);
    const destPath = join(distApiDir, item);
    console.log(`Copying ${srcPath} to ${destPath}`);
    copyRecursiveSync(srcPath, destPath);
  }
}

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
