// postbuild.js - copies Netlify functions to the dist directory
const fs = require('fs');
const path = require('path');

// Create functions directory if it doesn't exist
const functionsDir = path.join(__dirname, 'dist', 'functions');
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}

// Copy all files from netlify/functions to dist/functions
const sourceDir = path.join(__dirname, 'netlify', 'functions');
const files = fs.readdirSync(sourceDir);

files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(functionsDir, file);
  
  // Skip directories
  if (fs.statSync(sourcePath).isDirectory()) {
    return;
  }
  
  // Copy the file
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Copied ${sourcePath} to ${destPath}`);
});

console.log('Netlify functions copied to dist/functions'); 