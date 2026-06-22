import { useMemo, useState } from 'react';
import type { Catalog } from '../../data/catalog';
import './ImageManager.css';

interface Props {
  catalog: Catalog | null;
  imageMap: Record<string, boolean>;
  onImageUploaded: (familyId: string) => void;
  onBack: () => void;
}

export function ImageManager({ catalog, imageMap, onImageUploaded, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [dragHoverId, setDragHoverId] = useState<string | null>(null);

  // Group catalog by familyId and pick the best representative (lowest source_page)
  const groups = useMemo(() => {
    if (!catalog) return [];
    
    const map = new Map<string, { familyId: string; productName: string; variant: string | null; category: string | null; sourcePage: number }>();
    
    for (const p of catalog.all) {
      if (!map.has(p.familyId)) {
        map.set(p.familyId, {
          familyId: p.familyId,
          productName: p.productName,
          variant: p.variant,
          category: p.category,
          sourcePage: p.sourcePage,
        });
      } else {
        const existing = map.get(p.familyId)!;
        if (p.sourcePage < existing.sourcePage) {
          existing.sourcePage = p.sourcePage;
        }
      }
    }
    
    return Array.from(map.values()).sort((a, b) => {
      if (a.sourcePage !== b.sourcePage) return a.sourcePage - b.sourcePage;
      return a.productName.localeCompare(b.productName);
    });
  }, [catalog]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter(g => 
      g.productName.toLowerCase().includes(q) || 
      (g.variant && g.variant.toLowerCase().includes(q)) ||
      (g.category && g.category.toLowerCase().includes(q))
    );
  }, [groups, search]);

  const handleFileUpload = async (familyId: string, file: File) => {
    // Only accept images
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'x-family-id': familyId,
          'Content-Type': 'application/octet-stream',
        },
        body: buffer,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      // Success! Update local map
      onImageUploaded(familyId);
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Make sure the dev server is running.');
    }
  };

  const handleDragOver = (e: React.DragEvent, familyId: string) => {
    e.preventDefault();
    setDragHoverId(familyId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragHoverId(null);
  };

  const handleDrop = (e: React.DragEvent, familyId: string) => {
    e.preventDefault();
    setDragHoverId(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(familyId, e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="img-manager">
      <header className="img-header">
        <div className="img-header-left">
          <button className="img-btn-back" onClick={onBack}>← Back to App</button>
          <h2>Image Manager</h2>
          <span className="img-count">{groups.length} Product Families</span>
        </div>
        <input 
          type="text" 
          placeholder="Search product..." 
          className="img-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </header>

      <div className="img-grid">
        {filteredGroups.map(g => {
          const hasImage = imageMap[g.familyId];
          const imgSrc = hasImage ? `/product-images/${g.familyId}.webp?t=${Date.now()}` : null;
          const isDragHover = dragHoverId === g.familyId;

          return (
            <div key={g.familyId} className="img-card">
              <div 
                className={`img-card-preview ${isDragHover ? 'img-card-preview--drag' : ''}`}
                onDragOver={(e) => handleDragOver(e, g.familyId)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, g.familyId)}
              >
                {isDragHover && (
                  <div className="img-drag-overlay">
                    <span>Drop Image Here</span>
                  </div>
                )}
                {imgSrc ? (
                  <img src={imgSrc} alt={g.productName} />
                ) : (
                  <div className="img-placeholder">
                    <span>No Image</span>
                    <span className="img-placeholder-hint">Click Upload or Drop file</span>
                  </div>
                )}
                
                <label className="img-upload-btn">
                  {hasImage ? 'Replace Image' : 'Upload Image'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(g.familyId, e.target.files[0]);
                        // Reset input so the same file can be uploaded again if needed
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
              
              <div className="img-card-info">
                <span className="img-page">Pg {g.sourcePage === 9999 ? '?' : g.sourcePage}</span>
                <div className="img-category">{g.category}</div>
                <div className="img-name">{g.productName}</div>
                {g.variant && g.variant.toLowerCase() !== 'standard' && (
                  <div className="img-variant">{g.variant}</div>
                )}
              </div>
            </div>
          );
        })}
        {filteredGroups.length === 0 && (
          <div className="img-empty">No products found for "{search}"</div>
        )}
      </div>
    </div>
  );
}
