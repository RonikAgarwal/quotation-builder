import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Custom plugin to handle image uploads locally during development
function localImageUploadPlugin() {
  return {
    name: 'local-image-upload',
    configureServer(server) {
      server.middlewares.use('/api/upload-image', (req, res) => {
        if (req.method === 'POST') {
          const familyId = req.headers['x-family-id'];
          if (!familyId || typeof familyId !== 'string') {
            res.statusCode = 400;
            res.end('Missing x-family-id header');
            return;
          }
          
          const chunks: any[] = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const imagePath = path.join(__dirname, 'public', 'product-images', `${familyId}.jpg`);
            
            // Write image to disk
            fs.writeFileSync(imagePath, buffer);
            
            // Update image-map.json
            const mapPath = path.join(__dirname, 'public', 'image-map.json');
            let map: Record<string, boolean> = {};
            try {
              if (fs.existsSync(mapPath)) {
                map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
              }
            } catch (e) {
              // Ignore parse errors, just overwrite
            }
            map[familyId] = true;
            fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, familyId }));
          });
        } else {
          res.statusCode = 405;
          res.end('Method not allowed');
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localImageUploadPlugin()],
});
