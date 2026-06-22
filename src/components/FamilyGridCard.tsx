import { useState } from 'react';
import type { Product } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import './FamilyGridCard.css';

interface Props {
  familyId: string;
  firstProduct: Product;
  allProducts: Product[];
  imageMap: Record<string, boolean>;
  isSelected: (id: string) => boolean;
  onToggle: (product: Product) => void;
}

export function FamilyGridCard({ familyId, firstProduct, allProducts, imageMap, isSelected, onToggle }: Props) {
  // We want to sort allProducts so sizes appear logically.
  // We can just use the order they arrived in, or sort by size.
  const sortedProducts = [...allProducts].sort((a, b) => {
    const sizeA = a.size || '';
    const sizeB = b.size || '';
    return sizeA.localeCompare(sizeB, undefined, { numeric: true });
  });

  const isMobile = useIsMobile();
  const [isSizePopupOpen, setIsSizePopupOpen] = useState(false);

  // Calculate if any items are selected
  const selectedCount = allProducts.filter(p => isSelected(p.id)).length;

  return (
    <div className="family-grid-card">
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', textAlign: 'center', background: 'var(--bg)' }}>
        {firstProduct.customImageBase64 ? (
          <img 
            src={firstProduct.customImageBase64} 
            alt={firstProduct.displayTitle} 
            style={{ width: '100%', height: isMobile ? '100px' : '180px', objectFit: 'contain' }}
          />
        ) : imageMap[familyId] ? (
          <img 
            src={`/product-images/${familyId}.webp`} 
            alt={firstProduct.displayTitle} 
            style={{ width: '100%', height: isMobile ? '100px' : '180px', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ width: '100%', height: isMobile ? '100px' : '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: isMobile ? '12px' : '14px' }}>
            No Image
          </div>
        )}
      </div>
      
      <div className="family-grid-card__info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <h3 className="family-grid-card__title">{firstProduct.displayTitle}</h3>
          {!isMobile && firstProduct.sourcePage > 0 && (
            <a href={`#/pdf/${firstProduct.sourcePage}`} className="page-link" onClick={e => e.stopPropagation()}>
              📄 {firstProduct.sourcePage}
            </a>
          )}
        </div>
        {firstProduct.category && (
          <div className="family-grid-card__subtitle">
            {firstProduct.category} {firstProduct.variant ? `• ${firstProduct.variant}` : ''}
          </div>
        )}
      </div>

      {isMobile ? (
        <div style={{ padding: '8px' }}>
          <button 
            className={`family-grid-card__mobile-btn ${selectedCount > 0 ? 'family-grid-card__mobile-btn--selected' : ''}`}
            onClick={() => setIsSizePopupOpen(true)}
          >
            {selectedCount > 0 ? `${selectedCount} Size(s) Selected` : 'Select Size ▾'}
          </button>
        </div>
      ) : (
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {sortedProducts.map(p => {
            const selected = isSelected(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: selected ? 'var(--accent)' : 'transparent',
                  color: selected ? '#fff' : 'inherit',
                  border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 500 }}>
                  {p.size || 'Standard'} {p.pressure ? ` • ${p.pressure}` : ''}
                </div>
                <div style={{ fontWeight: selected ? 600 : 500 }}>
                  {p.displayPrice}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile Size Popup */}
      {isMobile && isSizePopupOpen && (
        <>
          <div className="mobile-size-backdrop" onClick={() => setIsSizePopupOpen(false)} />
          <div className="mobile-size-popup">
            <div className="mobile-size-popup__header">
              <h4>{firstProduct.displayTitle}</h4>
              <button onClick={() => setIsSizePopupOpen(false)}>✕</button>
            </div>
            <div className="mobile-size-popup__list">
              {sortedProducts.map(p => {
                const selected = isSelected(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onToggle(p);
                      // Close popup on select to speed up flow, or let them pick multiple?
                      // The prompt: "once selected it turns blue" implies it can stay open or close. Let's keep it open so they can pick multiple.
                    }}
                    className={`mobile-size-popup__item ${selected ? 'mobile-size-popup__item--selected' : ''}`}
                  >
                    <div style={{ fontWeight: 500 }}>
                      {p.size || 'Standard'} {p.pressure ? ` • ${p.pressure}` : ''}
                    </div>
                    <div style={{ fontWeight: selected ? 700 : 600 }}>
                      {p.displayPrice}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ padding: '12px' }}>
              <button 
                onClick={() => setIsSizePopupOpen(false)}
                style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
