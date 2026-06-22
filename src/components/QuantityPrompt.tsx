import React, { useState, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Product } from '../types';
import './QuantityPrompt.css';

interface Props {
  product: Product;
  onConfirm: (product: Product, quantity: number) => void;
  onCancel: () => void;
}

export const QuantityPrompt: React.FC<Props> = ({ product, onConfirm, onCancel }) => {
  const [quantity, setQuantity] = useState('1');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const confirm = () => {
    const parsed = parseInt(quantity, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onConfirm(product, parsed);
    } else {
      onConfirm(product, 1); // fallback to 1 if empty or invalid
    }
  };

  return (
    <div className="qty-prompt-backdrop" onClick={onCancel}>
      <div className="qty-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Enter Quantity</h3>
        <p className="qty-prompt-name">{product.displayTitle}</p>
        {product.displaySubtitle && <p className="qty-prompt-sub">{product.displaySubtitle}</p>}
        
        <div className="qty-prompt-input-group">
          <div className="qty-prompt-qty-block">
            <button 
              className="qty-prompt-qty-btn"
              onClick={() => {
                const current = parseInt(quantity, 10) || 0;
                if (current > 1) setQuantity((current - 1).toString());
              }}
            >
              <Minus size={18} />
            </button>
            <input
              ref={inputRef}
              type="number"
              min="1"
              className="qty-prompt-qty-input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              className="qty-prompt-qty-btn"
              onClick={() => {
                const current = parseInt(quantity, 10) || 0;
                setQuantity((current + 1).toString());
              }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="qty-prompt-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm" onClick={confirm}>Add Product</button>
        </div>
      </div>
    </div>
  );
};
