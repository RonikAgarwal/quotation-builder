import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { generatePDFBlob } from '../utils/pdf';
import type { QuotationState } from '../types';

export function SharedQuotationView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let createdUrl: string | null = null;

    async function loadAndGenerate() {
      // Get ID from path, e.g. /share/abc123xyz
      const pathParts = window.location.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      
      if (!id) {
        setError('Invalid sharing link');
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'shared_quotations', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const state = data.state as QuotationState;
          const grandTotal = data.grandTotal as number;

          const blob = await generatePDFBlob(state, grandTotal);
          const safePartyName = state.partyName.trim() ? state.partyName.replace(/[^a-z0-9]/gi, '_') : 'Quotation';
          const filename = `${safePartyName}_${state.date}.pdf`;

          // Create blob URL for displaying
          const url = window.URL.createObjectURL(blob);
          createdUrl = url;
          setPdfUrl(url);

          // Prepare for native sharing / downloading
          const file = new File([blob], filename, { type: 'application/pdf' });
          setPdfFile(file);
          
          setLoading(false);
        } else {
          setError('Quotation not found or link has expired.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load shared quotation:', err);
        setError('Failed to load the quotation.');
        setLoading(false);
      }
    }

    loadAndGenerate();

    return () => {
      if (createdUrl) {
        window.URL.revokeObjectURL(createdUrl);
      }
    };
  }, []);

  const handleShare = async () => {
    if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: 'Quotation',
          text: 'Here is your Quotation from Shree Ganesh Hardware.',
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      alert('Your browser does not support native file sharing. The file has been downloaded instead.');
    }
  };

  const handleDownload = () => {
    if (pdfUrl && pdfFile) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = pdfUrl;
      a.download = pdfFile.name;
      document.body.appendChild(a);
      a.click();
    }
  };

  const canShare = pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] });

  if (loading || error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '24px', textAlign: 'center', background: 'var(--bg)' }}>
        {loading && (
          <div style={{ color: 'var(--text)' }}>
            <img src="/logo.webp" alt="Logo" style={{ width: '64px', marginBottom: '16px' }} />
            <h2>Generating your Quotation...</h2>
            <p style={{ color: 'var(--muted)' }}>Please wait while we prepare your PDF document.</p>
          </div>
        )}
        {error && (
          <div style={{ color: 'var(--text)' }}>
            <h2 style={{ color: '#ef4444' }}>Oops!</h2>
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#333' }}>
      <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'white', borderBottom: '1px solid #ddd', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={handleDownload}
          style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
          </svg>
          Download PDF
        </button>
        
        {canShare && (
          <button 
            onClick={handleShare}
            style={{ background: '#25D366', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z"/>
            </svg>
            Share PDF
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <iframe 
          src={pdfUrl + '#toolbar=0'} 
          style={{ width: '100%', height: '100%', border: 'none' }} 
          title="Quotation PDF"
        />
      </div>
    </div>
  );
}
