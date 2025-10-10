// This script is used by Vercel to build the application
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running vercel-build.js...');

// Ensure the API directory exists in the build output
const apiDir = join(__dirname, 'api');
const distApiDir = join(__dirname, 'dist/api');

if (!existsSync(distApiDir)) {
  mkdirSync(distApiDir, { recursive: true });
}

// Copy all API files to the dist directory
if (existsSync(apiDir)) {
  console.log('Copying API files...');
  const files = readdirSync(apiDir);
  
  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.mjs')) {
      const srcPath = join(apiDir, file);
      const destPath = join(distApiDir, file);
      copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to ${destPath}`);
    }
  }
}

// Run Prisma generate
console.log('Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client generated successfully');
} catch (error) {
  console.error('Failed to generate Prisma client:', error);
  process.exit(1);
}

// Run Vite build
console.log('Running Vite build...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('Vite build completed successfully');
} catch (error) {
  console.error('Vite build failed:', error);
  process.exit(1);
}

console.log('Build completed successfully');
