// ============================================================
// SILVER X TRADER — Firebase Configuration
// BUILD: 22.0 SECURE PRODUCTION
// ============================================================
// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCFeZCVi3bnRYlL78M4vIAe4h-_3a0VRyU",
  authDomain: "silver-x-trader.firebaseapp.com",
  projectId: "silver-x-trader",
  storageBucket: "silver-x-trader.firebasestorage.app",
  messagingSenderId: "239715343845",
  appId: "1:239715343845:web:a72cce9be116b1d0ae230c",
  measurementId: "G-Z1D1NSRKCV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Export for use in other files
window.db = db;
