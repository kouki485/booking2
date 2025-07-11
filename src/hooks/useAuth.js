import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージから認証状態を確認
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    console.log('useAuth初期化:', { isLoggedIn, localStorage: localStorage.getItem('isAdminLoggedIn') });
    setIsAuthenticated(isLoggedIn);
    setLoading(false);
  }, []);

  // ログアウト
  const logout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setIsAuthenticated(false);
  };

  const handleSetIsAuthenticated = (value) => {
    console.log('setIsAuthenticated呼び出し:', value);
    setIsAuthenticated(value);
  };

  return {
    // 状態
    isAuthenticated,
    loading,
    isAdminUser: isAuthenticated,
    
    // アクション
    setIsAuthenticated: handleSetIsAuthenticated,
    logout
  };
}; 