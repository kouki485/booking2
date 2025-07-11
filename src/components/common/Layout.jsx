import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const Layout = ({ children, showAdminLink = false }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴ・タイトル */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="text-xl font-bold text-salon-600 hover:text-salon-700"
              >
                美容院 予約システム
              </Link>
            </div>

            {/* ナビゲーション */}
            <div className="flex items-center space-x-4">
              {/* 管理者ページへのリンク（公開ページから） */}
              {showAdminLink && !isAuthenticated && (
                <Link
                  to="/admin/login"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <Cog6ToothIcon className="w-4 h-4 mr-2" />
                  管理者ログイン
                </Link>
              )}

              {/* 認証済みユーザー情報 */}
              {isAuthenticated && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <UserIcon className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">
                      管理者
                    </span>
                  </div>
                  
                  {/* 管理者ダッシュボードへのリンク */}
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-3 py-2 border border-salon-300 rounded-md text-sm font-medium text-salon-700 bg-salon-50 hover:bg-salon-100 transition-colors duration-200"
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-2" />
                    管理画面
                  </Link>
                  
                  {/* ログアウトボタン */}
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              © 2025 美容院予約システム. All rights reserved.
            </p>
            <p className="mt-1">
              予約に関するお問い合わせは店舗まで直接お電話ください。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 