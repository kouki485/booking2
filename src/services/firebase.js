import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyBmQRFG7eGXcP0qRbcKRPc6uEeuPk5Ajp4",
  authDomain: "booking-5a17b.firebaseapp.com",
  projectId: "booking-5a17b",
  storageBucket: "booking-5a17b.appspot.com",
  messagingSenderId: "1006309665015",
  appId: "1:1006309665015:web:fd2f1bb60bffa2e1970bf2"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Firestore初期化
export const db = getFirestore(app);

// Authentication初期化
export const auth = getAuth(app);

// Functions初期化
export const functions = getFunctions(app);

// 開発環境でのエミュレーター接続（一時的に無効化）
// エミュレーターの設定問題を回避するため、一時的にコメントアウト
/*
if (process.env.NODE_ENV === 'development' && !window.FIREBASE_EMULATOR_CONNECTED) {
  try {
    // Firestoreエミュレーター
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Authエミュレーター
    connectAuthEmulator(auth, 'http://localhost:9099');
    
    // Functionsエミュレーター
    connectFunctionsEmulator(functions, 'localhost', 5001);
    
    window.FIREBASE_EMULATOR_CONNECTED = true;
    console.log('Firebase エミュレーターに接続しました');
  } catch (error) {
    console.log('Firebase エミュレーター接続をスキップしました:', error.message);
  }
}
*/

export default app; 