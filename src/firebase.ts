import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAlVFNR5QRINZ0icfDY-wy9LazCCCdT1uI",
  authDomain: "shreeganeshhardware.web.app",
  projectId: "sgh-quotation-builder-2025",
  storageBucket: "sgh-quotation-builder-2025.firebasestorage.app",
  messagingSenderId: "390780887748",
  appId: "1:390780887748:web:05770e064884767d5ddf91",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
