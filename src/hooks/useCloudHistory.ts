import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { QuotationState } from '../types';
import { useAuth } from './useAuth';
import { usePopup } from '../components/Popup/PopupProvider';

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
  const { showAlert, showConfirm } = usePopup();
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
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const items: CloudQuotation[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as CloudQuotation);
      });
      // Sort in memory to avoid needing a Firestore composite index
      items.sort((a, b) => b.createdAt - a.createdAt);
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
      showAlert("You must be logged in to save quotations to the cloud.", "error", "Sign In Required");
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
      showAlert("Quotation saved to cloud history successfully!", "success", "Success");
    } catch (err) {
      console.error("Failed to save to history:", err);
      showAlert("Failed to save quotation. Check console.", "error", "Error");
    }
  };

  const deleteHistory = (id: string) => {
    if (!user) return;
    
    showConfirm("Are you sure you want to delete this quotation from your history?", async () => {
      try {
        await deleteDoc(doc(db, 'quotations', id));
        setHistory(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error("Failed to delete history:", err);
        showAlert("Failed to delete. Check console.", "error", "Error");
      }
    }, "Delete Quotation");
  };

  return { history, loading, saveToHistory, deleteHistory, refresh: fetchHistory };
}
