import { useState } from 'react';
import type { QuotationState, QuotationItem } from '../../types';
import { QuotationRow } from './QuotationRow';
import { useCloudHistory } from '../../hooks/useCloudHistory';
import { usePopup } from '../Popup/PopupProvider';
import { generatePDF } from '../../utils/pdf';
import './Quotation.css';

interface Props {
  state: QuotationState;
  updateHeader: (updates: Partial<Pick<QuotationState, 'partyName' | 'date'>>) => void;
  updateRow: (id: string, updates: Partial<QuotationItem>) => void;
  duplicateRow: (id: string) => void;
  removeRow: (id: string) => void;
  addBlankRow: () => void;
  applyGlobalDiscount: (pct: number) => void;
  clearQuotation: () => void;
  onBackToSearch: () => void;
  reorderRows: (fromIndex: number, toIndex: number) => void;
}

export function QuotationEditor({
  state,
  updateHeader,
  updateRow,
  duplicateRow,
  removeRow,
  addBlankRow,
  applyGlobalDiscount,
  clearQuotation,
  onBackToSearch,
  reorderRows,
}: Props) {
  const [globalDisc, setGlobalDisc] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [dragEnabled, setDragEnabled] = useState(false);
  const { saveToHistory } = useCloudHistory();
  const { showConfirm } = usePopup();

  // Summaries
  let totalMrp = 0;
  let totalDiscounted = 0;

  for (const item of state.items) {
    const qty = typeof item.quantity === 'number' ? item.quantity : 0;
    const mrp = typeof item.mrp === 'number' ? item.mrp : 0;
    const discPrice = typeof item.discountedPrice === 'number' ? item.discountedPrice : 0;

    totalMrp += mrp * qty;
    totalDiscounted += Math.round(discPrice * qty);
  }

  const totalSavings = totalMrp - totalDiscounted;
  const grandTotal = totalDiscounted;

  const formatCurrency = (val: number) =>
    '₹' +
    val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleApplyGlobal = () => {
    const pct = parseFloat(globalDisc);
    if (!isNaN(pct) && pct >= 0) {
      applyGlobalDiscount(pct);
    }
  };

  const handleGeneratePdf = () => {
    generatePDF(state, grandTotal);
  };

  const handleSaveCloud = () => {
    saveToHistory(state, grandTotal);
  };

  return (
    <div className="quotation-screen">
      <header className="q-topbar">
        <button className="q-btn-back" onClick={onBackToSearch}>
          ← Back to Search
        </button>
        <div className="q-topbar-brand">
          <img src="/logo.png" alt="Logo" className="brand-logo-small" />
          <h2>Quotation Editor</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="q-btn-save-cloud" onClick={handleSaveCloud} style={{ background: 'white', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
            ☁ Save to Cloud
          </button>
          <button className="q-btn-pdf" onClick={handleGeneratePdf}>
            Download PDF
          </button>
        </div>
      </header>

      <div className="q-headercard">
        <div className="q-field">
          <label>Party Name</label>
          <input
            type="text"
            value={state.partyName}
            onChange={(e) => updateHeader({ partyName: e.target.value })}
            placeholder="Enter Party Name..."
          />
        </div>
        <div className="q-field">
          <label>Date</label>
          <input
            type="date"
            value={state.date}
            onChange={(e) => updateHeader({ date: e.target.value })}
          />
        </div>
        <div className="q-field q-field--global-disc">
          <label>Global Discount (%)</label>
          <div className="q-global-disc-wrap">
            <input
              type="number"
              min="0"
              step="any"
              value={globalDisc}
              onChange={(e) => setGlobalDisc(e.target.value)}
              placeholder="e.g. 10"
            />
            <button onClick={handleApplyGlobal}>Apply to All</button>
          </div>
        </div>
      </div>

      <div className="q-table-wrap">
        <div className="q-table-header">
          <div className="q-col q-col--index">#</div>
          <div className="q-col q-col--product">Product & Description</div>
          <div className="q-col q-col--num">MRP</div>
          <div className="q-col q-col--num">Disc %</div>
          <div className="q-col q-col--num">Price</div>
          <div className="q-col q-col--num">Qty</div>
          <div className="q-col q-col--total">Total</div>
          <div className="q-col q-col--actions"></div>
        </div>

        <div className="q-table-body">
          {state.items.length === 0 ? (
            <div className="q-empty">
              No products added to quotation.
            </div>
          ) : (
            state.items.map((item, index) => {
              return (
                <QuotationRow
                  key={item.id}
                  item={item}
                  index={index}
                  onChange={updateRow}
                  onDuplicate={duplicateRow}
                  onRemove={removeRow}
                  draggable={dragEnabled}
                  isDragTarget={dragTargetIndex === index}
                  onDragStart={(e) => {
                    setDraggedIndex(index);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (draggedIndex !== null && draggedIndex !== index) {
                      setDragTargetIndex(index);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIndex !== null && draggedIndex !== index) {
                      reorderRows(draggedIndex, index);
                    }
                    setDraggedIndex(null);
                    setDragTargetIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragTargetIndex(null);
                  }}
                  setDraggable={setDragEnabled}
                />
              );
            })
          )}
        </div>

        <div className="q-table-footer-actions">
          <button className="q-btn-blank" onClick={addBlankRow}>
            + Add Blank Row
          </button>
          <button 
            className="q-btn-clear" 
            onClick={() => {
              showConfirm('Are you sure you want to clear all items from this quotation?', () => {
                clearQuotation();
              }, 'Clear Quotation');
            }}
          >
            Clear All Items
          </button>
        </div>
      </div>

      <div className="q-summary">
        <div className="q-summary-row">
          <span>Total MRP Value</span>
          <span>{formatCurrency(totalMrp)}</span>
        </div>
        <div className="q-summary-row q-summary-row--savings">
          <span>Total Savings</span>
          <span>{formatCurrency(totalSavings)}</span>
        </div>
        <div className="q-summary-row">
          <span>Total Discounted Value</span>
          <span>{formatCurrency(totalDiscounted)}</span>
        </div>
        <div className="q-summary-row q-summary-row--grand">
          <span>Grand Total</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
