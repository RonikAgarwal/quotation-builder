
import { MapPin, Phone, Clock, Star } from 'lucide-react';

export function StoreLocation() {
  return (
    <section id="location" className="home-location">
      <div className="home-container">
        <div className="home-section__header text-center">
          <h2 className="home-section__title">Visit our store</h2>
          <p className="home-section__desc">Experience our vast collection of premium hardware supplies in person.</p>
        </div>

        <div className="home-location__grid">
          <div className="home-location__map">
            {/* Google Maps Embed iframe */}
            <iframe 
              src="https://maps.google.com/maps?q=Shree+Ganesh+Hardware,+Maligaon,+Guwahati&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps Location"
            ></iframe>
          </div>

          <div className="home-location__info">
            <div className="home-info-card">
              <h3 className="home-info-card__title">Shree Ganesh Hardware</h3>
              
              <div className="home-info-card__item">
                <MapPin className="home-info-card__icon text-primary" size={20} style={{ flexShrink: 0 }} />
                <p>Ground Floor, Mani Bhawan, Near Royal Enfield Showroom, Maligaon Gate no.1, Guwahati - 781011</p>
              </div>

              <div className="home-info-card__item">
                <Phone className="home-info-card__icon text-primary" size={20} style={{ flexShrink: 0 }} />
                <p>+91 98645-48325<br/>+91 69015-58778</p>
              </div>

              <div className="home-info-card__item">
                <Clock className="home-info-card__icon text-primary" size={20} />
                <div>
                  <p><strong>Open today</strong></p>
                  <p>Mon-Sat: 10:00 AM - 8:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>

              <div className="home-reviews">
                <div className="home-reviews__header">
                  <div className="home-reviews__rating">5.0</div>
                  <div className="home-reviews__stars">
                    <Star fill="#F59E0B" color="#F59E0B" size={16} />
                    <Star fill="#F59E0B" color="#F59E0B" size={16} />
                    <Star fill="#F59E0B" color="#F59E0B" size={16} />
                    <Star fill="#F59E0B" color="#F59E0B" size={16} />
                    <Star fill="#F59E0B" color="#F59E0B" size={16} />
                  </div>
                </div>
                <p className="home-reviews__text">"Best hardware shop in the area with reasonable prices and great service." - Local Guide</p>
              </div>

              <a 
                href="https://maps.app.goo.gl/YEf4KUu6Agza3zum6" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="home-btn home-btn--secondary"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
              >
                Get Directions
              </a>

              <a 
                href="https://wa.me/919864548325" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="home-btn"
                style={{ width: '100%', justifyContent: 'center', background: '#25D366', color: 'white' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c-.003 1.396.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c.003-3.625 2.952-6.57 6.577-6.57a6.59 6.59 0 0 1 4.646 1.932 6.59 6.59 0 0 1 1.928 4.643c-.004 3.625-2.95 6.57-6.575 6.57zm3.605-4.92c-.197-.099-1.17-.578-1.352-.643-.182-.065-.315-.099-.448.099-.133.197-.513.643-.627.775-.114.133-.23.149-.427.049-.197-.099-.836-.308-1.592-.985-.59-.525-.985-1.175-1.1-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.448-1.082-.613-1.482-.16-.385-.323-.333-.448-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.53.247c-.182.198-.695.678-.695 1.654s.712 1.916.81 2.049c.098.133 1.394 2.132 3.376 2.987.472.203.84.324 1.126.415.474.15 905.129 1.3.116 1.776-.013.476-.247 1.482-.87 1.632-1.413.15-.544.17-.803.065-1.102z"/>
                </svg>
                Contact us on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Shop Images Gallery Placeholders */}
        <div className="home-gallery">
          <div className="home-gallery__item">
            {/* Replace with your actual shop image */}
            <img src="/homepage-assets/shop-1.webp" alt="Shop exterior" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=400"; }} />
          </div>
          <div className="home-gallery__item">
            {/* Replace with your actual shop image */}
            <img src="/homepage-assets/shop-2.webp" alt="Hardware section" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&q=80&w=400"; }} />
          </div>
          <div className="home-gallery__item">
            {/* Replace with your actual shop image */}
            <img src="/homepage-assets/shop-3.webp" alt="Paints section" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80&w=400"; }} />
          </div>
        </div>
      </div>
    </section>
  );
}
