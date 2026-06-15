import type { Product, RenderItem } from '../types';
import { ProductCard } from './ProductCard';

interface Props {
  items: RenderItem[];
  activeIndex: number;
  isSelected: (id: string) => boolean;
  onToggle: (p: Product) => void;
  onToggleGroup: (familyId: string) => void;
  expandedGroups: Set<string>;
  imageMap: Record<string, boolean>;
}

export function ResultsList({ items, activeIndex, isSelected, onToggle, onToggleGroup, expandedGroups, imageMap }: Props) {
  if (items.length === 0) {
    return <div className="empty">No matching products.</div>;
  }
  return (
    <div className="results">
      {items.map((item, i) => {
        if (item.type === 'group') {
          const isExpanded = expandedGroups.has(item.familyId);
          const p = item.firstProduct;
          const hasImage = imageMap[p.familyId];

          return (
            <div 
              key={`group-${item.familyId}`}
              className={`card ${i === activeIndex ? 'card--active' : ''}`}
              onClick={() => onToggleGroup(item.familyId)}
            >
              <div style={{ width: '18px', textAlign: 'center', color: 'var(--muted)', fontWeight: 800 }}>
                {isExpanded ? '▼' : '▶'}
              </div>
              
              <div className="card__thumbnail">
                {hasImage ? (
                  <img src={`/product-images/${p.familyId}.jpg`} alt={p.productName} loading="lazy" />
                ) : (
                  <div className="card__thumbnail-placeholder">No Image</div>
                )}
              </div>

              <div className="card__body">
                <div className="card__title">{p.productName}</div>
                <div className="card__subtitle">
                  {p.category} {p.variant && p.variant.toLowerCase() !== 'standard' ? `• ${p.variant}` : ''}
                </div>
              </div>

              <div className="card__price" style={{ color: 'var(--muted)', fontSize: '13px', fontWeight: 'normal' }}>
                ({item.count} size{item.count !== 1 ? 's' : ''} available)
              </div>
            </div>
          );
        } else {
          return (
            <ProductCard
              key={item.product.id}
              product={item.product}
              selected={isSelected(item.product.id)}
              active={i === activeIndex}
              onToggle={onToggle}
              imageMap={imageMap}
              isVariant={true}
            />
          );
        }
      })}
    </div>
  );
}
