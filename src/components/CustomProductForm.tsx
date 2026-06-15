import { useState } from 'react';
import type { Product } from '../types';

interface Props {
  onClose: () => void;
  onSave: (product: Product) => void;
  onImageUploaded: (familyId: string) => void;
}

export function CustomProductForm({ onClose, onSave, onImageUploaded }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [customImageBase64, setCustomImageBase64] = useState<string | undefined>(undefined);
  
  const [customFamilyId] = useState(() => `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`);

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      // Local Base64 resizing
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions 200x200
          const MAX = 200;
          if (width > height) {
            if (width > MAX) {
              height *= MAX / width;
              width = MAX;
            }
          } else {
            if (height > MAX) {
              width *= MAX / height;
              height = MAX;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // compress to 70% quality
            setCustomImageBase64(dataUrl);
            setUploadedImageUrl(dataUrl); // Show preview
            onImageUploaded(customFamilyId); // Tell app an image exists for this ID
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (e) {
      alert('Failed to process image');
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Product Name is required');
      return;
    }
    
    // Create a mock product
    const p: Product = {
      id: customFamilyId, // Use familyId as unique id for custom products
      familyId: customFamilyId,
      sourcePage: 0,
      productName: name,
      category: category || null,
      variant: null,
      size: null,
      pressure: null,
      mrp: price ? parseFloat(price) : null,
      isAvailable: true,
      
      displayTitle: name,
      displaySubtitle: category || '',
      attributeLine: category || '',
      displayPrice: price ? `₹${price}` : 'Price NA',
      
      variantKey: '',
      sizeKey: '',
      pressureKey: '',
      salesKey: '',
      searchBlob: '',
      searchText: '',
    };
    
    if (customImageBase64) {
      p.customImageBase64 = customImageBase64;
    }
    
    onSave(p);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px'
    }}>
      <h2 style={{ margin: 0, fontSize: '16px', color: 'var(--accent)' }}>Add Custom Product</h2>
      
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--muted)' }}>Product Name *</label>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}
        />
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--muted)' }}>Category / Subtitle</label>
        <input 
          type="text" 
          value={category} 
          onChange={e => setCategory(e.target.value)} 
          style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--muted)' }}>Price (₹)</label>
        <input 
          type="number" 
          value={price} 
          onChange={e => setPrice(e.target.value)} 
          style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--muted)' }}>Product Image (Optional)</label>
        <div 
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive ? 'rgba(31,111,235,0.05)' : 'transparent',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {uploadedImageUrl ? (
            <img src={uploadedImageUrl} alt="Uploaded" style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
              Drag & Drop image here, or click to browse
            </div>
          )}
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp"
            onChange={handleChange}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button className="img-btn-back" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="cta" style={{ flex: 1 }} onClick={handleSave}>Add Product</button>
      </div>
    </div>
  );
}
