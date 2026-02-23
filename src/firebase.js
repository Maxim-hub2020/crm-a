import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
    apiKey: "AIzaSyDl3vMtK203-TTFJ9KiVx7eHCVoAP1f_X4",
    authDomain: "crm-a-65f00.firebaseapp.com",
    projectId: "crm-a-65f00",
    storageBucket: "crm-a-65f00.appspot.com",
    messagingSenderId: "427479091195",
    appId: "1:427479091195:web:fa3cd7b4c5c7dc9a42ad5e",
    measurementId: "G-R0CNPHZ5R9"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const appId = 'crm-pro-v1';
export default app;
