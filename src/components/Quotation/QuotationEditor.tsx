import { useState } from 'react';
import type { QuotationState, QuotationItem } from '../../types';
import { QuotationRow } from './QuotationRow';
import { useCloudHistory } from '../../hooks/useCloudHistory';
import { usePopup } from '../Popup/PopupProvider';
import { useAuth } from '../../hooks/useAuth';
import { generatePDF } from '../../utils/pdf';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ImagePickerModal } from '../ImagePickerModal/ImagePickerModal';
import { CustomProductForm } from '../CustomProductForm';
import type { Product } from '../../types';
import './Quotation.css';

interface Props {
  state: QuotationState;
  updateHeader: (updates: Partial<Pick<QuotationState, 'partyName' | 'date'>>) => void;
  updateRow: (id: string, updates: Partial<QuotationItem>) => void;
  duplicateRow: (id: string) => void;
  removeRow: (id: string) => void;
  applyGlobalDiscount: (pct: number) => void;
  clearQuotation: () => void;
  onBackToSearch: () => void;
  reorderRows: (fromIndex: number, toIndex: number) => void;
  onAddCustomProduct: (product: Product) => void;
  onImageUploaded: (familyId: string) => void;
}

export function QuotationEditor({
  state,
  updateHeader,
  updateRow,
  duplicateRow,
  removeRow,
  applyGlobalDiscount,
  clearQuotation,
  onBackToSearch,
  reorderRows,
  onAddCustomProduct,
  onImageUploaded,
}: Props) {
  const [globalDisc, setGlobalDisc] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [activeImagePicker, setActiveImagePicker] = useState<{ id: string; name: string } | null>(null);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('9864548325');
  const [isSendingLink, setIsSendingLink] = useState(false);
  const { saveToHistory } = useCloudHistory();
  const { showConfirm, showAlert } = usePopup();
  const { user } = useAuth();

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

  const handleSendWhatsappLink = async () => {
    if (!whatsappPhone) return;
    setIsSendingLink(true);
    try {
      const docRef = await addDoc(collection(db, 'shared_quotations'), {
        state: state,
        grandTotal: grandTotal,
        createdAt: Date.now()
      });
      
      const downloadUrl = `https://shreeganeshhardware.web.app/share/${docRef.id}`;
      const party = state.partyName || 'Customer';
      const text = `Click on the link to download the Quotation for ${party}.\n\n${downloadUrl}`;
      const encodedText = encodeURIComponent(text);
      
      window.open(`https://wa.me/91${whatsappPhone}?text=${encodedText}`, '_blank');
      setShowWhatsappModal(false);
    } catch (e) {
      console.error('Failed to send link', e);
      alert('Failed to generate sharing link. Please try again.');
    } finally {
      setIsSendingLink(false);
    }
  };

  return (
    <div className="quotation-screen">
      <header className="q-topbar">
        <button className="q-btn-back" onClick={onBackToSearch}>
          ← Back to Search
        </button>
        <div className="q-topbar-brand">
          <img src="/logo.webp" alt="Logo" className="brand-logo-small" />
          <h2>Quotation Editor</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="q-btn-save-cloud" onClick={handleSaveCloud} style={{ background: 'white', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
            ☁ Save to Cloud
          </button>
          <button className="q-btn-pdf" onClick={() => {
            if (!user) {
              showAlert("You must be logged in to generate a sharing link.", "error", "Sign In Required");
            } else {
              setShowWhatsappModal(true);
            }
          }} style={{ background: '#25D366', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c-.003 1.396.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c.003-3.625 2.952-6.57 6.577-6.57a6.59 6.59 0 0 1 4.646 1.932 6.59 6.59 0 0 1 1.928 4.643c-.004 3.625-2.95 6.57-6.575 6.57zm3.605-4.92c-.197-.099-1.17-.578-1.352-.643-.182-.065-.315-.099-.448.099-.133.197-.513.643-.627.775-.114.133-.23.149-.427.049-.197-.099-.836-.308-1.592-.985-.59-.525-.985-1.175-1.1-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.448-1.082-.613-1.482-.16-.385-.323-.333-.448-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.53.247c-.182.198-.695.678-.695 1.654s.712 1.916.81 2.049c.098.133 1.394 2.132 3.376 2.987.472.203.84.324 1.126.415.474.15 905.129 1.3.116 1.776-.013.476-.247 1.482-.87 1.632-1.413.15-.544.17-.803.065-1.102z"/>
            </svg>
            Send Link
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
                  onImageClick={(id, name) => setActiveImagePicker({ id, name })}
                />
              );
            })
          )}
        </div>

        <div className="q-table-footer-actions">
          <button className="q-btn-blank" onClick={() => setIsAddingCustom(true)}>
            + Add Custom Product
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

      <ImagePickerModal
        isOpen={!!activeImagePicker}
        onClose={() => setActiveImagePicker(null)}
        productName={activeImagePicker?.name || ''}
        onImageSelected={(base64) => {
          if (activeImagePicker) {
            updateRow(activeImagePicker.id, { customImageBase64: base64 });
          }
        }}
      />

      {isAddingCustom && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'var(--card)', borderRadius: '12px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <CustomProductForm
              onClose={() => setIsAddingCustom(false)}
              onSave={(prod) => {
                onAddCustomProduct(prod);
                setIsAddingCustom(false);
              }}
              onImageUploaded={onImageUploaded}
            />
          </div>
        </div>
      )}

      {showWhatsappModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'var(--card)', borderRadius: '12px', width: '90%', maxWidth: '360px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--text)' }}>Send via WhatsApp</h3>
            <div className="q-field">
              <label>WhatsApp Number</label>
              <input 
                type="text" 
                value={whatsappPhone} 
                onChange={e => setWhatsappPhone(e.target.value)}
                placeholder="e.g. 9864548325"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendWhatsappLink();
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowWhatsappModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendWhatsappLink}
                disabled={isSendingLink}
                style={{ background: '#25D366', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', opacity: isSendingLink ? 0.7 : 1 }}
              >
                {isSendingLink ? 'Generating...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
