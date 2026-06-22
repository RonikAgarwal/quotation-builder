import { ChangeEvent, KeyboardEvent } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { QuotationItem } from '../../types';

interface Props {
  item: QuotationItem;
  onChange: (id: string, updates: Partial<QuotationItem>) => void;
  onRemove: (id: string) => void;
  onImageClick?: (id: string, name: string) => void;
}

export function MobileQuotationRow({ item, onChange, onRemove, onImageClick }: Props) {
  const round2 = (num: number) => Math.round(num * 100) / 100;

  const handleMrpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(item.id, { mrp: '' });
      return;
    }
    const val = parseFloat(raw);
    if (isNaN(val)) return;

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

  const updateQuantity = (delta: number) => {
    const current = typeof item.quantity === 'number' ? item.quantity : 0;
    const next = Math.max(1, current + delta);
    onChange(item.id, { quantity: next });
  };

  const blockInvalidChars = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };

  let lineTotal = 0;
  if (typeof item.discountedPrice === 'number' && typeof item.quantity === 'number') {
    lineTotal = Math.round(item.discountedPrice * item.quantity);
  }

  const formatCurrency = (val: number) =>
    '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mq-row">
      <div className="mq-row-top">
        <div 
          className="mq-row-thumb"
          onClick={() => onImageClick?.(item.id, item.name)}
        >
          {item.customImageBase64 ? (
            <img src={item.customImageBase64} alt="" />
          ) : item.familyId ? (
            <img 
              src={`/product-images/${item.familyId}.webp`} 
              alt=""
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>+ Img</span>
          )}
        </div>
        
        <div className="mq-row-info">
          <div className="mq-row-header">
            <div className="mq-row-title">{item.name}</div>
            <button className="mq-btn-delete" onClick={() => onRemove(item.id)}>
              <Trash2 size={14} />
            </button>
          </div>
          <div className="mq-row-sub">{item.subtitle}</div>
          
          {/* Editable Quantity Pill Block */}
          <div className="mq-qty-block">
            <button className="mq-qty-btn" onClick={() => updateQuantity(-1)}><Minus size={14}/></button>
            <input 
              type="text" 
              inputMode="decimal"
              className="mq-qty-input"
              value={item.quantity}
              onChange={handleQuantityChange}
              onKeyDown={blockInvalidChars}
            />
            <button className="mq-qty-btn" onClick={() => updateQuantity(1)}><Plus size={14}/></button>
          </div>
        </div>
      </div>

      <div className="mq-row-inputs">
        <div className="mq-field">
          <label>MRP (₹)</label>
          <input
            type="text"
            inputMode="decimal"
            className="mq-input"
            value={item.mrp}
            onChange={handleMrpChange}
            onKeyDown={blockInvalidChars}
          />
        </div>
        <div className="mq-field">
          <label>Discount (%)</label>
          <input
            type="text"
            inputMode="decimal"
            className="mq-input"
            value={item.discountPercent}
            onChange={handleDiscountPercentChange}
            onKeyDown={blockInvalidChars}
          />
        </div>
        <div className="mq-field">
          <label>Price (₹)</label>
          <input
            type="text"
            inputMode="decimal"
            className="mq-input"
            value={item.discountedPrice}
            onChange={handleDiscountedPriceChange}
            onKeyDown={blockInvalidChars}
          />
        </div>
      </div>

      <div className="mq-row-total">
        <span>Total</span>
        <strong>{formatCurrency(lineTotal)}</strong>
      </div>
    </div>
  );
}
