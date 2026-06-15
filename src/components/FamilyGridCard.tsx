import type { Product } from '../types';

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

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', textAlign: 'center', background: 'var(--bg)' }}>
        {firstProduct.customImageBase64 ? (
          <img 
            src={firstProduct.customImageBase64} 
            alt={firstProduct.displayTitle} 
            style={{ width: '100%', height: '180px', objectFit: 'contain' }}
          />
        ) : imageMap[familyId] ? (
          <img 
            src={`/product-images/${familyId}.jpg`} 
            alt={firstProduct.displayTitle} 
            style={{ width: '100%', height: '180px', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            No Image
          </div>
        )}
      </div>
      
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{firstProduct.displayTitle}</h3>
          {firstProduct.sourcePage > 0 && (
            <a href={`#/pdf/${firstProduct.sourcePage}`} className="page-link" onClick={e => e.stopPropagation()}>
              📄 {firstProduct.sourcePage}
            </a>
          )}
        </div>
        {firstProduct.category && (
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {firstProduct.category} {firstProduct.variant ? `• ${firstProduct.variant}` : ''}
          </div>
        )}
      </div>

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
    </div>
  );
}
