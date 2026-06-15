import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { QuotationState } from '../types';
import { useAuth } from './useAuth';

export interface CloudQuotation {
  id: string;
  userId: string;
  createdAt: number;
  partyName: string;
  totalAmount: number;
  totalProducts: number;
  state: QuotationState;
}

export function useCloudHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<CloudQuotation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, 'quotations'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const items: CloudQuotation[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as CloudQuotation);
      });
      setHistory(items);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveToHistory = async (state: QuotationState, totalAmount: number) => {
    if (!user) {
      alert("You must be logged in to save quotations to the cloud.");
      return;
    }
    const newEntry = {
      userId: user.uid,
      createdAt: Date.now(),
      partyName: state.partyName || 'Untitled',
      totalAmount,
      totalProducts: state.items.length,
      state
    };
    
    try {
      const docRef = await addDoc(collection(db, 'quotations'), newEntry);
      setHistory(prev => [{ id: docRef.id, ...newEntry }, ...prev]);
      alert("Quotation saved to cloud history successfully!");
    } catch (err) {
      console.error("Failed to save to history:", err);
      alert("Failed to save quotation. Check console.");
    }
  };

  const deleteHistory = async (id: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this quotation from your history?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'quotations', id));
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete history:", err);
      alert("Failed to delete. Check console.");
    }
  };

  return { history, loading, saveToHistory, deleteHistory, refresh: fetchHistory };
}
