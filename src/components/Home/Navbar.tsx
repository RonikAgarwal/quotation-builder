import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar({ onNavigate }: { onNavigate: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`home-navbar ${scrolled ? 'home-navbar--scrolled' : ''}`}>
      <div className="home-navbar__container">
        <div className="home-navbar__logo-group">
          <img src="/logo.webp" alt="Shree Ganesh Hardware" className="home-navbar__logo" />
          <span className="home-navbar__title">Shree Ganesh Hardware</span>
        </div>

        <div className="home-navbar__links desktop-only">
          <button className="home-navbar__link-btn" onClick={() => scrollTo('categories')}>Categories</button>
          <button className="home-navbar__link-btn" onClick={() => scrollTo('brands')}>Brands</button>
          <button className="home-navbar__link-btn" onClick={() => scrollTo('location')}>Visit Us</button>
        </div>

        <div className="home-navbar__actions desktop-only">
          <button className="home-btn home-btn--primary" onClick={onNavigate}>
            Create Quotation
          </button>
        </div>

        <button className="home-navbar__hamburger mobile-only" onClick={() => setMobileMenuOpen(true)}>
          <Menu />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="home-navbar__mobile-menu">
          <div className="home-navbar__mobile-header">
            <span className="home-navbar__title">Menu</span>
            <button className="home-navbar__close" onClick={() => setMobileMenuOpen(false)}>
              <X />
            </button>
          </div>
          <div className="home-navbar__mobile-links">
            <button className="home-navbar__link-btn" onClick={() => scrollTo('categories')}>Categories</button>
            <button className="home-navbar__link-btn" onClick={() => scrollTo('brands')}>Brands</button>
            <button className="home-navbar__link-btn" onClick={() => scrollTo('location')}>Visit Us</button>
            <button className="home-btn home-btn--primary" onClick={() => { onNavigate(); setMobileMenuOpen(false); }} style={{ marginTop: '16px' }}>
              Create Quotation
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
