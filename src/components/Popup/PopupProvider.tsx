import React, { createContext, useContext, useState, ReactNode } from 'react';
import './Popup.css';

interface PopupOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  onConfirm?: () => void;
  isConfirm?: boolean;
}

interface PopupContextType {
  showAlert: (message: string, type?: 'info' | 'success' | 'error', title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
}

export function PopupProvider({ children }: { children: ReactNode }) {
  const [popup, setPopup] = useState<PopupOptions | null>(null);

  const showAlert = (message: string, type: 'info' | 'success' | 'error' = 'info', title?: string) => {
    setPopup({ message, type, title, isConfirm: false });
  };

  const showConfirm = (message: string, onConfirm: () => void, title: string = 'Confirm') => {
    setPopup({ message, onConfirm, title, isConfirm: true, type: 'info' });
  };

  const closePopup = () => setPopup(null);

  const handleConfirm = () => {
    if (popup?.onConfirm) {
      popup.onConfirm();
    }
    closePopup();
  };

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {popup && (
        <div className="custom-popup-overlay">
          <div className="custom-popup-modal">
            {popup.title && <h3 className="custom-popup-title">{popup.title}</h3>}
            <p className="custom-popup-message">{popup.message}</p>
            <div className="custom-popup-actions">
              {popup.isConfirm ? (
                <>
                  <button className="custom-popup-btn cancel-btn" onClick={closePopup}>Cancel</button>
                  <button className="custom-popup-btn confirm-btn" onClick={handleConfirm}>OK</button>
                </>
              ) : (
                <button className="custom-popup-btn confirm-btn" onClick={closePopup}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
}
