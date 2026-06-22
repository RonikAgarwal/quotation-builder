

export function Footer() {
  return (
    <footer className="home-footer">
      <div className="home-container">
        <div className="home-footer__grid">
          <div className="home-footer__brand">
            <img src="/logo.webp" alt="Shree Ganesh Hardware" className="home-footer__logo" />
            <p className="home-footer__desc">
              Your trusted partner for premium hardware, plumbing, paints, and sanitaryware solutions.
            </p>
          </div>
          
          <div className="home-footer__links">
            <h4 className="home-footer__title">Quick Links</h4>
            <a href="/builder">Create Quotation</a>
            <a href="#categories">Our Categories</a>
            <a href="#brands">Trusted Brands</a>
            <a href="#location">Visit Store</a>
          </div>

          <div className="home-footer__contact">
            <h4 className="home-footer__title">Contact</h4>
            <p>Mon - Sat: 10:00 AM - 8:00 PM</p>
            <p>Sunday: Closed</p>
          </div>
        </div>
        
        <div className="home-footer__bottom">
          <p>&copy; {new Date().getFullYear()} Shree Ganesh Hardware. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
