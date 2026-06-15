import { useCallback, useEffect, useState } from 'react';
import type { QuotationItem, QuotationState, Product } from '../types';
import { readJson, writeJson } from '../data/storage';

const STORAGE_KEY = 'qb.quotation.v2';

export function createBlankItem(): QuotationItem {
  return {
    id: crypto.randomUUID(),
    familyId: '',
    name: '',
    subtitle: '',
    mrp: '',
    discountPercent: 0,
    discountedPrice: '',
    quantity: 1,
  };
}

export function createItemFromProduct(p: Product, qty: number = 1): QuotationItem {
  const mrp = p.mrp && p.mrp > 0 ? p.mrp : '';
  return {
    id: crypto.randomUUID(),
    productId: p.id,
    familyId: p.familyId,
    name: p.displayTitle,
    subtitle: p.displaySubtitle || '',
    mrp: mrp,
    discountPercent: 0,
    discountedPrice: mrp,
    quantity: qty,
    customImageBase64: p.customImageBase64,
  };
}

export function useQuotation() {
  const [state, setState] = useState<QuotationState>(() => {
    const saved = readJson<QuotationState | null>(STORAGE_KEY, null);
    if (saved) return saved;
    // Default state
    const today = new Date();
    // Use local time for YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return {
      partyName: '',
      date: `${yyyy}-${mm}-${dd}`,
      items: [],
    };
  });

  // Persist state changes
  useEffect(() => {
    writeJson(STORAGE_KEY, state);
  }, [state]);

  const updateHeader = useCallback((updates: Partial<Pick<QuotationState, 'partyName' | 'date'>>) => {
    setState((s) => ({ ...s, ...updates }));
  }, []);

  const appendProduct = useCallback((product: Product, quantity: number = 1) => {
    setState((s) => ({
      ...s,
      items: [...s.items, createItemFromProduct(product, quantity)],
    }));
  }, []);

  const appendProducts = useCallback((products: Product[]) => {
    setState((s) => ({
      ...s,
      items: [...s.items, ...products.map(p => createItemFromProduct(p, 1))],
    }));
  }, []);

  const addBlankRow = useCallback(() => {
    setState((s) => ({
      ...s,
      items: [...s.items, createBlankItem()],
    }));
  }, []);

  const duplicateRow = useCallback((id: string) => {
    setState((s) => {
      const idx = s.items.findIndex((item) => item.id === id);
      if (idx === -1) return s;
      const original = s.items[idx];
      const clone: QuotationItem = { ...original, id: crypto.randomUUID() };
      const next = [...s.items];
      next.splice(idx + 1, 0, clone); // insert immediately after
      return { ...s, items: next };
    });
  }, []);

  const removeRow = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      items: s.items.filter((item) => item.id !== id),
    }));
  }, []);

  const updateRow = useCallback((id: string, updates: Partial<QuotationItem>) => {
    setState((s) => ({
      ...s,
      items: s.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  }, []);

  const applyGlobalDiscount = useCallback((discountPercent: number) => {
    if (isNaN(discountPercent) || discountPercent < 0) return;
    setState((s) => {
      const nextItems = s.items.map((item) => {
        if (typeof item.mrp !== 'number' || item.mrp <= 0) return item;
        const discountAmount = item.mrp * (discountPercent / 100);
        let newPrice = item.mrp - discountAmount;
        // round to 2 decimals to prevent huge float strings
        newPrice = Math.round(newPrice * 100) / 100;
        return {
          ...item,
          discountPercent: discountPercent,
          discountedPrice: newPrice,
        };
      });
      return { ...s, items: nextItems };
    });
  }, []);

  const clearQuotation = useCallback(() => {
    setState((s) => ({ ...s, items: [] }));
  }, []);

  const loadQuotation = useCallback((newState: QuotationState) => {
    setState(newState);
  }, []);

  return {
    state,
    updateHeader,
    appendProduct,
    appendProducts,
    addBlankRow,
    duplicateRow,
    removeRow,
    updateRow,
    applyGlobalDiscount,
    clearQuotation,
    loadQuotation,
  };
}
