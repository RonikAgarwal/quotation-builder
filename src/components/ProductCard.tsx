import { memo } from 'react';
import type { Product } from '../types';

interface Props {
  product: Product;
  selected: boolean;
  active: boolean; // keyboard-highlighted row
  onToggle: (product: Product) => void;
  imageMap: Record<string, boolean>;
  isVariant?: boolean;
}

// One card per variant. Renders only precomputed display metadata so no
// formatting logic is duplicated here.
export const ProductCard = memo(function ProductCard({ product, selected, active, onToggle, imageMap, isVariant }: Props) {
  const hasImage = imageMap[product.familyId];

  let classNames = 'card';
  if (active) classNames += ' card--active';
  if (selected) classNames += ' card--selected';
  if (isVariant) classNames += ' card--variant';

  return (
    <div
      className={classNames}
      onClick={() => onToggle(product)}
      data-id={product.id}
    >
      <input
        type="checkbox"
        className="card__check"
        checked={selected}
        readOnly
        tabIndex={-1}
        aria-label={`Select ${product.displayTitle}`}
      />
      <div className="card__thumbnail">
        {hasImage ? (
          <img src={`/product-images/${product.familyId}.jpg`} alt="" />
        ) : (
          <div className="card__thumbnail-placeholder" />
        )}
      </div>
      <div className="card__body">
        <div className="card__title">{product.displayTitle}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          {product.displaySubtitle && (
            <div className="card__subtitle" style={{ margin: 0 }}>{product.displaySubtitle}</div>
          )}
          {product.sourcePage > 0 && (
            <a href={`#/pdf/${product.sourcePage}`} className="page-link" onClick={e => e.stopPropagation()}>
              📄 {product.sourcePage}
            </a>
          )}
        </div>
      </div>
      <div className="card__price">{product.displayPrice}</div>
    </div>
  );
});
