// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCB8ye34UIkBghExod4JlBV3oqge5oM2Ic",
  authDomain: "ferramentas-perfecta.firebaseapp.com",
  databaseURL: "https://ferramentas-perfecta-default-rtdb.firebaseio.com",
  projectId: "ferramentas-perfecta",
  storageBucket: "ferramentas-perfecta.firebasestorage.app",
  messagingSenderId: "550722056346",
  appId: "1:550722056346:web:5076a97aca7fe276af6f23",
  measurementId: "G-8YKBJLSSL6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Database reference
const database = firebase.database();
const toolsRef = database.ref('ferramentas');
const customPagesRef = database.ref('customPages');

// Export for global access
window.Firebase = {
  database,
  toolsRef,
  customPagesRef,
  timestamp: firebase.database.ServerValue.TIMESTAMP
};

console.log('🔥 Firebase initialized successfully');

