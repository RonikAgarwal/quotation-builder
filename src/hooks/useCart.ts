import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '../types';
import { readJson, writeJson } from '../data/storage';

const STORAGE_KEY = 'qb.cart.v2';

// Cart stores COMPLETE Product objects (not just ids) so future quotation
// and PDF generation have everything they need without re-querying the
// catalog. Keyed by id for O(1) toggle/remove.
export interface CartApi {
  items: Product[];
  count: number;
  has: (id: string) => boolean;
  toggle: (product: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export function useCart(): CartApi {
  const [map, setMap] = useState<Map<string, Product>>(() => {
    const saved = readJson<Product[]>(STORAGE_KEY, []);
    return new Map(saved.map((p) => [p.id, p]));
  });

  useEffect(() => {
    writeJson(STORAGE_KEY, Array.from(map.values()));
  }, [map]);

  const has = useCallback((id: string) => map.has(id), [map]);

  const toggle = useCallback((product: Product) => {
    setMap((prev) => {
      const next = new Map(prev);
      if (next.has(product.id)) next.delete(product.id);
      else next.set(product.id, product);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setMap(new Map()), []);

  const items = useMemo(() => Array.from(map.values()), [map]);

  return { items, count: items.length, has, toggle, remove, clear };
}
