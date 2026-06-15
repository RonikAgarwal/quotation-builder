import { useState, useEffect } from 'react';
import { App } from './App';
import { MobileApp } from './components/Mobile/MobileApp';

export function Root() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return <MobileApp />;
  }

  return <App />;
}
