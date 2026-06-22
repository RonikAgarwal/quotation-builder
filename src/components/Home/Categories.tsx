import { Link } from 'react-router-dom';
import { PaintBucket, Droplets, Box, Wrench, Bath, CheckSquare } from 'lucide-react';

const categories = [
  { id: 'paints', name: 'Paints & Primers', desc: 'Premium interior and exterior paints.', icon: PaintBucket },
  { id: 'pipes', name: 'Pipes & Fittings', desc: 'PVC, UPVC, CPVC, and SWR solutions.', icon: Droplets },
  { id: 'tanks', name: 'Water Tanks', desc: 'Durable, multi-layer water storage.', icon: Box },
  { id: 'putty', name: 'Putty & Cement', desc: 'Wall care, white cement, and adhesives.', icon: CheckSquare },
  { id: 'plumbing', name: 'Plumbing', desc: 'Valves, taps, and bathroom fittings.', icon: Wrench },
  { id: 'sanitaryware', name: 'Sanitaryware', desc: 'Toilets, basins, and showers.', icon: Bath },
];

export function Categories() {
  return (
    <section id="categories" className="home-section bg-surface">
      <div className="home-container">
        <div className="home-section__header">
          <h2 className="home-section__title">Everything you need under one roof</h2>
          <p className="home-section__desc">From foundation to finish, explore our vast catalog of premium hardware supplies.</p>
        </div>

        <div className="home-categories__grid">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div 
                key={cat.id}
                className="home-category__card"
              >
                <div className="home-category__icon">
                  <Icon size={28} />
                </div>
                <h3 className="home-category__name">{cat.name}</h3>
                <p className="home-category__description">{cat.desc}</p>
                <Link to="/builder" className="home-category__link">Explore →</Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
