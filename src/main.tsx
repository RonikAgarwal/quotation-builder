import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { PopupProvider } from './components/Popup/PopupProvider';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PopupProvider>
      <App />
    </PopupProvider>
  </React.StrictMode>,
);
