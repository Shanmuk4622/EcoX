
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBgVSzyu1eBhxfA3plxGrnrpgqUcUhVqRM",
  authDomain: "studio-5053909228-90740.firebaseapp.com",
  projectId: "studio-5053909228-90740",
  storageBucket: "studio-5053909228-90740.firebasestorage.app",
  messagingSenderId: "627075700913",
  appId: "1:627075700913:web:fdd0d73e2ecbf35bf6aa90"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const db = getFirestore(app);

export { db };
