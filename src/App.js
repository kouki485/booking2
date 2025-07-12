import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeData } from './utils/initData';
import Layout from './components/common/Layout';
import BookingForm from './components/booking/BookingForm';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import { AuthProvider, useAuth } from './hooks/useAuth';

function AppContent() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const { loading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('アプリケーションの初期化を開始します...');
        await initializeData();
        console.log('アプリケーションの初期化が完了しました');
        setIsInitialized(true);
      } catch (error) {
        console.warn('初期化でエラーが発生しました:', error);
        setInitError(error.message);
        // エラーが発生してもアプリケーションを開始
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // 認証状態を読み込み中
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App min-h-screen bg-gray-50">
        {initError && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 m-4 rounded">
            <strong>注意:</strong> 初期化中にエラーが発生しましたが、アプリケーションは動作します。
            <br />
            <small>{initError}</small>
          </div>
        )}
        
        <Routes>
          {/* 公開ルート：予約ページ */}
          <Route 
            path="/" 
            element={
              <Layout>
                <BookingForm />
              </Layout>
            } 
          />
          
          {/* 管理者ログインページ */}
          <Route 
            path="/admin/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/admin" replace />
              ) : (
                <AdminLogin />
              )
            } 
          />
          
          {/* 管理者ダッシュボード（認証が必要） */}
          <Route 
            path="/admin" 
            element={
              isAuthenticated && user ? (
                <Layout>
                  <AdminDashboard />
                </Layout>
              ) : (
                <Navigate to="/admin/login" replace />
              )
            } 
          />
          
          {/* 存在しないパスは予約ページにリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 