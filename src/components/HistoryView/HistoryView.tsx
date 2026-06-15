import { useCloudHistory, CloudQuotation } from '../../hooks/useCloudHistory';
import { generatePDF } from '../../utils/pdf';
import './HistoryView.css';

interface Props {
  onEdit: (state: CloudQuotation['state']) => void;
  onBack: () => void;
}

export function HistoryView({ onEdit, onBack }: Props) {
  const { history, loading, deleteHistory, refresh } = useCloudHistory();

  const handleDownload = async (entry: CloudQuotation) => {
    try {
      await generatePDF(entry.state, entry.totalAmount);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF.");
    }
  };

  return (
    <div className="history-view">
      <header className="history-header">
        <div className="history-header__left">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2>Quotation History</h2>
        </div>
        <button className="refresh-btn" onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {loading && history.length === 0 ? (
        <div className="history-state">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="history-state empty">
          <p>No previous quotations found in the cloud.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map(entry => {
            const dateStr = new Date(entry.createdAt).toLocaleString();
            return (
              <div key={entry.id} className="history-card">
                <div className="history-card__info">
                  <h3>{entry.partyName || 'Untitled Quotation'}</h3>
                  <div className="history-card__meta">
                    <span><strong>Date:</strong> {dateStr}</span>
                    <span><strong>Items:</strong> {entry.totalProducts}</span>
                    <span className="amount"><strong>Total:</strong> ₹{entry.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="history-card__actions">
                  <button className="action-btn" onClick={() => handleDownload(entry)}>
                    ⬇ Download
                  </button>
                  <button className="action-btn edit-btn" onClick={() => onEdit(entry.state)}>
                    ✎ Edit
                  </button>
                  <button className="action-btn delete-btn" onClick={() => deleteHistory(entry.id)}>
                    ✕ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
