import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../types';
import { readJson, writeJson } from '../data/storage';

const STORAGE_KEY = 'qb.recent.v2';
const MAX_RECENT = 10;

// Recently Selected stores FULL Product objects, most-recent-first, deduped
// by id and capped. Storing whole objects means the Recently Selected strip
// renders with the same components and zero formatting rebuild.
export interface RecentApi {
  items: Product[];
  record: (product: Product) => void;
}

export function useRecent(): RecentApi {
  const [items, setItems] = useState<Product[]>(() =>
    readJson<Product[]>(STORAGE_KEY, []),
  );

  useEffect(() => {
    writeJson(STORAGE_KEY, items);
  }, [items]);

  const record = useCallback((product: Product) => {
    setItems((prev) => {
      const deduped = prev.filter((p) => p.id !== product.id);
      return [product, ...deduped].slice(0, MAX_RECENT);
    });
  }, []);

  return { items, record };
}
