interface Props {
  categories: string[];
  active: string | null; // null = All
  onChange: (category: string | null) => void;
  variants: string[];
  activeVariant: string | null;
  onChangeVariant: (variant: string | null) => void;
  sizes: string[];
  activeSize: string | null;
  onChangeSize: (size: string | null) => void;
  isGridView: boolean;
  onToggleView: () => void;
}

// Config-driven only by the category list for now. Designed so more filters
// (size, pressure, availability) can be added later without restructuring.
export function FilterPanel({ 
  categories, active, onChange, 
  variants, activeVariant, onChangeVariant,
  sizes, activeSize, onChangeSize,
  isGridView, onToggleView
}: Props) {
  return (
    <div className="filters-container">
      <div className="filters">
        <button
          className={`chip${active === 'recent' ? ' chip--on' : ''}`}
          onClick={() => onChange('recent')}
        >
          Recent
        </button>
        <button
          className={`chip${active === 'all' ? ' chip--on' : ''}`}
          onClick={() => onChange('all')}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`chip${active === c ? ' chip--on' : ''}`}
            onClick={() => onChange(c)}
          >
            {c}
          </button>
        ))}
        <button
          className={`chip${active === 'custom' ? ' chip--on' : ''}`}
          onClick={() => onChange('custom')}
        >
          Custom
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button 
          className="variant-dropdown"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={onToggleView}
        >
          {isGridView ? '≣ List View' : '⊞ Grid View'}
        </button>

        {variants.length > 0 && (
          <select 
            className="variant-dropdown variant-dropdown--fixed"
            value={activeVariant || ''}
            onChange={(e) => onChangeVariant(e.target.value || null)}
          >
            <option value="">All Variants</option>
            {variants.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        )}

        {sizes.length > 0 && (
          <select 
            className="variant-dropdown variant-dropdown--fixed"
            value={activeSize || ''}
            onChange={(e) => onChangeSize(e.target.value || null)}
          >
            <option value="">All Sizes</option>
            {sizes.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
