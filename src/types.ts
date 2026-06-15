// Shape of a single record in master_catalog_production.json (raw, as authored).
export interface RawCatalogRecord {
  product_name: string;
  source_page?: number;
  attributes: {
    category: string | null;
    variant: string | null;
    size: string | null;
    pressure: string | null;
    mrp: number | null;
    is_available: boolean;
  };
}

// Normalized, flat product used everywhere in the app.
// Self-contained so the cart can store the whole object (not just an id).
export interface Product {
  id: string;
  familyId: string;
  sourcePage: number;
  productName: string;
  category: string | null;
  variant: string | null;
  size: string | null;
  pressure: string | null;
  mrp: number | null;
  isAvailable: boolean;
  // Precomputed display metadata, built once at load time. Every screen
  // (search results, recently selected, selected panel, quotation, PDF)
  // consumes these directly and must never rebuild formatting logic.
  displayTitle: string; // canonical heading, e.g. "PLAIN PIPES ..."
  displaySubtitle: string; // attribute line, e.g. "PVC \u2022 25 mm \u2022 10 kgf/cm\u00b2"
  attributeLine: string; // alias of displaySubtitle (kept for clarity/back-compat)
  displayPrice: string; // formatted once, e.g. "\u20b9316" or "Price NA"
  // Dedicated, individually-weighted retrieval fields (never displayed).
  // Normalized so salesmen can type sizes/variants/pressures naturally.
  variantKey: string; // e.g. "sdr 11 sdr11", "both side plain"
  sizeKey: string; // e.g. "3/4 25 25mm"
  pressureKey: string; // e.g. "10kg 10 kg"
  // Supporting reorder/mixed-query key (retrieval-only), e.g.
  // "3/4 cpvc pipe sdr 11". Never replaces or is displayed as the title.
  salesKey: string;
  searchBlob: string; // secondary normalized text used by the search index
  // Comprehensive normalized text for token-based hybrid search.
  // Concatenation of all searchable fields (name, category, variant, size,
  // pressure, sizeKey, variantKey, pressureKey). Used by the exact token
  // matching stage. Never displayed.
  searchText: string;
  customImageBase64?: string; // Encoded image data for custom products
}

// ---------------------------------------------------------------------------
// Phase 2: Quotation Builder Types
// ---------------------------------------------------------------------------

export interface QuotationItem {
  id: string; // Unique row ID (generated on add, e.g. uuid or timestamp)
  productId?: string; // Links back to the original catalog product ID if applicable
  familyId: string; // Keep for image thumbnails
  name: string; // Initially: product.displayTitle, then completely editable
  subtitle: string; // Initially: product.displaySubtitle, then editable
  mrp: number | ''; // Kept as number | '' so clearing the input doesn't force '0'
  discountPercent: number | ''; 
  discountedPrice: number | '';
  quantity: number | '';
  customImageBase64?: string; // Encoded image data for custom products
}

export interface QuotationState {
  partyName: string;
  date: string; // YYYY-MM-DD
  items: QuotationItem[];
}

export type RenderItem = 
  | { type: 'group'; familyId: string; count: number; firstProduct: Product; allProducts: Product[] }
  | { type: 'product'; product: Product };
