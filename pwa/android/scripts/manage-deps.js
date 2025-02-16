#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CACHE_DIR = '.npm-cache';
const OFFLINE_MARKER = '.offline-mode';

function isOfflineMode() {
    return fs.existsSync(path.join(__dirname, '..', OFFLINE_MARKER));
}

function setOfflineMode(enabled) {
    const markerPath = path.join(__dirname, '..', OFFLINE_MARKER);
    if (enabled) {
        fs.writeFileSync(markerPath, '');
    } else if (fs.existsSync(markerPath)) {
        fs.unlinkSync(markerPath);
    }
}

function ensureCacheDir() {
    const cacheDir = path.join(__dirname, '..', CACHE_DIR);
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
}

function cachePackages() {
    console.log('📦 Caching packages for offline use...');
    ensureCacheDir();
    execSync('npm ci --prefer-offline', { stdio: 'inherit' });
    setOfflineMode(true);
    console.log('✅ Packages cached successfully!');
}

function installOffline() {
    console.log('📦 Installing packages from cache...');
    execSync('npm ci --offline', { stdio: 'inherit' });
    console.log('✅ Packages installed from cache!');
}

function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'cache':
            cachePackages();
            break;
        case 'install':
            if (isOfflineMode()) {
                installOffline();
            } else {
                console.log('⚠️ Not in offline mode. Run `npm run deps:cache` first.');
                process.exit(1);
            }
            break;
        case 'status':
            console.log(`📡 Offline mode: ${isOfflineMode() ? 'enabled' : 'disabled'}`);
            break;
        default:
            console.log(`
Usage: node ${path.basename(__filename)} <command>

Commands:
  cache   - Cache packages for offline use
  install - Install packages from cache
  status  - Check offline mode status
            `);
            process.exit(1);
    }
}

main();
