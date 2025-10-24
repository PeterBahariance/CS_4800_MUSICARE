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
  const files = readdirSync(apiDir, { withFileTypes: true });

  for (const file of files) {
    if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.mjs'))) {
      const srcPath = join(apiDir, file.name);
      const destPath = join(distApiDir, file.name);
      copyFileSync(srcPath, destPath);
      console.log(`Copied ${file.name} to ${destPath}`);
    } else if (file.isDirectory()) {
      // Handle subdirectories like api/users
      const subDir = join(apiDir, file.name);
      const destSubDir = join(distApiDir, file.name);

      if (!existsSync(destSubDir)) {
        mkdirSync(destSubDir, { recursive: true });
      }

      const subFiles = readdirSync(subDir);
      for (const subFile of subFiles) {
        if (subFile.endsWith('.js') || subFile.endsWith('.mjs')) {
          const srcPath = join(subDir, subFile);
          const destPath = join(destSubDir, subFile);
          copyFileSync(srcPath, destPath);
          console.log(`Copied ${file.name}/${subFile} to ${destPath}`);
        }
      }
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
