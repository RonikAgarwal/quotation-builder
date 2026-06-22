import type { Product, RenderItem } from '../types';
import { FamilyGridCard } from './FamilyGridCard';
import './GridResultsList.css';

interface Props {
  items: RenderItem[];
  imageMap: Record<string, boolean>;
  isSelected: (id: string) => boolean;
  onToggle: (product: Product) => void;
}

export function GridResultsList({ items, imageMap, isSelected, onToggle }: Props) {
  // Filter only groups since grid view only cares about families
  const groupItems = items.filter(item => item.type === 'group');

  if (groupItems.length === 0) {
    return <div className="empty">No products found.</div>;
  }

  return (
    <div className="grid-results-list">
      {groupItems.map(item => {
        if (item.type !== 'group') return null;
        return (
          <FamilyGridCard
            key={item.familyId}
            familyId={item.familyId}
            firstProduct={item.firstProduct}
            allProducts={item.allProducts}
            imageMap={imageMap}
            isSelected={isSelected}
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
}
