import type { Product, RenderItem } from '../types';
import { ProductCard } from './ProductCard';
import { FamilyListCard } from './FamilyListCard';
import { useIsMobile } from '../hooks/useIsMobile';

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
  const isMobile = useIsMobile();

  if (items.length === 0) {
    return <div className="empty">No matching products.</div>;
  }
  return (
    <div className="results">
      {items.map((item, i) => {
        if (item.type === 'group') {
          const isExpanded = expandedGroups.has(item.familyId);

          // On mobile, the FamilyListCard opens a popup instead of expanding inline.
          // Therefore, if it's mobile, we do NOT want to render the children ProductCards inline
          // if isExpanded happened to be true. Actually, if isMobile, we just let FamilyListCard
          // handle the popup and we skip rendering the expanded children below.
          return (
            <FamilyListCard
              key={`group-${item.familyId}`}
              familyId={item.familyId}
              firstProduct={item.firstProduct}
              allProducts={item.allProducts}
              count={item.count}
              imageMap={imageMap}
              isExpanded={isExpanded}
              onToggleGroup={() => onToggleGroup(item.familyId)}
              isSelected={isSelected}
              onToggle={onToggle}
              active={i === activeIndex}
            />
          );
        } else {
          // If this is a variant card rendered under an expanded group
          // on mobile we should NOT render it, because mobile uses popups.
          if (isMobile) return null;
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
