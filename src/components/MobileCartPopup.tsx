import { X, Plus } from 'lucide-react';
import type { QuotationItem } from '../types';
import './MobileCartPopup.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: QuotationItem[];
  imageMap: Record<string, boolean>;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateMRP: (id: string, mrp: number) => void;
  onRemove: (id: string) => void;
  onAddCustomProduct: () => void;
  onCheckout: () => void;
}

export function MobileCartPopup({
  isOpen,
  onClose,
  items,
  imageMap,
  onUpdateQuantity,
  onUpdateMRP,
  onRemove,
  onAddCustomProduct,
  onCheckout
}: Props) {
  if (!isOpen) return null;

  return (
    <>
      <div className="mobile-cart-backdrop" onClick={onClose} />
      <div className="mobile-cart-popup">
        <div className="mobile-cart-popup__header">
          <h2>Selected Items ({items.length})</h2>
          <button onClick={onClose} className="mobile-cart-popup__close">
            <X size={24} />
          </button>
        </div>

        <div className="mobile-cart-popup__list">
          {items.length === 0 ? (
            <div className="mobile-cart-popup__empty">No products added yet.</div>
          ) : (
            items.map(item => (
              <div key={item.id} className="mobile-cart-item">
                <div className="mobile-cart-item__thumb">
                  {item.customImageBase64 ? (
                    <img src={item.customImageBase64} alt="" />
                  ) : imageMap[item.familyId] ? (
                    <img src={`/product-images/${item.familyId}.webp`} alt="" />
                  ) : (
                    <div className="mobile-cart-item__no-img">No Img</div>
                  )}
                </div>
                
                <div className="mobile-cart-item__body">
                  <div className="mobile-cart-item__name">
                    {item.name}
                    {item.subtitle && <span style={{display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 400}}>{item.subtitle}</span>}
                  </div>
                  
                  <div className="mobile-cart-item__inputs">
                    <div className="mobile-cart-input-group">
                      <label>Qty</label>
                      <input 
                        type="number" 
                        inputMode="numeric"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="mobile-cart-input-group">
                      <label>MRP (₹)</label>
                      <input 
                        type="number" 
                        inputMode="decimal"
                        value={item.mrp || ''}
                        onChange={(e) => onUpdateMRP(item.id, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  className="mobile-cart-item__remove" 
                  onClick={() => onRemove(item.id)}
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mobile-cart-popup__footer">
          <button className="mobile-cart-btn-secondary" onClick={onAddCustomProduct}>
            <Plus size={18} /> Add Custom Product
          </button>
          <button 
            className="mobile-cart-btn-primary" 
            onClick={onCheckout}
            disabled={items.length === 0}
          >
            Update Quotation
          </button>
        </div>
      </div>
    </>
  );
}
