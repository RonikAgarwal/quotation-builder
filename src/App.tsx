import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from './types';
import { useCatalog } from './hooks/useCatalog';
import { useRecent } from './hooks/useRecent';
import { useQuotation, createItemFromProduct } from './hooks/useQuotation';
import { runSearch } from './data/search';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { ResultsList } from './components/ResultsList';
import { GridResultsList } from './components/GridResultsList';
import { RecentlySelected } from './components/RecentlySelected';
import { SelectedPanel } from './components/SelectedPanel';
import { QuotationEditor } from './components/Quotation/QuotationEditor';
import { ImageManager } from './components/ImageManager/ImageManager';
import { QuantityPrompt } from './components/QuantityPrompt';
import type { RenderItem } from './types';

export function App() {
  const { status, catalog, index, error } = useCatalog();
  const recent = useRecent();
  const quotation = useQuotation();

  const [view, setView] = useState<'search' | 'quotation' | 'images' | 'pdf'>('search');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const [imageMap, setImageMap] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [pdfPage, setPdfPage] = useState(1);
  const [promptProduct, setPromptProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch('/image-map.json')
      .then(res => res.json())
      .then(data => setImageMap(data))
      .catch(() => console.warn('No image-map.json found'));
  }, []);

  const handleImageUploaded = (familyId: string) => {
    setImageMap(prev => ({ ...prev, [familyId]: true }));
  };

  const isEmptyQuery = query.trim() === '';

  const handleCategoryChange = (c: string | null) => {
    setActiveCategory(c);
    setActiveVariant(null);
    setActiveSize(null);
  };

  const handleVariantChange = (v: string | null) => {
    setActiveVariant(v);
    setActiveSize(null);
  };

  const availableVariants = useMemo(() => {
    if (!catalog) return [];
    const prods = activeCategory === null 
      ? catalog.all 
      : catalog.all.filter((p) => p.category === activeCategory);
    
    const variants = new Set<string>();
    for (const p of prods) {
      if (p.variant && p.variant.toLowerCase() !== 'standard') {
        variants.add(p.variant);
      }
    }
    return Array.from(variants).sort((a, b) => a.localeCompare(b));
  }, [catalog, activeCategory]);

  const availableSizes = useMemo(() => {
    if (!catalog) return [];
    let prods = catalog.all;
    if (activeCategory) prods = prods.filter(p => p.category === activeCategory);
    if (activeVariant) prods = prods.filter(p => p.variant === activeVariant);
    
    const sizes = new Set<string>();
    for (const p of prods) {
      if (p.size) sizes.add(p.size);
    }
    // Simple natural sort for sizes like "1 Inch", "2 Inch", "1/2 Inch"
    return Array.from(sizes).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [catalog, activeCategory, activeVariant]);

  const renderItems = useMemo<RenderItem[]>(() => {
    if (!index || !catalog || isEmptyQuery) return [];
    
    let scopedProducts = activeCategory === null 
      ? catalog.all 
      : catalog.all.filter((p) => p.category === activeCategory);

    if (activeVariant !== null) {
      scopedProducts = scopedProducts.filter((p) => p.variant === activeVariant);
    }
    if (activeSize !== null) {
      scopedProducts = scopedProducts.filter((p) => p.size === activeSize);
    }

    // Always fetch a large chunk of items so grouping is complete
    const searchHits = runSearch(scopedProducts, index, query, 2000);
    const filteredHits = searchHits.filter((p) => {
      if (activeCategory !== null && p.category !== activeCategory) return false;
      if (activeVariant !== null && p.variant !== activeVariant) return false;
      if (activeSize !== null && p.size !== activeSize) return false;
      return true;
    });

    if (filteredHits.length === 0) return [];

    // Always group by familyId
    const map = new Map<string, Product[]>();
    for (const p of filteredHits) {
      if (!map.has(p.familyId)) map.set(p.familyId, []);
      map.get(p.familyId)!.push(p);
    }

    const items: RenderItem[] = [];
    for (const [familyId, prods] of map.entries()) {
      items.push({
        type: 'group',
        familyId,
        count: prods.length,
        firstProduct: prods[0],
        allProducts: prods
      });
      if (expandedGroups.has(familyId)) {
        for (const p of prods) {
          items.push({ type: 'product', product: p });
        }
      }
    }
    return items;
  }, [index, catalog, query, activeCategory, activeVariant, activeSize, isEmptyQuery, expandedGroups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, activeCategory, activeVariant, activeSize]);

  const isSelected = (id: string) => quotation.state.items.some(q => q.productId === id);

  const handleToggle = (product: Product) => {
    recent.record(product);
    if (isSelected(product.id)) {
      // Remove all quotation rows matching this product
      const matchingRows = quotation.state.items.filter(q => q.productId === product.id);
      matchingRows.forEach(row => quotation.removeRow(row.id));
    } else {
      setPromptProduct(product);
    }
  };

  const handleNavigateQuotation = () => {
    setView('quotation');
  };

  function toggleGroup(familyId: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(familyId)) next.delete(familyId);
      else next.add(familyId);
      return next;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isEmptyQuery || renderItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, renderItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = renderItems[activeIndex];
      if (target) {
        if (target.type === 'group') {
          toggleGroup(target.familyId);
        } else {
          handleToggle(target.product);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
    }
  }

  // Keep the active card scrolled into view during keyboard navigation.
  useEffect(() => {
    if (view !== 'search') return;
    const el = document.querySelector('.card--active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, view]);

  if (status === 'loading') return <div className="state">Loading catalog…</div>;
  if (status === 'error') return <div className="state">Failed to load catalog: {error}</div>;

  if (view === 'images') {
    return (
      <ImageManager 
        catalog={catalog}
        imageMap={imageMap}
        onImageUploaded={handleImageUploaded}
        onBack={() => setView('search')}
      />
    );
  }

  if (view === 'quotation') {
    return (
      <QuotationEditor
        state={quotation.state}
        updateHeader={quotation.updateHeader}
        updateRow={quotation.updateRow}
        duplicateRow={quotation.duplicateRow}
        removeRow={quotation.removeRow}
        addBlankRow={quotation.addBlankRow}
        applyGlobalDiscount={quotation.applyGlobalDiscount}
        clearQuotation={quotation.clearQuotation}
        onBackToSearch={() => setView('search')}
      />
    );
  }

  const catalogPages: { label: string; page: number }[] = [
    { label: 'PVC', page: 1 },
    { label: 'SWR', page: 11 },
    { label: 'CPVC', page: 20 },
    { label: 'UPVC', page: 25 },
    { label: 'Borewell', page: 31 },
  ];

  return (
    <div className="layout">
      {/* Floating overlay menu */}
      {isSidebarOpen && (
        <>
          <div
            className="menu-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="menu-overlay">
            <div className="menu-overlay__header">
              <h2 className="menu-overlay__title">Menu</h2>
              <button
                className="menu-overlay__close"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="menu-overlay__nav">
              <button className="menu-overlay__item" onClick={() => { setView('search'); setSidebarOpen(false); }}>
                <span className="menu-overlay__icon">🔍</span>
                Search Products
              </button>
              <button className="menu-overlay__item" onClick={() => { setView('pdf'); setSidebarOpen(false); }}>
                <span className="menu-overlay__icon">📄</span>
                View Original Catalog
              </button>
              <button className="menu-overlay__item" onClick={() => { setView('images'); setSidebarOpen(false); }}>
                <span className="menu-overlay__icon">🖼️</span>
                Manage Images
              </button>
            </nav>
          </aside>
        </>
      )}

      <main className="main">
        {view === 'pdf' ? (
          <>
            <header className="header" style={{ marginBottom: '8px' }}>
              <button 
                onClick={() => setSidebarOpen(p => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', marginRight: '8px', padding: 0 }}
                aria-label="Toggle Menu"
              >
                ☰
              </button>
              <img src="/logo.png" alt="Shree Ganesh Hardware Logo" className="brand-logo" />
              <div className="header-text">
                <h1>Original Catalog</h1>
                <p className="sub">Browse the full product catalog</p>
              </div>
            </header>
            <div className="pdf-category-bar">
              {catalogPages.map((c) => (
                <button
                  key={c.label}
                  className={`chip ${pdfPage === c.page ? 'chip--on' : ''}`}
                  onClick={() => setPdfPage(c.page)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div style={{ width: '100%', flex: 1, background: '#f5f5f5', borderRadius: '12px', overflow: 'hidden', minHeight: 'calc(100vh - 140px)' }}>
              <iframe
                key={pdfPage}
                src={`/catalog.pdf#page=${pdfPage}`}
                width="100%"
                height="100%"
                style={{ border: 'none', display: 'block' }}
                title="Product Catalog PDF"
              />
            </div>
          </>
        ) : (
          <>
            <header className="header">
              <button 
                onClick={() => setSidebarOpen(p => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', marginRight: '8px', padding: 0 }}
                aria-label="Toggle Menu"
              >
                ☰
              </button>
              <img src="/logo.png" alt="Shree Ganesh Hardware Logo" className="brand-logo" />
              <div className="header-text">
                <h1>Shree Ganesh Hardware</h1>
                <p className="sub">Quotation Builder</p>
              </div>
            </header>

            <SearchBar
              ref={searchRef}
              value={query}
              onChange={setQuery}
              onKeyDown={handleKeyDown}
            />

            <FilterPanel
              categories={catalog?.categories ?? []}
              active={activeCategory}
              onChange={handleCategoryChange}
              variants={availableVariants}
              activeVariant={activeVariant}
              onChangeVariant={handleVariantChange}
              sizes={availableSizes}
              activeSize={activeSize}
              onChangeSize={setActiveSize}
              isGridView={isGridView}
              onToggleView={() => setIsGridView(v => !v)}
            />

            <div className="scroll-container">
              {isEmptyQuery ? (
                <RecentlySelected
                  products={recent.items}
                  isSelected={isSelected}
                  onToggle={handleToggle}
                  imageMap={imageMap}
                />
              ) : isGridView ? (
                <GridResultsList 
                  items={renderItems}
                  imageMap={imageMap}
                  isSelected={isSelected}
                  onToggle={handleToggle}
                />
              ) : (
                <ResultsList
                  items={renderItems}
                  expandedGroups={expandedGroups}
                  onToggleGroup={(familyId) => {
                    setExpandedGroups(prev => {
                      const next = new Set(prev);
                      if (next.has(familyId)) next.delete(familyId);
                      else next.add(familyId);
                      return next;
                    });
                  }}
                  isSelected={isSelected}
                  onToggle={handleToggle}
                  activeIndex={activeIndex}
                  imageMap={imageMap}
                />
              )}
            </div>
          </>
        )}
      </main>

      <SelectedPanel
        items={quotation.state.items}
        count={quotation.state.items.length}
        onRemove={quotation.removeRow}
        onNavigateQuotation={handleNavigateQuotation}
        imageMap={imageMap}
        onAddCustomProduct={(prod) => quotation.appendProducts([prod])}
        onImageUploaded={handleImageUploaded}
      />

      {promptProduct && (
        <QuantityPrompt
          product={promptProduct}
          onConfirm={(product, qty) => {
            quotation.appendProduct(product, qty);
            setPromptProduct(null);
          }}
          onCancel={() => setPromptProduct(null)}
        />
      )}
    </div>
  );
}
