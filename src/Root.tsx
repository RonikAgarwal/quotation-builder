import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './components/Home/Home';
import { QuotationBuilder as DesktopBuilder } from './QuotationBuilder';
import { MobileApp as MobileBuilder } from './components/Mobile/MobileApp';

export function Root() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={isMobile ? <MobileBuilder /> : <DesktopBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}
