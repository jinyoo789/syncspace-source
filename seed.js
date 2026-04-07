import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

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

async function seed() {
  try {
    const rawData = fs.readFileSync('초기 데이터.txt', 'utf8');
    const data = JSON.parse(rawData);

    let tasksCount = 0;
    if (data.tasks) {
      for (const task of data.tasks) {
        if (!task.id) continue;
        await setDoc(doc(db, 'tasks', task.id), task);
        tasksCount++;
      }
    }

    let projsCount = 0;
    if (data.projs) {
      for (const proj of data.projs) {
        if (!proj.id) continue;
        await setDoc(doc(db, 'projects', proj.id), proj);
        projsCount++;
      }
    }

    console.log(`Seeding complete! Tasks: ${tasksCount}, Projects: ${projsCount}`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
