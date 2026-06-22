import { Search, Menu, ShoppingCart, LayoutGrid, List } from 'lucide-react';
import './MobileBuilderHeader.css';

interface Props {
  onToggleSidebar: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  
  categories: string[];
  activeCategory: string | null;
  onChangeCategory: (c: string | null) => void;
  
  sizes: string[];
  activeSize: string | null;
  onChangeSize: (s: string | null) => void;
  
  isGridView: boolean;
  onToggleView: () => void;
}

export function MobileBuilderHeader({
  onToggleSidebar,
  query,
  onQueryChange,
  cartCount,
  onOpenCart,
  categories,
  activeCategory,
  onChangeCategory,
  sizes,
  activeSize,
  onChangeSize,
  isGridView,
  onToggleView
}: Props) {
  return (
    <div className="mobile-b-header">
      {/* Top Row */}
      <div className="mobile-b-header__top">
        <button className="mobile-b-header__btn" onClick={onToggleSidebar} aria-label="Menu">
          <Menu size={24} />
        </button>
        
        <div className="mobile-b-header__search">
          <Search size={18} className="mobile-b-header__search-icon" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        
        <button className="mobile-b-header__cart-btn" onClick={onOpenCart} aria-label="Cart">
          <ShoppingCart size={24} />
          {cartCount > 0 && <span className="mobile-b-header__cart-badge">{cartCount}</span>}
        </button>
      </div>

      {/* Bottom Row / Filter Strip */}
      <div className="mobile-b-header__bottom">
        <select 
          className="mobile-b-header__select"
          value={activeCategory || 'all'}
          onChange={(e) => onChangeCategory(e.target.value === 'all' ? null : e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="recent">Recently Selected</option>
          <option value="custom">Custom Products</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button className="mobile-b-header__view-toggle" onClick={onToggleView} aria-label="Toggle View">
          {isGridView ? <List size={20} /> : <LayoutGrid size={20} />}
        </button>

        <select 
          className="mobile-b-header__select"
          value={activeSize || ''}
          onChange={(e) => onChangeSize(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">All Sizes</option>
          {sizes.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
