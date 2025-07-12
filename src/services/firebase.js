import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase設定（環境変数またはデフォルト値を使用）
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBmQRFG7eGXcP0qRbcKRPc6uEeuPk5Ajp4",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "booking-5a17b.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "booking-5a17b",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "booking-5a17b.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1006309665015",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1006309665015:web:fd2f1bb60bffa2e1970bf2",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-WJ8X8VX1GK"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Firestore初期化
export const db = getFirestore(app);

// Authentication初期化
export const auth = getAuth(app);

// Functions初期化
export const functions = getFunctions(app);

// 開発環境でのエミュレーター接続
if (process.env.NODE_ENV === 'development' && !window.FIREBASE_EMULATOR_CONNECTED) {
  try {
    // エミュレーターが起動している場合のみ接続
    if (process.env.REACT_APP_USE_EMULATOR === 'true') {
      // Firestoreエミュレーター
      connectFirestoreEmulator(db, 'localhost', 8080);
      
      // Authエミュレーター
      connectAuthEmulator(auth, 'http://localhost:9099');
      
      // Functionsエミュレーター
      connectFunctionsEmulator(functions, 'localhost', 5001);
      
      window.FIREBASE_EMULATOR_CONNECTED = true;
      console.log('Firebase エミュレーターに接続しました');
    }
  } catch (error) {
    console.log('Firebase エミュレーター接続をスキップしました:', error.message);
  }
}

export default app; 