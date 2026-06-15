import { useState, useRef, useEffect } from 'react';
import type { Product, QuotationItem } from '../types';
import { CustomProductForm } from './CustomProductForm';

interface Props {
  items: QuotationItem[];
  count: number;
  onRemove: (id: string) => void;
  onNavigateQuotation: () => void;
  imageMap: Record<string, boolean>;
  onAddCustomProduct: (product: Product) => void;
  onImageUploaded: (familyId: string) => void;
}

export function SelectedPanel({ items, count, onRemove, onNavigateQuotation, imageMap, onAddCustomProduct, onImageUploaded }: Props) {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current && listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    prevCount.current = count;
  }, [count]);

  return (
    <aside className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel__head">
        <span>Selected</span>
        <span className="badge">{count}</span>
      </div>

      <div className="panel__list" ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
        {isAddingCustom ? (
          <CustomProductForm 
            onClose={() => setIsAddingCustom(false)}
            onSave={(prod: Product) => {
              onAddCustomProduct(prod);
              setIsAddingCustom(false);
            }}
            onImageUploaded={onImageUploaded}
          />
        ) : items.length === 0 ? (
          <div className="empty">No products selected yet.</div>
        ) : (
          items.map((p) => (
            <div key={p.id} className="selected-item" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="card__thumbnail" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                {imageMap[p.familyId] ? (
                  <img src={`/product-images/${p.familyId}.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div className="card__thumbnail-placeholder" style={{ fontSize: '8px' }}>No Img</div>
                )}
              </div>
              <div className="selected-item__body" style={{ flex: 1, minWidth: 0 }}>
                <div className="card__title">{p.name}</div>
                {p.subtitle && (
                  <div className="card__subtitle">{p.subtitle}</div>
                )}
              </div>
              <div className="selected-item__price" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span>{typeof p.mrp === 'number' ? `₹${p.mrp}` : 'Price NA'}</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Qty: {p.quantity}</span>
              </div>
              <button
                className="remove"
                onClick={() => onRemove(p.id)}
                aria-label={`Remove ${p.name}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {!isAddingCustom && (
        <div style={{ padding: '10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px dashed var(--border)',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--muted)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
            onClick={() => setIsAddingCustom(true)}
          >
            + Add Custom Product
          </button>
          <button
            className="cta"
            disabled={count === 0}
            onClick={onNavigateQuotation}
            style={{ width: '100%', margin: 0 }}
          >
            {count > 0 ? 'Update Quotation' : 'Create Quotation'}
          </button>
        </div>
      )}
    </aside>
  );
}


