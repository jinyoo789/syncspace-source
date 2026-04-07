import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB4PvggDSj5a3BFjFc43XEMBmmetX8NeC0",
  authDomain: "syncspace-4acb4.firebaseapp.com",
  projectId: "syncspace-4acb4",
  storageBucket: "syncspace-4acb4.firebasestorage.app",
  messagingSenderId: "633194399757",
  appId: "1:633194399757:web:35da823b5f19386ea5ed44",
  measurementId: "G-L23XT1KHT7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const tasks = await getDocs(collection(db, 'tasks'));
  const projects = await getDocs(collection(db, 'projects'));
  console.log('Tasks:', tasks.docs.length);
  console.log('Projects:', projects.docs.length);
  process.exit(0);
}
check();
