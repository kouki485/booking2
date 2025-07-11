import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsAuthenticated } = useAuth();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm();

  // 固定の認証情報
  const ADMIN_LOGIN_ID = 'admin';
  const ADMIN_PASSWORD = 'p7KRZ69e';

  // ログインフォーム送信
  const onSubmit = async (data) => {
    setIsLoading(true);
    setLoginError('');

    try {
      // 固定のログインIDとパスワードをチェック
      if (data.loginId === ADMIN_LOGIN_ID && data.password === ADMIN_PASSWORD) {
        // 認証成功
        console.log('認証成功 - ローカルストレージ保存');
        localStorage.setItem('isAdminLoggedIn', 'true');
        
        // 認証状態を更新
        setIsAuthenticated(true);
        
        console.log('管理画面に強制リダイレクト実行');
        // window.location.hrefを使用して確実にリダイレクト
        window.location.href = '/admin';
        
      } else {
        // 認証失敗
        console.log('認証失敗');
        setLoginError('ログインIDまたはパスワードが間違っています');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      setLoginError('ログイン処理中にエラーが発生しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            予約管理システム
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            管理者ログイン
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* エラー表示 */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{loginError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                ログインID
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  {...register('loginId', {
                    required: 'ログインIDを入力してください'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="test@example.com"
                />
                {errors.loginId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.loginId.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'パスワードを入力してください'
                  })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 