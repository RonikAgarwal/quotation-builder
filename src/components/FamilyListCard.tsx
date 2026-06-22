import { useState } from 'react';
import type { Product } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  familyId: string;
  firstProduct: Product;
  allProducts: Product[];
  count: number;
  imageMap: Record<string, boolean>;
  isExpanded: boolean;
  onToggleGroup: () => void;
  isSelected: (id: string) => boolean;
  onToggle: (product: Product) => void;
  active: boolean;
}

export function FamilyListCard({
  familyId,
  firstProduct: p,
  allProducts,
  count,
  imageMap,
  isExpanded,
  onToggleGroup,
  isSelected,
  onToggle,
  active
}: Props) {
  const isMobile = useIsMobile();
  const [isSizePopupOpen, setIsSizePopupOpen] = useState(false);

  // Calculate if any items are selected
  const selectedCount = allProducts.filter(prod => isSelected(prod.id)).length;

  const sortedProducts = [...allProducts].sort((a, b) => {
    const sizeA = a.size || '';
    const sizeB = b.size || '';
    return sizeA.localeCompare(sizeB, undefined, { numeric: true });
  });

  return (
    <>
      <div 
        className={`card ${active ? 'card--active' : ''}`}
        onClick={isMobile ? () => setIsSizePopupOpen(true) : onToggleGroup}
        style={{ cursor: 'pointer', paddingRight: isMobile ? '8px' : undefined }}
      >
        {!isMobile && (
          <div style={{ width: '18px', textAlign: 'center', color: 'var(--muted)', fontWeight: 800 }}>
            {isExpanded ? '▼' : '▶'}
          </div>
        )}
        
        <div className="card__thumbnail">
          {p.customImageBase64 ? (
            <img src={p.customImageBase64} alt="" style={{ objectFit: 'contain' }} />
          ) : imageMap[familyId] ? (
            <img src={`/product-images/${familyId}.webp`} alt="" />
          ) : (
            <div className="card__thumbnail-placeholder">No Img</div>
          )}
        </div>

        <div className="card__body">
          <div className="card__title">{p.productName}</div>
          <div className="card__subtitle">
            {p.category} {p.variant && p.variant.toLowerCase() !== 'standard' ? `• ${p.variant}` : ''}
          </div>
        </div>

        {isMobile ? (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <button 
              className={`family-grid-card__mobile-btn ${selectedCount > 0 ? 'family-grid-card__mobile-btn--selected' : ''}`}
              style={{ width: 'auto', padding: '6px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
              onClick={(e) => {
                e.stopPropagation();
                setIsSizePopupOpen(true);
              }}
            >
              {selectedCount > 0 ? `${selectedCount} Selected` : 'Select Size ▾'}
            </button>
          </div>
        ) : (
          <div className="card__price" style={{ color: 'var(--muted)', fontSize: '13px', fontWeight: 'normal' }}>
            ({count} size{count !== 1 ? 's' : ''} available)
          </div>
        )}
      </div>

      {/* Mobile Size Popup */}
      {isMobile && isSizePopupOpen && (
        <>
          <div className="mobile-size-backdrop" onClick={(e) => { e.stopPropagation(); setIsSizePopupOpen(false); }} />
          <div className="mobile-size-popup">
            <div className="mobile-size-popup__header">
              <h4>{p.displayTitle}</h4>
              <button onClick={(e) => { e.stopPropagation(); setIsSizePopupOpen(false); }}>✕</button>
            </div>
            <div className="mobile-size-popup__list">
              {sortedProducts.map(prod => {
                const selected = isSelected(prod.id);
                return (
                  <button
                    key={prod.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(prod);
                    }}
                    className={`mobile-size-popup__item ${selected ? 'mobile-size-popup__item--selected' : ''}`}
                  >
                    <div style={{ fontWeight: 500 }}>
                      {prod.size || 'Standard'} {prod.pressure ? ` • ${prod.pressure}` : ''}
                    </div>
                    <div style={{ fontWeight: selected ? 700 : 600 }}>
                      {prod.displayPrice}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ padding: '12px' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsSizePopupOpen(false); }}
                style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
