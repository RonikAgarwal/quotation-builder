import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product } from '../types';

export function useCustomProducts(userId: string | undefined) {
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setCustomProducts([]);
      return;
    }

    setLoading(true);
    const q = query(collection(db, `users/${userId}/customProducts`));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((doc) => {
        products.push(doc.data() as Product);
      });
      // Sort recently added first, or alphabetical
      products.sort((a, b) => a.productName.localeCompare(b.productName));
      setCustomProducts(products);
      setLoading(false);
    }, (error: any) => {
      console.error("Error fetching custom products: ", error);
      if (error.code === 'permission-denied') {
        alert("Firestore permission denied. Please check your Firestore rules.");
      } else {
        alert(`Error fetching custom products: ${error.message}`);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addCustomProduct = async (product: Product) => {
    if (!userId) {
      alert("You must be signed in with Google to save custom products to your account. Please sign in from the sidebar menu.");
      return;
    }
    try {
      const docRef = doc(db, `users/${userId}/customProducts`, product.id);
      await setDoc(docRef, product);
    } catch (error: any) {
      console.error("Error saving custom product: ", error);
      alert(`Error saving to database: ${error.message}. Please make sure you have created a Firestore Database in your Firebase Console.`);
    }
  };

  return { customProducts, loading, addCustomProduct };
}
