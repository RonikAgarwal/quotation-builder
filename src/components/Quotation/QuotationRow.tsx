import { ChangeEvent, KeyboardEvent } from 'react';
import type { QuotationItem } from '../../types';

interface Props {
  item: QuotationItem;
  index: number;
  onChange: (id: string, updates: Partial<QuotationItem>) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}

export function QuotationRow({ item, index, onChange, onDuplicate, onRemove }: Props) {
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
      onChange(item.id, { discountPercent: '', discountedPrice: item.mrp });
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

    // Source of truth: Discounted Price. Compute new discount %.
    let newDiscPct = item.discountPercent;
    if (typeof item.mrp === 'number' && item.mrp > 0) {
      newDiscPct = round2(((item.mrp - val) / item.mrp) * 100);
    }
    onChange(item.id, { discountedPrice: val, discountPercent: newDiscPct });
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

  // Calculate Line Total
  let lineTotal = 0;
  if (typeof item.discountedPrice === 'number' && typeof item.quantity === 'number') {
    lineTotal = Math.round(item.discountedPrice * item.quantity);
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newFamilyId = item.familyId || `custom_blank_${item.id}`;
      
      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'x-family-id': newFamilyId },
          body: file
        });
        if (response.ok) {
           onChange(item.id, { familyId: newFamilyId });
           // Small hack to force image reload by clearing and resetting
           setTimeout(() => {
             const img = document.getElementById(`img-${newFamilyId}`) as HTMLImageElement;
             if (img) img.src = `/product-images/${newFamilyId}.jpg?t=${Date.now()}`;
           }, 100);
        }
      } catch (err) {
        alert('Failed to upload image');
      }
    }
  };

  return (
    <div className="q-row">
      <div className="q-col q-col--index">{index + 1}</div>

      <div className="q-col q-col--product">
        <div className="q-product-cell">
          <div className="q-product-thumb" style={{ position: 'relative', overflow: 'hidden' }}>
            {item.familyId ? (
              <img 
                id={`img-${item.familyId}`}
                src={`/product-images/${item.familyId}.jpg`} 
                alt=""
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--muted)', cursor: 'pointer', textAlign: 'center', lineHeight: 1.2 }}>
                + Img
              </div>
            )}
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp"
              onChange={handleImageUpload}
              title="Click to upload/change image"
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
          </div>
          <div className="q-product-inputs">
            <input
              type="text"
              value={item.name}
              onChange={(e) => onChange(item.id, { name: e.target.value })}
              className="q-input-title"
              placeholder="Product Name"
            />
            <input
              type="text"
              value={item.subtitle}
              onChange={(e) => onChange(item.id, { subtitle: e.target.value })}
              className="q-input-sub"
              placeholder="Subtitle"
            />
          </div>
        </div>
      </div>

      <div className="q-col q-col--num">
        <input
          type="number"
          className="q-input q-input--num"
          value={item.mrp}
          onChange={handleMrpChange}
          onKeyDown={blockInvalidChars}
          min="0"
          step="any"
        />
      </div>

      <div className="q-col q-col--num">
        <input
          type="number"
          className="q-input q-input--num"
          value={item.discountPercent}
          onChange={handleDiscountPercentChange}
          onKeyDown={blockInvalidChars}
          min="0"
          step="any"
        />
      </div>

      <div className="q-col q-col--num">
        <input
          type="number"
          className="q-input q-input--num"
          value={item.discountedPrice}
          onChange={handleDiscountedPriceChange}
          onKeyDown={blockInvalidChars}
          min="0"
          step="any"
        />
      </div>

      <div className="q-col q-col--num">
        <input
          type="number"
          className="q-input q-input--num"
          value={item.quantity}
          onChange={handleQuantityChange}
          onKeyDown={blockInvalidChars}
          min="0"
          step="any"
        />
      </div>

      <div className="q-col q-col--total">
        {lineTotal.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
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
