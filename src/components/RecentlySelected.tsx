import type { Product } from '../types';
import { ProductCard } from './ProductCard';

interface Props {
  products: Product[];
  isSelected: (id: string) => boolean;
  onToggle: (product: Product) => void;
  imageMap: Record<string, boolean>;
}

// Shown only in the empty-query state. Reuses ProductCard so behavior and
// formatting match search results exactly.
export function RecentlySelected({ products, isSelected, onToggle, imageMap }: Props) {
  if (products.length === 0) {
    return (
      <div className="empty">
        Start typing to search products. Recently selected items will appear here.
      </div>
    );
  }
  return (
    <div>
      <div className="section-label">Recently Selected</div>
      <div className="results">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            selected={isSelected(p.id)}
            active={false}
            onToggle={onToggle}
            imageMap={imageMap}
          />
        ))}
      </div>
    </div>
  );
}
