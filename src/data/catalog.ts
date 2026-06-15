import type { Product, RawCatalogRecord } from '../types';
import {
  normalizeText,
  normalizeSize,
  normalizeVariant,
  normalizePressure,
  buildSearchableText,
} from './normalize';

// --- Display helpers -------------------------------------------------------

const STANDARD = 'standard';

// Build the catalog-style attribute line: Category \u2022 Variant \u2022 Size \u2022 Pressure.
// Variant is hidden ONLY when it equals "Standard" (case-insensitive), which is
// the catalog's noisy default. Meaningful variants (SCH-80, Supreme, With Jali,
// SDR 11, ...) always display. Null/empty fields are hidden. The product name
// is handled separately and is never modified.
function buildAttributeLine(r: RawCatalogRecord['attributes']): string {
  const variant =
    r.variant && r.variant.trim().toLowerCase() !== STANDARD ? r.variant : null;
  return [r.category, variant, r.size, r.pressure]
    .filter((v): v is string => Boolean(v && String(v).trim()))
    .join(' \u2022 ');
}

function buildSearchBlob(name: string, a: RawCatalogRecord['attributes']): string {
  const parts = [name, a.category, a.variant, a.size, a.pressure].filter(
    (v): v is string => Boolean(v && String(v).trim()),
  );
  return normalizeText(parts.join(' '));
}

// --- Salesman search key ---------------------------------------------------
// Retrieval-only key, ordered like a quotation entry
// (size -> category -> name -> variant -> pressure). Never displayed and never
// used as a title. Helps reordered/mixed phrasings like "25 pvc plain".
function buildSalesKey(name: string, a: RawCatalogRecord['attributes']): string {
  const parts = [
    normalizeSize(a.size),
    a.category ?? '',
    name,
    normalizeVariant(a.variant),
    normalizePressure(a.pressure),
  ];
  return normalizeText(parts.filter((p) => p.trim()).join(' '));
}

// Format MRP once so no downstream screen re-implements currency formatting.
function buildDisplayPrice(mrp: number | null): string {
  if (mrp == null) return 'Price NA';
  return `\u20b9${Math.round(mrp).toLocaleString('en-IN')}`;
}

// --- Public API ------------------------------------------------------------

export interface Catalog {
  all: Product[]; // available (sellable) products only
  categories: string[]; // distinct, sorted, for the Category filter
  rawCount: number; // total records in the file (diagnostics)
}

// Flatten the nested raw records into self-contained Product objects.
// Index-based ids are stable because the JSON order is stable.
export function buildCatalog(raw: RawCatalogRecord[]): Catalog {
  const products: Product[] = raw.map((rec, index) => {
    const a = rec.attributes;
    const sizeKey = normalizeSize(a.size);
    const variantKey = normalizeVariant(a.variant);
    const pressureKey = normalizePressure(a.pressure);
    
    // Create familyId for image grouping: safe alphanumeric string
    const categorySafe = a.category ? a.category : '';
    const variantSafe = a.variant && a.variant.toLowerCase() !== 'standard' ? a.variant : '';
    const familyRaw = `${categorySafe}_${rec.product_name}_${variantSafe}`;
    const familyId = familyRaw.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').toLowerCase();

    return {
      id: `p-${index}`,
      familyId,
      sourcePage: rec.source_page || 9999, // default to high number if missing
      productName: rec.product_name,
      familyName: rec.product_name, // Map family directly to product name
      category: a.category,
      variant: a.variant,
      size: a.size,
      pressure: a.pressure,
      mrp: a.mrp,
      isAvailable: a.is_available,
      displayTitle: rec.product_name,
      displaySubtitle: buildAttributeLine(a),
      attributeLine: buildAttributeLine(a),
      displayPrice: buildDisplayPrice(a.mrp),
      variantKey,
      sizeKey,
      pressureKey,
      salesKey: buildSalesKey(rec.product_name, a),
      searchBlob: buildSearchBlob(rec.product_name, a),
      searchText: buildSearchableText(
        rec.product_name,
        a.category,
        a.variant,
        a.size,
        a.pressure,
        sizeKey,
        variantKey,
        pressureKey,
      ),
    };
  });

  // V1 rule: only sellable (priced/available) items are searchable.
  const available = products.filter((p) => p.isAvailable);

  const explicitOrder = ["PVC", "SWR", "CPVC", "UPVC", "Borewell"];

  const categories = Array.from(
    new Set(available.map((p) => p.category).filter((c): c is string => Boolean(c))),
  )
    .filter((c) => c.toLowerCase() !== "cemprim")
    .sort((a, b) => {
      const indexA = explicitOrder.findIndex(x => x.toLowerCase() === a.toLowerCase());
      const indexB = explicitOrder.findIndex(x => x.toLowerCase() === b.toLowerCase());
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return a.localeCompare(b);
    });

  return { all: available, categories, rawCount: raw.length };
}
