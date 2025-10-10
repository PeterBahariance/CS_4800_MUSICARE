// This script is used by Vercel to build the application
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running vercel-build.js...');

// Ensure the API directory exists in the build output
const apiDir = path.join(__dirname, 'api');
const distApiDir = path.join(__dirname, 'dist/api');

if (!fs.existsSync(distApiDir)) {
  fs.mkdirSync(distApiDir, { recursive: true });
}

// Copy all API files to the dist directory
if (fs.existsSync(apiDir)) {
  console.log('Copying API files...');
  const files = fs.readdirSync(apiDir);
  
  files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.mjs')) {
      const srcPath = path.join(apiDir, file);
      const destPath = path.join(distApiDir, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to ${destPath}`);
    }
  });
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
