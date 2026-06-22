import { useState } from 'react';
import { ArrowLeft, Cloud, Send, FileText, PlusCircle, FileSpreadsheet } from 'lucide-react';
import type { QuotationState, QuotationItem, Product } from '../../types';
import { MobileQuotationRow } from './MobileQuotationRow';
import { CustomProductForm } from '../CustomProductForm';
import { ImagePickerModal } from '../ImagePickerModal/ImagePickerModal';
import { useCloudHistory } from '../../hooks/useCloudHistory';
import { usePopup } from '../Popup/PopupProvider';
import { useAuth } from '../../hooks/useAuth';
import { generatePDF } from '../../utils/pdf';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import './MobileQuotation.css';

interface Props {
  state: QuotationState;
  updateHeader: (updates: Partial<Pick<QuotationState, 'partyName' | 'date'>>) => void;
  updateRow: (id: string, updates: Partial<QuotationItem>) => void;
  removeRow: (id: string) => void;
  applyGlobalDiscount: (pct: number) => void;
  onBackToSearch: () => void;
  onAddCustomProduct: (product: Product) => void;
  onImageUploaded: (familyId: string) => void;
}

export function MobileQuotationEditor({
  state,
  updateHeader,
  updateRow,
  removeRow,
  applyGlobalDiscount,
  onBackToSearch,
  onAddCustomProduct,
  onImageUploaded,
}: Props) {
  const [globalDisc, setGlobalDisc] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [activeImagePicker, setActiveImagePicker] = useState<{ id: string; name: string } | null>(null);
  
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('9864548325');
  const [isSendingLink, setIsSendingLink] = useState(false);
  
  const { saveToHistory } = useCloudHistory();
  const { showAlert } = usePopup();
  const { user } = useAuth();

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
    '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    <div className="mq-screen">
      {/* Header */}
      <header className="mq-header">
        <button className="mq-btn-back" onClick={onBackToSearch}>
          <ArrowLeft size={18} /> Back to Search
        </button>
        <div className="mq-brand">
          <img src="/logo.webp" alt="SGH Logo" />
          <div className="mq-brand-text">
            <h2>Quotation Editor</h2>
            <span>Create & share your quotation</span>
          </div>
        </div>
      </header>

      {/* Action Buttons */}
      <div className="mq-actions">
        <button className="mq-btn-action blue" onClick={handleSaveCloud}>
          <Cloud size={16} /> Save
        </button>
        <button className="mq-btn-action green" onClick={() => {
          if (!user) {
            showAlert("You must be logged in to generate a sharing link.", "error", "Sign In Required");
          } else {
            setShowWhatsappModal(true);
          }
        }}>
          <Send size={16} /> Send Link
        </button>
        <button className="mq-btn-action blue" onClick={handleGeneratePdf}>
          <FileText size={16} /> Download
        </button>
      </div>

      {/* Quotation Details */}
      <div className="mq-card">
        <div className="mq-card-header">
          <div className="mq-card-title">
            <FileSpreadsheet size={18} /> Quotation Details
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
          <div className="mq-field" style={{ marginBottom: 0 }}>
            <label>Party Name</label>
            <input 
              type="text" 
              className="mq-input" 
              placeholder="Enter Party Name"
              value={state.partyName}
              onChange={(e) => updateHeader({ partyName: e.target.value })}
            />
          </div>
          <div className="mq-field" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input 
              type="date" 
              className="mq-input"
              value={state.date}
              onChange={(e) => updateHeader({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="mq-field" style={{ marginTop: '12px' }}>
          <label>Global Discount (%)</label>
          <div className="mq-global-disc-row">
            <input 
              type="number" 
              className="mq-input" 
              placeholder="e.g. 10"
              value={globalDisc}
              onChange={(e) => setGlobalDisc(e.target.value)}
            />
            <button className="mq-btn-apply" onClick={handleApplyGlobal}>Apply to All</button>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mq-card">
        <div className="mq-card-header">
          <div className="mq-card-title" style={{ fontSize: '16px' }}>
            Items ({state.items.length})
          </div>
          <button className="mq-btn-text-blue" onClick={() => setIsAddingCustom(true)}>
            <PlusCircle size={14} /> Add Custom Product
          </button>
        </div>

        <div className="mq-items-list">
          {state.items.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
              No products added to quotation.
            </div>
          ) : (
            state.items.map((item) => (
              <MobileQuotationRow
                key={item.id}
                item={item}
                onChange={updateRow}
                onRemove={removeRow}
                onImageClick={(id, name) => setActiveImagePicker({ id, name })}
              />
            ))
          )}
        </div>

        <button className="mq-btn-add-another" onClick={onBackToSearch}>
          <PlusCircle size={16} /> Add Another Item
        </button>
      </div>

      {/* Summary */}
      <div className="mq-card">
        <div className="mq-card-header">
          <div className="mq-card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Price Summary
          </div>
        </div>
        
        <div className="mq-summary-row">
          <span>Total MRP Value</span>
          <span>{formatCurrency(totalMrp)}</span>
        </div>
        <div className="mq-summary-row savings">
          <span>Total Savings</span>
          <span>{formatCurrency(totalSavings)}</span>
        </div>
        <div className="mq-summary-row">
          <span>Total Discounted Value</span>
          <span>{formatCurrency(totalDiscounted)}</span>
        </div>
        <div className="mq-summary-row grand">
          <span>Grand Total</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      {/* Modals */}
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
          <div style={{ background: 'white', borderRadius: '12px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
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
          <div style={{ background: 'white', borderRadius: '12px', width: '90%', maxWidth: '360px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--text)' }}>Send Link</h3>
            <div className="mq-field">
              <label>WhatsApp Number</label>
              <input 
                type="text" 
                className="mq-input"
                value={whatsappPhone} 
                onChange={e => setWhatsappPhone(e.target.value)}
                placeholder="e.g. 9864548325"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendWhatsappLink();
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowWhatsappModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendWhatsappLink}
                disabled={isSendingLink}
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSendingLink ? 0.7 : 1 }}
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
