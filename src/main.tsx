import React from 'react';
import ReactDOM from 'react-dom/client';
import { Root } from './Root';
import { PopupProvider } from './components/Popup/PopupProvider';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PopupProvider>
      <Root />
    </PopupProvider>
  </React.StrictMode>,
);
