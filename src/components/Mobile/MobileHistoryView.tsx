import { useCloudHistory, CloudQuotation } from '../../hooks/useCloudHistory';
import { generatePDF } from '../../utils/pdf';

export function MobileHistoryView() {
  const { history, loading } = useCloudHistory();

  const handleDownloadPdf = (q: CloudQuotation) => {
    // Generates and downloads the PDF directly
    generatePDF(q.state, q.totalAmount);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <span style={{ color: '#64748b' }}>Loading quotations...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>No Quotations Found</h3>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
          You haven't saved any quotations to the cloud yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {history.map((q) => {
        const dateObj = new Date(q.createdAt);
        const dateStr = dateObj.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div key={q.id} className="mobile-card">
            <div className="mobile-card-header">
              <div>
                <h3 className="mobile-card-title">{q.partyName || 'Unnamed Party'}</h3>
                <div className="mobile-card-date">{dateStr}</div>
              </div>
              <div className="mobile-card-amount">
                ₹{q.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
            
            <div className="mobile-card-details">
              {q.totalProducts} item{q.totalProducts !== 1 ? 's' : ''}
            </div>

            <button 
              className="mobile-btn mobile-btn--outline"
              onClick={() => handleDownloadPdf(q)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              View PDF
            </button>
          </div>
        );
      })}
    </div>
  );
}
