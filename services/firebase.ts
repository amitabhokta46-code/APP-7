
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5hHFOMKxfMDPn75HEbms6iddMOXw9uQA",
  authDomain: "my-lifeline-52d3b.firebaseapp.com",
  projectId: "my-lifeline-52d3b",
  storageBucket: "my-lifeline-52d3b.firebasestorage.app",
  messagingSenderId: "369903801821",
  appId: "1:369903801821:web:f365b82ab3ca9a4d68d234"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
