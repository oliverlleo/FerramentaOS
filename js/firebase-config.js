// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCB8ye34UIkBghExod4JlBV3oqge5oM2Ic",
    authDomain: "ferramentas-perfecta.firebaseapp.com",
    projectId: "ferramentas-perfecta",
    storageBucket: "ferramentas-perfecta.firebasestorage.app",
    messagingSenderId: "550722056346",
    appId: "1:550722056346:web:5076a97aca7fe276af6f23",
    measurementId: "G-8YKBJLSSL6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, signInWithEmailAndPassword, signOut, onAuthStateChanged };

