// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCLouQiPR2Qbx2E36C-3g18NRZb1t9rdcM",
  authDomain: "gestion-conge-1e2f6.firebaseapp.com",
  databaseURL: "https://gestion-conge-1e2f6-default-rtdb.firebaseio.com",
  projectId: "gestion-conge-1e2f6",
  storageBucket: "gestion-conge-1e2f6.firebasestorage.app",
  messagingSenderId: "570693444796",
  appId: "1:570693444796:web:a436bbdcf7c56fce601cb9",
  measurementId: "G-FJQX29TG54",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
