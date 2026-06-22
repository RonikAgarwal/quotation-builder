import { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { Categories } from './Categories';
import { BrandsMarquee } from './BrandsMarquee';
import { StoreLocation } from './StoreLocation';
import { Footer } from './Footer';
import { useIsMobile } from '../../hooks/useIsMobile';
import './Home.css';

export function Home() {
  const navigate = useNavigate();

  const handleNavigateToQuotation = () => {
    navigate('/builder');
  };

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const isMobile = useIsMobile();

  if (isMobile) {
    return <Navigate to="/builder" replace />;
  }

  return (
    <div className="home-root">
      <Navbar onNavigate={handleNavigateToQuotation} />
      <Hero onNavigate={handleNavigateToQuotation} />
      <Categories />
      <BrandsMarquee />
      <StoreLocation />
      <Footer />
    </div>
  );
}
