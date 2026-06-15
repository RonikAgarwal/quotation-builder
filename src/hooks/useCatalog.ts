import { useEffect, useState } from 'react';
import Fuse from 'fuse.js';
import type { Product, RawCatalogRecord } from '../types';
import { buildCatalog, type Catalog } from '../data/catalog';
import { createSearchIndex } from '../data/search';

type Status = 'loading' | 'ready' | 'error';

interface CatalogState {
  status: Status;
  catalog: Catalog | null;
  index: Fuse<Product> | null;
  error: string | null;
}

// Loads the static catalog JSON once, normalizes it, and builds the search
// index. The JSON lives in public/ so Vite serves it at the site root; no
// backend is involved.
export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({
    status: 'loading',
    catalog: null,
    index: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    fetch('/master_catalog_production.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load catalog (${res.status})`);
        return res.json() as Promise<RawCatalogRecord[]>;
      })
      .then((raw) => {
        if (cancelled) return;
        const catalog = buildCatalog(raw);
        const index = createSearchIndex(catalog.all);
        setState({ status: 'ready', catalog, index, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState({ status: 'error', catalog: null, index: null, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
