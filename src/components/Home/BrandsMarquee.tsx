

const brands = [
  { name: 'Supreme', id: 'supreme', imageSrc: '/homepage-assets/supreme.png.jpeg' },
  { name: 'Berger', id: 'berger', imageSrc: '/homepage-assets/berger.png.jpeg' },
  { name: 'Crompton', id: 'crompton', imageSrc: '/homepage-assets/crompton.png.jpeg' },
  { name: 'Asian Paints', id: 'asian-paints', imageSrc: '/homepage-assets/asianpaints.png.jpeg' },
  { name: 'Pidilite', id: 'pidilite', imageSrc: '/homepage-assets/pidilite.png' },
  { name: 'Parryware', id: 'parryware', imageSrc: '/homepage-assets/parryware.png.jpeg' },
  { name: 'IPSA', id: 'ipsa', imageSrc: '/homepage-assets/ipsa.png.jpeg' }
];

export function BrandsMarquee() {
  // We duplicate the array to create an infinite scrolling effect
  const marqueeItems = [...brands, ...brands, ...brands];

  return (
    <section id="brands" className="home-brands">
      <div className="home-container">
        <h3 className="home-brands__title">Trusted by industry leaders</h3>
        <div className="home-marquee">
          <div className="home-marquee__track">
            {marqueeItems.map((brand, i) => (
              <div key={`${brand.id}-${i}`} className="home-marquee__item">
                {/* 
                  Once you add the logo files to your public/ folder, they will appear here automatically! 
                  Make sure they are named exactly as shown in the src attribute below.
                */}
                <img 
                  src={brand.imageSrc} 
                  alt={brand.name} 
                  className="home-marquee__logo-img"
                  onError={(e) => {
                    // Fallback to text if image not found
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLDivElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div className="home-marquee__placeholder" style={{ display: 'none' }}>
                  {brand.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
