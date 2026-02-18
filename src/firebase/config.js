import { initializeApp, getApps, getApp } from "firebase/app";

export const firebaseConfig = {
    apiKey: "AIzaSyDl3vMtK203-TTFJ9KiVx7eHCVoAP1f_X4",
    authDomain: "crm-a-65f00.firebaseapp.com",
    projectId: "crm-a-65f00",
    storageBucket: "crm-a-65f00.appspot.com",
    messagingSenderId: "427479091195",
    appId: "1:427479091195:web:fa3cd7b4c5c7dc9a42ad5e",
    measurementId: "G-R0CNPHZ5R9"
};

let app;
try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
    console.error("Firebase initialization error:", e);
}

export default app;
