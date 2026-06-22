import fs from 'fs/promises';
import path from 'path';

async function replaceInFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let original = content;

    // Replacements
    content = content.replace(/logo\.png/g, 'logo.webp');
    content = content.replace(/\.jpg/g, '.webp');
    content = content.replace(/\.jpeg/g, '.webp');
    // For BrandsMarquee specifically, it had .png.jpeg or .png, let's just make them .webp
    content = content.replace(/asianpaints\.png\.webp/g, 'asianpaints.webp'); // because .jpeg became .webp above
    content = content.replace(/asianpaints\.png/g, 'asianpaints.webp');
    
    content = content.replace(/berger\.png\.webp/g, 'berger.webp');
    content = content.replace(/berger\.png/g, 'berger.webp');

    content = content.replace(/crompton\.png\.webp/g, 'crompton.webp');
    content = content.replace(/crompton\.png/g, 'crompton.webp');

    content = content.replace(/ipsa\.png\.webp/g, 'ipsa.webp');
    content = content.replace(/ipsa\.png/g, 'ipsa.webp');

    content = content.replace(/parryware\.png\.webp/g, 'parryware.webp');
    content = content.replace(/parryware\.png/g, 'parryware.webp');

    content = content.replace(/supreme\.png\.webp/g, 'supreme.webp');
    content = content.replace(/supreme\.png/g, 'supreme.webp');

    content = content.replace(/pidilite\.png/g, 'pidilite.webp');

    if (content !== original) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`Updated ${filePath}`);
    }
  } catch (err) {
    console.error(`Error in ${filePath}:`, err);
  }
}

async function walkDir(dir) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await walkDir(fullPath);
    } else if (/\.(tsx|ts|jsx|js|html)$/.test(file)) {
      await replaceInFile(fullPath);
    }
  }
}

walkDir(path.join(process.cwd(), 'src'));
replaceInFile(path.join(process.cwd(), 'index.html'));
