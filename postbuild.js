// postbuild.js - copies Netlify functions to the dist directory
const fs = require('fs');
const path = require('path');

try {
  console.log('Starting postbuild process...');
  console.log('Current directory:', process.cwd());
  
  // Create functions directory if it doesn't exist
  const functionsDir = path.join(process.cwd(), 'dist', 'functions');
  if (!fs.existsSync(functionsDir)) {
    console.log(`Creating directory: ${functionsDir}`);
    fs.mkdirSync(functionsDir, { recursive: true });
  }
  
  // Copy all files from netlify/functions to dist/functions
  const sourceDir = path.join(process.cwd(), 'netlify', 'functions');
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    console.log('Directory contents:', fs.readdirSync(process.cwd()));
    process.exit(0); // Exit gracefully to not fail the build
  }
  
  console.log(`Copying files from ${sourceDir} to ${functionsDir}`);
  const files = fs.readdirSync(sourceDir);
  
  if (files.length === 0) {
    console.log('No files found in source directory');
    process.exit(0); // Exit gracefully
  }
  
  let filesCopied = 0;
  
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(functionsDir, file);
    
    // Skip directories
    if (fs.statSync(sourcePath).isDirectory()) {
      console.log(`Skipping directory: ${sourcePath}`);
      return;
    }
    
    // Copy the file
    console.log(`Copying ${sourcePath} to ${destPath}`);
    fs.copyFileSync(sourcePath, destPath);
    filesCopied++;
  });
  
  console.log(`Netlify functions copied to dist/functions: ${filesCopied} files`);
} catch (error) {
  console.error('Error in postbuild script:', error);
  console.error(error.stack);
  
  // Don't exit with error to allow the build to continue
  process.exit(0);
} 