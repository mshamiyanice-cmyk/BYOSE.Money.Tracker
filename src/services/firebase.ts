
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCmfXnPB-FoADDUo84yzj8tXOQG0-NFrpw",
  authDomain: "byose-money-tracker.firebaseapp.com",
  projectId: "byose-money-tracker",
  storageBucket: "byose-money-tracker.firebasestorage.app",
  messagingSenderId: "507336533766",
  appId: "1:507336533766:web:e149d2a36241f7b2536087",
  measurementId: "G-5MT5ZPP4CD"
};

// Singleton initialization
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Exporting services from the initialized app instance for robustness
export const auth = app.auth();
export const db = app.firestore();

export default firebase;
