import { ChangeEvent, KeyboardEvent } from 'react';
import type { QuotationItem } from '../../types';

interface Props {
  item: QuotationItem;
  index: number;
  onChange: (id: string, updates: Partial<QuotationItem>) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  setDraggable?: (val: boolean) => void;
  isDragTarget?: boolean;
  onImageClick?: (id: string, name: string) => void;
}

export function QuotationRow({
  item,
  index,
  onChange,
  onDuplicate,
  onRemove,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  setDraggable,
  isDragTarget,
  onImageClick,
}: Props) {
  // Helpers for bidirectional math. We round to 2 decimals to avoid float weirdness.
  const round2 = (num: number) => Math.round(num * 100) / 100;

  const handleMrpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(item.id, { mrp: '' });
      return;
    }
    const val = parseFloat(raw);
    if (isNaN(val)) return;

    // If MRP changes, maintain current discount % and compute new discountedPrice.
    let newPrice = item.discountedPrice;
    if (typeof item.discountPercent === 'number') {
      newPrice = round2(val - val * (item.discountPercent / 100));
    }
    onChange(item.id, { mrp: val, discountedPrice: newPrice });
  };

  const handleDiscountPercentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(item.id, { discountPercent: '' });
      return;
    }
    const val = parseFloat(raw);
    if (isNaN(val)) return;

    // Source of truth: Discount %. Compute new discountedPrice.
    let newPrice = item.discountedPrice;
    if (typeof item.mrp === 'number') {
      newPrice = round2(item.mrp - item.mrp * (val / 100));
    }
    onChange(item.id, { discountPercent: val, discountedPrice: newPrice });
  };

  const handleDiscountedPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(item.id, { discountedPrice: '', discountPercent: '' });
      return;
    }
    const val = parseFloat(raw);
    if (isNaN(val)) return;

    const isCustom = !item.familyId;
    let newDiscPct = item.discountPercent;
    let newMrp = item.mrp;
    
    if (isCustom) {
      const pct = typeof item.discountPercent === 'number' ? item.discountPercent : 0;
      if (pct < 100) {
        newMrp = round2(val / (1 - pct / 100));
      } else {
        newMrp = val;
      }
    } else {
      if (typeof item.mrp === 'number' && item.mrp > 0) {
        newDiscPct = round2(((item.mrp - val) / item.mrp) * 100);
      } else {
        newMrp = val;
        newDiscPct = 0;
      }
    }
    onChange(item.id, { discountedPrice: val, discountPercent: newDiscPct, mrp: newMrp });
  };

  const handleQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(item.id, { quantity: '' });
      return;
    }
    const val = parseFloat(raw);
    if (!isNaN(val)) {
      onChange(item.id, { quantity: val });
    }
  };

  // Prevent characters like 'e' or '+' in number inputs to keep UI clean
  const blockInvalidChars = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };

  const handleTotalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(item.id, { discountedPrice: '', discountPercent: '' });
      return;
    }
    const val = parseFloat(raw);
    if (isNaN(val)) return;

    const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
    const newDiscountedPrice = round2(val / qty);

    const isCustom = !item.familyId;
    let newDiscPct = item.discountPercent;
    let newMrp = item.mrp;
    
    if (isCustom) {
      const pct = typeof item.discountPercent === 'number' ? item.discountPercent : 0;
      if (pct < 100) {
        newMrp = round2(newDiscountedPrice / (1 - pct / 100));
      } else {
        newMrp = newDiscountedPrice;
      }
    } else {
      if (typeof item.mrp === 'number' && item.mrp > 0) {
        newDiscPct = round2(((item.mrp - newDiscountedPrice) / item.mrp) * 100);
      } else {
        newMrp = newDiscountedPrice;
        newDiscPct = 0;
      }
    }
    onChange(item.id, { discountedPrice: newDiscountedPrice, discountPercent: newDiscPct, mrp: newMrp });
  };

  // Calculate Line Total
  let lineTotal = 0;
  if (typeof item.discountedPrice === 'number' && typeof item.quantity === 'number') {
    lineTotal = Math.round(item.discountedPrice * item.quantity);
  }

  return (
    <div 
      className={`q-row ${isDragTarget ? 'q-row--drag-target' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        borderTop: isDragTarget ? '2px solid var(--accent)' : undefined
      }}
    >
      <div className="q-col q-col--index">{index + 1}</div>

      <div className="q-col q-col--product">
        <div className="q-product-cell">
          <div 
            className="q-product-thumb" 
            style={{ position: 'relative', overflow: 'hidden', cursor: 'grab' }}
            onMouseEnter={() => setDraggable && setDraggable(true)}
            onMouseLeave={() => setDraggable && setDraggable(false)}
            onTouchStart={() => setDraggable && setDraggable(true)}
            onTouchEnd={() => setDraggable && setDraggable(false)}
            onClick={() => onImageClick?.(item.id, item.name)}
            title="Click to change image, hold to drag"
          >
            {item.customImageBase64 ? (
              <img 
                src={item.customImageBase64} 
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : item.familyId ? (
              <img 
                id={`img-${item.familyId}`}
                src={`/product-images/${item.familyId}.webp`} 
                alt=""
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--muted)', cursor: 'pointer', textAlign: 'center', lineHeight: 1.2 }}>
                + Img
              </div>
            )}
          </div>
          <div className="q-product-inputs">
            <input
              type="text"
              value={item.name}
              onChange={(e) => onChange(item.id, { name: e.target.value })}
              className="q-input-title"
              placeholder="Product Name"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={item.subtitle}
                onChange={(e) => onChange(item.id, { subtitle: e.target.value })}
                className="q-input-sub"
                placeholder="Subtitle"
                style={{ flex: 1 }}
              />
              {item.sourcePage !== undefined && item.sourcePage > 0 ? (
                <a href={`#/pdf/${item.sourcePage}`} className="page-link" onClick={e => e.stopPropagation()}>
                  📄 {item.sourcePage}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="q-row-numbers">
        <div className="q-col q-col--num" data-label="MRP (₹)">
          <input
            type="text"
            inputMode="decimal"
            className="q-input q-input--num"
            value={item.mrp}
            onChange={handleMrpChange}
            onKeyDown={blockInvalidChars}
          />
        </div>

        <div className="q-col q-col--num" data-label="Discount %">
          <input
            type="text"
            inputMode="decimal"
            className="q-input q-input--num"
            value={item.discountPercent}
            onChange={handleDiscountPercentChange}
            onKeyDown={blockInvalidChars}
          />
        </div>

        <div className="q-col q-col--num" data-label="Price (₹)">
          <input
            type="text"
            inputMode="decimal"
            className="q-input q-input--num"
            value={item.discountedPrice}
            onChange={handleDiscountedPriceChange}
            onKeyDown={blockInvalidChars}
          />
        </div>

        <div className="q-col q-col--num" data-label="Quantity">
          <input
            type="text"
            inputMode="decimal"
            className="q-input q-input--num"
            value={item.quantity}
            onChange={handleQuantityChange}
            onKeyDown={blockInvalidChars}
          />
        </div>
      </div>

      <div className="q-col q-col--total">
        <input
          type="text"
          inputMode="decimal"
          className="q-input q-input--num"
          style={{ fontWeight: 600, color: 'var(--accent)' }}
          value={lineTotal === 0 && item.discountedPrice === '' ? '' : lineTotal}
          onChange={handleTotalChange}
          onKeyDown={blockInvalidChars}
        />
      </div>

      <div className="q-col q-col--actions">
        <button
          className="q-btn-icon"
          title="Duplicate Row"
          onClick={() => onDuplicate(item.id)}
        >
          ⧉
        </button>
        <button
          className="q-btn-icon q-btn-icon--danger"
          title="Remove Row"
          onClick={() => onRemove(item.id)}
        >
          ×
        </button>
      </div>
    </div>
  );
}
