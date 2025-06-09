const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting deployment process...\n');

// Check if firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.log('❌ Firebase CLI not found. Installing...');
  try {
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    console.log('✅ Firebase CLI installed');
  } catch (installError) {
    console.error('❌ Failed to install Firebase CLI. Please install manually:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }
}

// Check if user is logged in
try {
  execSync('firebase projects:list', { stdio: 'ignore' });
  console.log('✅ Firebase login verified');
} catch (error) {
  console.log('❌ Not logged in to Firebase. Please login:');
  console.log('firebase login');
  process.exit(1);
}

// Check if .env file exists and has required variables
if (!fs.existsSync('.env')) {
  console.log('⚠️  .env file not found. Creating template...');
  fs.copyFileSync('.env.example', '.env');
  console.log('✅ .env template created. Please configure your environment variables.');
}

// Build the project
console.log('\n📦 Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed. Please fix errors and try again.');
  process.exit(1);
}

// Check if build directory exists
if (!fs.existsSync('build')) {
  console.error('❌ Build directory not found');
  process.exit(1);
}

// Initialize Firebase project if needed
if (!fs.existsSync('.firebaserc')) {
  console.log('\n🔧 Firebase project not initialized. Please run:');
  console.log('firebase init hosting');
  console.log('Then run this script again.');
  process.exit(1);
}

// Deploy to Firebase
console.log('\n🚀 Deploying to Firebase Hosting...');
try {
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  console.log('\n🎉 Deployment completed successfully!');
  
  // Get hosting URL
  try {
    const result = execSync('firebase hosting:sites:list --json', { encoding: 'utf8' });
    const sites = JSON.parse(result);
    if (sites.length > 0) {
      const url = `https://${sites[0].defaultUrl || sites[0].site}.web.app`;
      console.log(`\n🌐 Your app is live at: ${url}`);
      console.log(`\n📱 To test on mobile: Open this URL on your smartphone`);
    }
  } catch (urlError) {
    console.log('\n🌐 Deployment successful! Check Firebase Console for the URL.');
  }
  
} catch (error) {
  console.error('❌ Deployment failed');
  process.exit(1);
}

console.log('\n✨ Next steps:');
console.log('1. Test the deployed app on mobile devices');
console.log('2. Configure your domain (optional)');
console.log('3. Set up monitoring and analytics');
console.log('4. Update DNS if using custom domain');