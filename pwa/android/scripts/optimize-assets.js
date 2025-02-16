const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const BUILD_DIR = path.join(__dirname, '../build');
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

async function optimizeImages(directory) {
  try {
    const files = await readdir(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        await optimizeImages(filePath);
        continue;
      }
      
      const ext = path.extname(file).toLowerCase();
      if (!IMAGE_EXTENSIONS.includes(ext)) continue;
      
      console.log(`Optimizing: ${file}`);
      
      try {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        
        // Skip if already optimized
        if (metadata.format === 'webp') continue;
        
        // Convert to WebP with appropriate quality
        await image
          .webp({ quality: 80 })
          .toFile(filePath.replace(ext, '.webp'));
        
        // Remove original file
        await fs.promises.unlink(filePath);
        
        console.log(`Optimized: ${file} -> ${file.replace(ext, '.webp')}`);
      } catch (err) {
        console.error(`Failed to optimize ${file}:`, err);
      }
    }
  } catch (err) {
    console.error('Error during image optimization:', err);
  }
}

async function optimizeOnnxModels(directory) {
  try {
    const files = await readdir(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        await optimizeOnnxModels(filePath);
        continue;
      }
      
      if (path.extname(file) !== '.onnx') continue;
      
      console.log(`Processing ONNX model: ${file}`);
      
      // Here we could add model optimization logic
      // For now, we'll just ensure it's properly compressed
      try {
        const gzip = require('zlib').createGzip();
        const source = fs.createReadStream(filePath);
        const destination = fs.createWriteStream(`${filePath}.gz`);
        
        await new Promise((resolve, reject) => {
          source
            .pipe(gzip)
            .pipe(destination)
            .on('finish', resolve)
            .on('error', reject);
        });
        
        console.log(`Compressed: ${file}`);
      } catch (err) {
        console.error(`Failed to compress ${file}:`, err);
      }
    }
  } catch (err) {
    console.error('Error during ONNX model optimization:', err);
  }
}

async function main() {
  console.log('Starting asset optimization...');
  
  // Optimize images
  await optimizeImages(BUILD_DIR);
  
  // Optimize ONNX models
  const modelsDir = path.join(BUILD_DIR, 'models');
  if (fs.existsSync(modelsDir)) {
    await optimizeOnnxModels(modelsDir);
  }
  
  console.log('Asset optimization complete!');
}

main().catch(console.error);
