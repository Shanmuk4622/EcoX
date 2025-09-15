// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "studio-5053909228-90740",
  appId: "1:627075700913:web:fdd0d73e2ecbf35bf6aa90",
  storageBucket: "studio-5053909228-90740.firebasestorage.app",
  apiKey: "AIzaSyBgVSzyu1eBhxfA3plxGrnrpgqUcUhVqRM",
  authDomain: "studio-5053909228-90740.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "627075700913"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);

export { app, firestore };
