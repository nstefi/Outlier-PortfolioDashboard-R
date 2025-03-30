module.exports = {
  // The Netlify build command will install dependencies 
  // for both the site and functions
  onPreBuild: () => {
    // This happens automatically with Netlify's build process
    console.log('Installing dependencies for functions...');
  }
};