//------------------------------------------------------------
// firebase.js (Firebase initialization - placeholder)
//------------------------------------------------------------
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  // TODO: Replace with your firebase config
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
};
