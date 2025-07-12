import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthChange, logout as firebaseLogout, getCurrentUser } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Authenticationの状態を監視
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      setLoading(false);
      
      // ローカルストレージも更新（後方互換性のため）
      if (user) {
        localStorage.setItem('isAdminLoggedIn', 'true');
      } else {
        localStorage.removeItem('isAdminLoggedIn');
      }
    });

    return unsubscribe;
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('isAdminLoggedIn', 'true');
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('isAdminLoggedIn');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 