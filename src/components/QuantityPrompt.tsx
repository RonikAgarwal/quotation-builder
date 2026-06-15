import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    // Focus and select the input on mount
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

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
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="qty-prompt-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm" onClick={confirm}>Add Product</button>
        </div>
      </div>
    </div>
  );
};
