import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_pFeG8w1ibMnKutPutxmiNpIA_w1Rnac",
  authDomain: "farm-fresh-dairy-f5e49.firebaseapp.com",
  projectId: "farm-fresh-dairy-f5e49",
  storageBucket: "farm-fresh-dairy-f5e49.firebasestorage.app",
  messagingSenderId: "863617761513",
  appId: "1:863617761513:web:5487437a3569fac5393078",
  measurementId: "G-Y3BT2T5KKS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db =  getFirestore(app);