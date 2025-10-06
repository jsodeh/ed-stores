// Verification script for Netlify build
// Run this after building: node verify-netlify-build.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Netlify build configuration...\n');

// Check if dist/spa directory exists
const distPath = path.join(__dirname, 'dist', 'spa');
if (!fs.existsSync(distPath)) {
  console.log('❌ dist/spa directory not found. Run: npm run build:client');
  process.exit(1);
}

console.log('✅ dist/spa directory exists');

// Check for index.html
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.log('❌ index.html not found in dist/spa');
  process.exit(1);
}

console.log('✅ index.html exists');

// Check for _redirects file
const redirectsPath = path.join(distPath, '_redirects');
if (!fs.existsSync(redirectsPath)) {
  console.log('❌ _redirects file not found in dist/spa');
  console.log('   This should be copied from public/_redirects during build');
  process.exit(1);
}

console.log('✅ _redirects file exists');

// Check for assets directory
const assetsPath = path.join(distPath, 'assets');
if (!fs.existsSync(assetsPath)) {
  console.log('❌ assets directory not found in dist/spa');
  process.exit(1);
}

console.log('✅ assets directory exists');

// List contents of dist/spa
console.log('\n📁 Contents of dist/spa:');
const files = fs.readdirSync(distPath);
files.forEach(file => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  const type = stats.isDirectory() ? '📁' : '📄';
  console.log(`   ${type} ${file}`);
});

// Check _redirects content
console.log('\n📄 _redirects file content:');
const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
console.log(redirectsContent);

console.log('\n🎉 Build verification complete!');
console.log('📤 Ready for Netlify deployment');
console.log('\n💡 Next steps:');
console.log('   1. Commit and push these changes');
console.log('   2. Update Netlify build settings:');
console.log('      - Build command: npm run build:client');
console.log('      - Publish directory: dist/spa');
console.log('   3. Deploy and test!');