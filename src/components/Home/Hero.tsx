
import { ArrowRight, Star } from 'lucide-react';

export function Hero({ onNavigate }: { onNavigate: () => void }) {
  return (
    <section className="home-hero">
      <div className="home-hero__container">
        <div className="home-hero__content">
          <div className="home-hero__eyebrow">Trusted hardware partner since 2018</div>
          <h1 className="home-hero__title">
            Build with confidence.<br/>
            Shop with <span className="text-primary">Shree Ganesh Hardware.</span>
          </h1>
          <p className="home-hero__subtitle">
            Your one-stop destination for premium hardware, plumbing, paints, and sanitaryware. Get instant quotations for your complete project needs.
          </p>
          <div className="home-hero__actions">
            <button className="home-btn home-btn--primary home-btn--lg" onClick={onNavigate}>
              Create Quotation <ArrowRight size={18} />
            </button>
            <a href="#location" className="home-btn home-btn--secondary home-btn--lg">
              Visit Store
            </a>
          </div>
          
          <div className="home-hero__stats">
            <div className="home-hero__stat-item">
              <div className="home-hero__stat-value">5.0 <Star size={16} fill="currentColor" /></div>
              <div className="home-hero__stat-label">Google Rating</div>
            </div>
            <div className="home-hero__stat-item">
              <div className="home-hero__stat-value">10,000+</div>
              <div className="home-hero__stat-label">Products</div>
            </div>
            <div className="home-hero__stat-item">
              <div className="home-hero__stat-value">Top</div>
              <div className="home-hero__stat-label">Brands</div>
            </div>
          </div>
        </div>

        <div className="home-hero__visual">
          <div className="home-hero__image-wrapper">
            <div className="home-hero__image-scroll">
              <div className="home-hero__image-track">
                {/* We repeat the images to create an infinite scroll effect */}
                {[1, 2, 3, 4, 5, 1, 2, 3, 4, 5].map((num, idx) => (
                  <img 
                    key={idx}
                    src={`/homepage-assets/shop-${num}.webp`} 
                    alt={`Shop Image ${num}`} 
                    className="home-hero__image"
                    onError={(e) => {
                      // Fallback to placeholder if they haven't uploaded yet
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="home-hero__floating-card">
              <img src="/logo.webp" alt="Logo" className="home-hero__floating-logo" />
              <div>
                <strong>Shree Ganesh Hardware</strong>
                <span>Verified Retailer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
