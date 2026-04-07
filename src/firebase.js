import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB4PvggDSj5a3BFjFc43XEMBmmetX8NeC0",
  authDomain: "syncspace-4acb4.firebaseapp.com",
  projectId: "syncspace-4acb4",
  storageBucket: "syncspace-4acb4.firebasestorage.app",
  messagingSenderId: "633194399757",
  appId: "1:633194399757:web:35da823b5f19386ea5ed44",
  measurementId: "G-L23XT1KHT7"
};

// HMR에서 중복 초기화를 방지
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let db;
try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch (e) {
  // 이미 초기화된 경우 (HMR 등)
  db = getFirestore(app);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { db };

