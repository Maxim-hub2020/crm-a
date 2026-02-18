import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import app from "./config";

let auth, db, storage;

if (app) {
    try {
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } catch (e) {
        console.error("Firebase services initialization error:", e);
    }
} else {
    console.error("Firebase app is not initialized. Services cannot be initialized.");
}

export { auth, db, storage };
