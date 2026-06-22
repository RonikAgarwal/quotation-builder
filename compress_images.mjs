import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function processDirectory(dirPath, maxWidth) {
  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await processDirectory(fullPath, maxWidth);
      } else if (/\.(png|jpe?g)$/i.test(item)) {
        const parsed = path.parse(fullPath);
        const newPath = path.join(parsed.dir, `${parsed.name}.webp`);

        console.log(`Processing ${fullPath} -> ${newPath}`);

        try {
          const image = sharp(fullPath);
          const metadata = await image.metadata();

          let pipeline = image;
          if (metadata.width > maxWidth) {
            pipeline = pipeline.resize(maxWidth);
          }

          await pipeline
            .webp({ quality: 80 })
            .toFile(newPath);

          // Only delete original if conversion was successful
          await fs.unlink(fullPath);
          console.log(`Successfully compressed and replaced ${item}`);
        } catch (err) {
          console.error(`Error processing ${item}:`, err);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
  }
}

async function run() {
  console.log('Starting batch compression...');
  
  // 1. Process logo.png
  try {
    const logoPath = path.join(PUBLIC_DIR, 'logo.png');
    const newLogoPath = path.join(PUBLIC_DIR, 'logo.webp');
    await sharp(logoPath).resize(400).webp({ quality: 85 }).toFile(newLogoPath);
    await fs.unlink(logoPath);
    console.log('Logo compressed successfully!');
  } catch (e) {
    console.log('Logo processing error (might already be deleted):', e.message);
  }

  // 2. Process product images and homepage assets
  await processDirectory(path.join(PUBLIC_DIR, 'product-images'), 400);
  await processDirectory(path.join(PUBLIC_DIR, 'homepage-assets'), 600);

  console.log('Batch compression complete!');
}

run();
