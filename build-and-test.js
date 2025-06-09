const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔨 Build and Test Script\n');

// Function to run command and handle errors
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed\n`);
    return false;
  }
}

// Check Node.js version
console.log('🔍 Checking Node.js version...');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}\n`);
} catch (error) {
  console.error('❌ Node.js not found');
  process.exit(1);
}

// Install dependencies
if (!runCommand('npm install', 'Installing dependencies')) {
  process.exit(1);
}

// Run TypeScript checks
if (!runCommand('npx tsc --noEmit', 'TypeScript type checking')) {
  console.log('⚠️  TypeScript errors found, but continuing...\n');
}

// Run tests (if available)
if (fs.existsSync('src/__tests__') || fs.existsSync('src/**/*.test.ts')) {
  runCommand('npm test -- --coverage --watchAll=false', 'Running tests');
}

// Build for production
if (!runCommand('npm run build', 'Building for production')) {
  process.exit(1);
}

// Check build output
if (fs.existsSync('build')) {
  const buildStats = fs.statSync('build');
  console.log('✅ Build directory created');
  
  // Check if critical files exist
  const criticalFiles = [
    'build/index.html',
    'build/static/js',
    'build/static/css',
    'build/manifest.json'
  ];
  
  let allFilesExist = true;
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      allFilesExist = false;
    }
  });
  
  if (allFilesExist) {
    console.log('\n🎉 Build completed successfully!');
    
    // Get build size info
    try {
      const indexSize = fs.statSync('build/index.html').size;
      console.log(`📊 Index.html size: ${(indexSize / 1024).toFixed(2)} KB`);
      
      if (fs.existsSync('build/static/js')) {
        const jsFiles = fs.readdirSync('build/static/js');
        const mainJs = jsFiles.find(file => file.startsWith('main.'));
        if (mainJs) {
          const jsSize = fs.statSync(`build/static/js/${mainJs}`).size;
          console.log(`📊 Main JS size: ${(jsSize / 1024).toFixed(2)} KB`);
        }
      }
      
      if (fs.existsSync('build/static/css')) {
        const cssFiles = fs.readdirSync('build/static/css');
        const mainCss = cssFiles.find(file => file.startsWith('main.'));
        if (mainCss) {
          const cssSize = fs.statSync(`build/static/css/${mainCss}`).size;
          console.log(`📊 Main CSS size: ${(cssSize / 1024).toFixed(2)} KB`);
        }
      }
    } catch (error) {
      console.log('📊 Could not get build size info');
    }
    
    console.log('\n✨ Ready for deployment!');
    console.log('Run: node deploy.js');
    
  } else {
    console.error('\n❌ Build incomplete - missing critical files');
    process.exit(1);
  }
  
} else {
  console.error('❌ Build directory not created');
  process.exit(1);
}

// Environment check
console.log('\n🔧 Environment Configuration:');
if (fs.existsSync('.env')) {
  console.log('✅ .env file exists');
} else {
  console.log('⚠️  .env file not found - using .env.example template');
}

console.log('\n📋 Pre-deployment checklist:');
console.log('□ Environment variables configured (.env)');
console.log('□ Firebase project created');
console.log('□ Google Sheets API configured (optional)');
console.log('□ SendGrid account set up (optional)');
console.log('□ Custom domain configured (optional)');
console.log('\n🚀 Ready to deploy: node deploy.js');