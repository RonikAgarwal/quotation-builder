import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from './types';
import { useCatalog } from './hooks/useCatalog';
import { useRecent } from './hooks/useRecent';
import { useQuotation } from './hooks/useQuotation';
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
import { HistoryView } from './components/HistoryView/HistoryView';
import { useAuth } from './hooks/useAuth';
import { useCustomProducts } from './hooks/useCustomProducts';
import type { RenderItem } from './types';

import { useRouting } from './hooks/useRouting';

export function QuotationBuilder() {
  const { status, catalog, index, error } = useCatalog();
  const recent = useRecent();
  const quotation = useQuotation();
  const { user, login, logout } = useAuth();
  const { view, pdfPage, navigate } = useRouting();
  const { customProducts, addCustomProduct } = useCustomProducts(user?.uid);

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>('all');
  const [activeVariant, setActiveVariant] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const [imageMap, setImageMap] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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
    
    let prods: Product[];
    if (activeCategory === 'custom') {
      prods = customProducts;
    } else if (activeCategory === 'all' || activeCategory === 'recent') {
      prods = [...customProducts, ...catalog.all];
    } else {
      prods = catalog.all.filter((p) => p.category === activeCategory);
    }
    
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
    
    let prods: Product[];
    if (activeCategory === 'custom') {
      prods = customProducts;
    } else if (activeCategory === 'all' || activeCategory === 'recent') {
      prods = [...customProducts, ...catalog.all];
    } else {
      prods = catalog.all.filter((p) => p.category === activeCategory);
    }

    if (activeVariant) prods = prods.filter(p => p.variant === activeVariant);
    
    const sizes = new Set<string>();
    for (const p of prods) {
      if (p.size) sizes.add(p.size);
    }
    // Simple natural sort for sizes like "1 Inch", "2 Inch", "1/2 Inch"
    return Array.from(sizes).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [catalog, activeCategory, activeVariant]);

  const renderItems = useMemo<RenderItem[]>(() => {
    if (!index || !catalog || activeCategory === 'recent') return [];
    
    let baseProducts: Product[];
    if (activeCategory === 'custom') {
      baseProducts = customProducts;
    } else if (activeCategory === 'all') {
      baseProducts = [...customProducts, ...catalog.all];
    } else {
      baseProducts = catalog.all.filter((p) => p.category === activeCategory);
    }

    let scopedProducts = baseProducts;

    if (activeVariant !== null) {
      scopedProducts = scopedProducts.filter((p) => p.variant === activeVariant);
    }
    if (activeSize !== null) {
      scopedProducts = scopedProducts.filter((p) => p.size === activeSize);
    }

    let filteredHits = scopedProducts;
    if (!isEmptyQuery) {
      if (activeCategory === 'custom') {
        const qStr = query.toLowerCase();
        filteredHits = scopedProducts.filter(p => p.productName.toLowerCase().includes(qStr));
      } else {
        const qStr = query.toLowerCase();
        const customHits = activeCategory === 'all' 
          ? customProducts.filter(p => p.productName.toLowerCase().includes(qStr) || (p.category && p.category.toLowerCase().includes(qStr)))
          : [];
        const catalogHits = runSearch(scopedProducts, index, query, 2000);
        filteredHits = [...catalogHits, ...customHits];
      }
    } else {
      // Empty query but category is selected: sort by page number
      filteredHits = [...scopedProducts].sort((a, b) => {
        const isCustomA = a.id.startsWith('custom_');
        const isCustomB = b.id.startsWith('custom_');
        
        if (isCustomA && !isCustomB) return 1;
        if (!isCustomA && isCustomB) return -1;
        
        const pageA = typeof a.sourcePage === 'number' ? a.sourcePage : 9999;
        const pageB = typeof b.sourcePage === 'number' ? b.sourcePage : 9999;
        if (pageA !== pageB) return pageA - pageB;
        return a.productName.localeCompare(b.productName);
      });
    }

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
  }, [index, catalog, customProducts, query, activeCategory, activeVariant, activeSize, isEmptyQuery, expandedGroups]);

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
    navigate('quotation');
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
        onBack={() => navigate('search')}
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
        applyGlobalDiscount={quotation.applyGlobalDiscount}
        clearQuotation={quotation.clearQuotation}
        onBackToSearch={() => navigate('search')}
        reorderRows={quotation.reorderRows}
        onAddCustomProduct={(prod) => {
          addCustomProduct(prod);
          quotation.appendProducts([prod]);
        }}
        onImageUploaded={handleImageUploaded}
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
    <div className={`layout ${view === 'history' ? 'layout--full' : ''}`}>
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
              <button className="menu-overlay__item" onClick={() => { navigate('search'); setSidebarOpen(false); }}>
                <span className="menu-overlay__icon">🔍</span>
                Search Products
              </button>
              <button className="menu-overlay__item" onClick={() => { navigate('pdf'); setSidebarOpen(false); }}>
                <span className="menu-overlay__icon">📄</span>
                View Original Catalog
              </button>
              <button className="menu-overlay__item" onClick={() => { navigate('history'); setSidebarOpen(false); }}>
                <span className="menu-overlay__icon">🕒</span>
                Previous Quotations
              </button>
              
              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                {user ? (
                  <div style={{ padding: '0 16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Signed in as</div>
                    <div style={{ fontWeight: 500, marginBottom: '16px', wordBreak: 'break-all' }}>{user.email}</div>
                    <button className="menu-overlay__item" onClick={() => { logout(); setSidebarOpen(false); }} style={{ color: '#d32f2f' }}>
                      <span className="menu-overlay__icon" style={{ display: 'flex', alignItems: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                      </span>
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button className="menu-overlay__item" onClick={() => { login(); setSidebarOpen(false); }} style={{ color: 'var(--accent)' }}>
                    <span className="menu-overlay__icon" style={{ display: 'flex', alignItems: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" y1="12" x2="3" y2="12"></line>
                      </svg>
                    </span>
                    Sign In with Google
                  </button>
                )}
              </div>
            </nav>
          </aside>
        </>
      )}

      <main className="main">
        {view === 'history' ? (
          <HistoryView
            onBack={() => navigate('search')}
            onEdit={(state) => {
              quotation.loadQuotation(state);
              navigate('quotation');
            }}
          />
        ) : view === 'pdf' ? (
          <>
            <header className="header" style={{ marginBottom: '8px' }}>
              <button 
                onClick={() => setSidebarOpen(p => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', marginRight: '8px', padding: 0 }}
                aria-label="Toggle Menu"
              >
                ☰
              </button>
              <img 
                src="/logo.png" 
                alt="Shree Ganesh Hardware Logo" 
                className="brand-logo" 
                onClick={() => navigate('search')}
                style={{ cursor: 'pointer' }}
              />
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
                  onClick={() => navigate('pdf', c.page)}
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
              <img 
                src="/logo.png" 
                alt="Shree Ganesh Hardware Logo" 
                className="brand-logo" 
                onClick={() => navigate('search')}
                style={{ cursor: 'pointer' }}
              />
              <div className="header-text">
                <h1>Shree Ganesh Hardware</h1>
                <p className="sub">Quotation Builder v1.1</p>
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
              {activeCategory === 'recent' ? (
                <RecentlySelected
                  products={recent.items}
                  isSelected={isSelected}
                  onToggle={handleToggle}
                  imageMap={imageMap}
                />
              ) : renderItems.length === 0 ? (
                <div className="empty">
                  {activeCategory === 'custom' && !user ? (
                    <div>
                      <p>You must be signed in to view and save custom products.</p>
                      <button onClick={login} style={{ padding: '8px 16px', marginTop: '16px', background: 'var(--accent)', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                        Sign In with Google
                      </button>
                    </div>
                  ) : activeCategory === 'custom' ? (
                    "No custom products found. Click '+ Add Custom Product' in the Selected panel!"
                  ) : (
                    "No products found."
                  )}
                </div>
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



      {(view === 'search' || view === 'pdf') && (
        <SelectedPanel
          items={quotation.state.items}
          count={quotation.state.items.length}
          onRemove={quotation.removeRow}
          onNavigateQuotation={handleNavigateQuotation}
          imageMap={imageMap}
          onAddCustomProduct={(prod) => {
            addCustomProduct(prod);
            quotation.appendProducts([prod]);
          }}
          onImageUploaded={handleImageUploaded}
        />
      )}

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
