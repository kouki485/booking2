import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail, createAdminAccount } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Firebase Authenticationでログイン
      const result = await loginWithEmail(formData.email, formData.password);
      
      if (result.success) {
        // ログイン成功
        login(result.user);
        navigate('/admin');
      } else {
        setError(result.error || 'ログインに失敗しました');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('ログインエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 新しい管理者アカウントを作成
      const result = await createAdminAccount(formData.email, formData.password);
      
      if (result.success) {
        // アカウント作成成功
        login(result.user);
        navigate('/admin');
      } else {
        setError(result.error || 'アカウント作成に失敗しました');
      }
    } catch (error) {
      console.error('Account creation error:', error);
      setError('アカウント作成エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showCreateAccount ? '管理者アカウント作成' : '管理者ログイン'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showCreateAccount 
              ? '新しい管理者アカウントを作成してください' 
              : '管理機能にアクセスするにはログインが必要です'
            }
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={showCreateAccount ? handleCreateAccount : handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 
                (showCreateAccount ? 'アカウント作成中...' : 'ログイン中...') : 
                (showCreateAccount ? 'アカウント作成' : 'ログイン')
              }
            </button>
          </div>

          <div className="text-sm text-center">
            <button
              type="button"
              onClick={() => {
                setShowCreateAccount(!showCreateAccount);
                setError('');
              }}
              className="text-blue-600 hover:text-blue-500"
            >
              {showCreateAccount ? 'ログインに戻る' : '新しい管理者アカウントを作成'}
            </button>
          </div>

          {/* テスト用のサンプルアカウント情報 */}
          <div className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-md">
            <p className="font-medium mb-1">テスト用アカウント:</p>
            <p>メール: admin@example.com</p>
            <p>パスワード: admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
} 