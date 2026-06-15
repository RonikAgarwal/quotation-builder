import './MobileApp.css';
import { useAuth } from '../../hooks/useAuth';
import { MobileHistoryView } from './MobileHistoryView';

export function MobileApp() {
  const { user, login, logout, loading } = useAuth();

  if (loading) {
    return <div className="mobile-app" style={{ alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div className="mobile-app">
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Logo" className="mobile-header-logo" />
          <h1>Shree Ganesh Hardware</h1>
        </div>
        {user && (
          <button className="mobile-logout" onClick={logout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        )}
      </header>

      <main className="mobile-content">
        {!user ? (
          <div className="mobile-login-container">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
            <h2>Mobile Access</h2>
            <p>Please sign in to view and download your past quotations on this device.</p>
            <button className="mobile-btn mobile-btn--primary" onClick={login}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Sign In with Google
            </button>
          </div>
        ) : (
          <MobileHistoryView />
        )}
      </main>
    </div>
  );
}
