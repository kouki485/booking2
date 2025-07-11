import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * メールアドレスとパスワードでログイン
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error.code) 
    };
  }
};

/**
 * ログアウト
 */
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error.code) 
    };
  }
};

/**
 * 新規管理者アカウント作成（初期設定用）
 */
export const createAdminAccount = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error.code) 
    };
  }
};

/**
 * パスワードリセットメール送信
 */
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error.code) 
    };
  }
};

/**
 * 認証状態の監視
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * 現在のユーザーを取得
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * 管理者かどうかを確認
 * 簡単な実装：認証済みユーザーは全て管理者とする
 * 本格運用時はFirestoreでロール管理を実装
 */
export const isAdmin = (user) => {
  return user !== null;
};

/**
 * エラーメッセージの日本語化
 */
const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'ユーザーが見つかりません';
    case 'auth/wrong-password':
      return 'パスワードが間違っています';
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません';
    case 'auth/user-disabled':
      return 'このアカウントは無効化されています';
    case 'auth/too-many-requests':
      return 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください';
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に使用されています';
    case 'auth/weak-password':
      return 'パスワードは6文字以上で設定してください';
    case 'auth/network-request-failed':
      return 'ネットワークエラーが発生しました';
    default:
      return 'ログインに失敗しました';
  }
}; 