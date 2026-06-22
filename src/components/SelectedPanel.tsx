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
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(count);

  const total = items.reduce((sum, item) => sum + (item.discountedPrice || 0) * (item.quantity || 1), 0);

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
    <>
      <aside className={`panel ${isMobileSheetOpen ? 'panel--mobile-open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="panel__head" style={{ display: isMobileSheetOpen ? 'none' : 'flex' }}>
          <span>Selected</span>
          <span className="badge">{count}</span>
        </div>
        
        {isMobileSheetOpen && (
          <div className="mobile-sheet-header">
            <h3>Selected Items ({count})</h3>
            <button onClick={() => setIsMobileSheetOpen(false)}>✕</button>
          </div>
        )}

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
                {p.customImageBase64 ? (
                  <img src={p.customImageBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : imageMap[p.familyId] ? (
                  <img src={`/product-images/${p.familyId}.webp`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div className="card__thumbnail-placeholder" style={{ fontSize: '8px' }}>No Img</div>
                )}
              </div>
              <div className="selected-item__body" style={{ flex: 1, minWidth: 0 }}>
                <div className="card__title">{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  {p.subtitle && (
                    <div className="card__subtitle" style={{ margin: 0 }}>{p.subtitle}</div>
                  )}
                  {p.sourcePage && p.sourcePage > 0 && (
                    <a href={`#/pdf/${p.sourcePage}`} className="page-link" onClick={e => e.stopPropagation()}>
                      📄 {p.sourcePage}
                    </a>
                  )}
                </div>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              style={{
                flex: 1,
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
              + Custom Product
            </button>
            {isMobileSheetOpen && (
              <button 
                style={{
                  flex: 1,
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
                onClick={() => setIsMobileSheetOpen(false)}
              >
                + Search Product
              </button>
            )}
          </div>
          <button
            className="cta"
            disabled={count === 0}
            onClick={() => {
              setIsMobileSheetOpen(false);
              onNavigateQuotation();
            }}
            style={{ width: '100%', margin: 0 }}
          >
            {count > 0 ? 'Create Quotation' : 'Create Quotation'}
          </button>
        </div>
      )}
      </aside>

      {!isMobileSheetOpen && count > 0 && (
        <div className="mobile-cart-bar" onClick={() => setIsMobileSheetOpen(true)}>
          <div className="mobile-cart-bar__info">
            <span style={{ fontSize: '24px' }}>🛒</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{count} Items | ₹{Math.round(total)}</span>
              <span style={{ fontSize: '12px', opacity: 0.9 }}>Tap to View & Edit</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


