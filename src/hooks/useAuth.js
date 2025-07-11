import { useState, useEffect } from 'react';
import { 
  onAuthChange, 
  loginWithEmail, 
  logout, 
  createAdminAccount, 
  sendPasswordReset,
  getCurrentUser,
  isAdmin 
} from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 認証状態の監視
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    // クリーンアップ
    return () => unsubscribe();
  }, []);

  // ログイン
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = await loginWithEmail(email, password);
      
      if (result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'ログインに失敗しました';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const handleLogout = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await logout();
      
      if (result.success) {
        setUser(null);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'ログアウトに失敗しました';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 管理者アカウント作成
  const createAdmin = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createAdminAccount(email, password);
      
      if (result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'アカウント作成に失敗しました';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセット
  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);

    try {
      const result = await sendPasswordReset(email);
      
      if (result.success) {
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'パスワードリセットに失敗しました';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // エラーをクリア
  const clearError = () => {
    setError(null);
  };

  return {
    // 状態
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdminUser: isAdmin(user),
    
    // アクション
    login,
    logout: handleLogout,
    createAdmin,
    resetPassword,
    clearError
  };
}; 