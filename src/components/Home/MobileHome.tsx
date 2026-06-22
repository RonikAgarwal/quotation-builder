import { Link } from 'react-router-dom';
import { Menu, FileText, BookOpen, MapPin, MessageCircle, Star, PaintBucket, Droplets, Box, Wrench, Bath, CheckSquare } from 'lucide-react';
import './MobileHome.css';

const categories = [
  { id: 'c1', name: 'Plumbing', icon: Droplets },
  { id: 'c2', name: 'Paints', icon: PaintBucket },
  { id: 'c3', name: 'Hardware', icon: Box },
  { id: 'c4', name: 'Sanitaryware', icon: Bath },
  { id: 'c5', name: 'Tools', icon: Wrench },
  { id: 'c6', name: 'Tiles', icon: CheckSquare }
];

interface MobileHomeProps {
  onNavigateQuotation: () => void;
}

export function MobileHome({ onNavigateQuotation }: MobileHomeProps) {
  return (
    <div className="mobile-home-root">
      {/* Top App Bar */}
      <header className="mobile-app-bar">
        <div className="mobile-app-bar__brand">
          <img src="/logo.webp" alt="Logo" className="mobile-app-bar__logo" />
          <span className="mobile-app-bar__title">Shree Ganesh Hardware</span>
        </div>
        <button aria-label="Menu" style={{ background: 'none', border: 'none', padding: 4 }}>
          <Menu size={24} />
        </button>
      </header>

      {/* Banner */}
      <div className="mobile-banner">
        <h2>Build with<br/>confidence.</h2>
        <p><Star size={16} fill="white" /> 5.0 Google Rating</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="mobile-quick-actions">
        <button className="mobile-action-card mobile-action-card--primary" onClick={onNavigateQuotation} style={{ cursor: 'pointer', border: 'none', display: 'flex', width: '100%' }}>
          <div className="mobile-action-icon">
            <FileText size={24} />
          </div>
          <span>Create<br/>Quotation</span>
        </button>
        
        <Link to="/#pdf" className="mobile-action-card" onClick={(e) => {
          e.preventDefault();
          window.location.hash = '/pdf/1';
        }}>
          <div className="mobile-action-icon">
            <BookOpen size={24} />
          </div>
          <span>PDF<br/>Catalog</span>
        </Link>
        
        <a href="https://wa.me/919864548325" target="_blank" rel="noopener noreferrer" className="mobile-action-card">
          <div className="mobile-action-icon">
            <MessageCircle size={24} />
          </div>
          <span>WhatsApp<br/>Us</span>
        </a>
        
        <a href="https://maps.app.goo.gl/YEf4KUu6Agza3zum6" target="_blank" rel="noopener noreferrer" className="mobile-action-card">
          <div className="mobile-action-icon">
            <MapPin size={24} />
          </div>
          <span>Visit<br/>Store</span>
        </a>
      </div>

      {/* Categories */}
      <section className="mobile-categories-section">
        <h3 className="mobile-section-title">Shop by Category</h3>
        <div className="mobile-categories-scroll">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button 
                key={cat.id} 
                className="mobile-category-pill"
                onClick={onNavigateQuotation}
                style={{ cursor: 'pointer' }}
              >
                <Icon size={18} />
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Floating Action Button */}
      <a 
        href="https://wa.me/919864548325" 
        target="_blank" 
        rel="noopener noreferrer"
        className="mobile-fab"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={28} fill="white" />
      </a>
    </div>
  );
}
