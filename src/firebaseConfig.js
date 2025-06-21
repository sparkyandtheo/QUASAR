// src/firebaseConfig.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <-- This line was likely missing
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPOPlL3RGrsptIP5pXkK508XV8ZXMbOWM",
  authDomain: "planar-alliance-448817-h0.firebaseapp.com",
  projectId: "planar-alliance-448817-h0",
  storageBucket: "planar-alliance-448817-h0.firebasestorage.app",
  messagingSenderId: "1049899901887",
  appId: "1:1049899901887:web:dfee63f34773941aafb70a",
  measurementId: "G-WX52CNVL14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and export Firestore so we can use it elsewhere
export const db = getFirestore(app); // <-- And this "export" line was likely missing