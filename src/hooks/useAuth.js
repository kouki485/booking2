import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージから認証状態を確認
    const checkAuthStatus = () => {
      const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
      console.log('認証状態確認:', { 
        isLoggedIn, 
        localStorage: localStorage.getItem('isAdminLoggedIn'),
        currentPath: window.location.pathname 
      });
      setIsAuthenticated(isLoggedIn);
      setLoading(false);
    };

    // 初期チェック（少し遅延を入れてローカルストレージの準備を確実にする）
    const timer = setTimeout(checkAuthStatus, 50);

    // ローカルストレージの変更を監視
    const handleStorageChange = (e) => {
      if (e.key === 'isAdminLoggedIn') {
        console.log('ローカルストレージ変更検知:', e.newValue);
        setIsAuthenticated(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ログアウト
  const logout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setIsAuthenticated(false);
  };

  const handleSetIsAuthenticated = (value) => {
    console.log('setIsAuthenticated呼び出し:', value);
    if (value) {
      // 認証成功時はローカルストレージも確実に設定
      localStorage.setItem('isAdminLoggedIn', 'true');
    }
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