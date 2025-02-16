const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const semver = require('semver');

// Configuration
const CONFIG = {
  android: {
    manifestPath: '../android/app/src/main/AndroidManifest.xml',
    gradlePath: '../android/app/build.gradle',
  },
  web: {
    manifestPath: '../public/manifest.json',
  },
  packageJson: '../package.json',
};

function updateVersion() {
  // Read current version from package.json
  const packageJson = JSON.parse(fs.readFileSync(CONFIG.packageJson));
  const currentVersion = packageJson.version;
  
  // Increment version
  const newVersion = semver.inc(currentVersion, 'patch');
  console.log(`Updating version: ${currentVersion} -> ${newVersion}`);
  
  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(CONFIG.packageJson, JSON.stringify(packageJson, null, 2));
  
  // Update Android version codes
  updateAndroidVersions(newVersion);
  
  // Update Web manifest
  updateWebManifest(newVersion);
  
  return newVersion;
}

function updateAndroidVersions(version) {
  // Update build.gradle
  let gradleContent = fs.readFileSync(CONFIG.android.gradlePath, 'utf8');
  const versionCode = Math.floor(new Date().getTime() / 1000);
  
  gradleContent = gradleContent.replace(
    /versionCode \d+/,
    `versionCode ${versionCode}`
  );
  
  gradleContent = gradleContent.replace(
    /versionName "[^"]+"/,
    `versionName "${version}"`
  );
  
  fs.writeFileSync(CONFIG.android.gradlePath, gradleContent);
  
  console.log(`Updated Android versions: ${version} (${versionCode})`);
}

function updateWebManifest(version) {
  const manifestPath = path.resolve(__dirname, CONFIG.web.manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  
  manifest.version = version;
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Updated Web manifest version: ${version}`);
}

function validateBuild() {
  console.log('Running build validation...');
  
  // Run tests
  try {
    execSync('npm run test', { stdio: 'inherit' });
  } catch (error) {
    console.error('Tests failed!');
    process.exit(1);
  }
  
  // Build web
  try {
    execSync('npm run build:web', { stdio: 'inherit' });
  } catch (error) {
    console.error('Web build failed!');
    process.exit(1);
  }
  
  // Build Android
  try {
    execSync('npm run build:android', { stdio: 'inherit' });
  } catch (error) {
    console.error('Android build failed!');
    process.exit(1);
  }
  
  console.log('Build validation successful!');
}

function createGitTag(version) {
  try {
    // Create and push tag
    execSync(`git tag -a v${version} -m "Release version ${version}"`, { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });
    console.log(`Created and pushed git tag: v${version}`);
  } catch (error) {
    console.error('Failed to create git tag:', error);
    process.exit(1);
  }
}

function generateChangelog(version) {
  const changelogPath = path.resolve(__dirname, '../CHANGELOG.md');
  const date = new Date().toISOString().split('T')[0];
  
  // Get commit messages since last tag
  const commits = execSync('git log $(git describe --tags --abbrev=0)..HEAD --oneline')
    .toString()
    .trim()
    .split('\n')
    .map(line => `- ${line}`)
    .join('\n');
  
  const changelog = `\n## [${version}] - ${date}\n\n${commits}\n`;
  
  // Prepend to CHANGELOG.md
  const existingChangelog = fs.existsSync(changelogPath)
    ? fs.readFileSync(changelogPath, 'utf8')
    : '# Changelog\n';
  
  fs.writeFileSync(changelogPath, existingChangelog + changelog);
  console.log('Updated CHANGELOG.md');
}

async function main() {
  try {
    // Ensure we're on main branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    if (currentBranch !== 'main') {
      console.error('Must be on main branch to prepare release!');
      process.exit(1);
    }
    
    // Ensure working directory is clean
    const status = execSync('git status --porcelain').toString().trim();
    if (status) {
      console.error('Working directory must be clean!');
      process.exit(1);
    }
    
    // Update versions
    const newVersion = updateVersion();
    
    // Validate build
    validateBuild();
    
    // Generate changelog
    generateChangelog(newVersion);
    
    // Commit version changes
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "Release version ${newVersion}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    
    // Create git tag
    createGitTag(newVersion);
    
    console.log(`\nSuccessfully prepared release ${newVersion}!`);
    
  } catch (error) {
    console.error('Failed to prepare release:', error);
    process.exit(1);
  }
}

main().catch(console.error);
