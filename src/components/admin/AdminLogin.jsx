import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const { login, createAdmin, resetPassword, loading, error, clearError } = useAuth();
  
  const { 
    register: registerLogin, 
    handleSubmit: handleLoginSubmit, 
    formState: { errors: loginErrors }, 
    reset: resetLogin 
  } = useForm();
  
  const { 
    register: registerCreate, 
    handleSubmit: handleCreateSubmit, 
    formState: { errors: createErrors }, 
    reset: resetCreate 
  } = useForm();

  // ログインフォーム送信
  const onLoginSubmit = async (data) => {
    clearError();
    const result = await login(data.email, data.password);
    
    if (!result.success) {
      // エラーは useAuth フックで管理されている
    }
  };

  // 管理者アカウント作成フォーム送信
  const onCreateSubmit = async (data) => {
    clearError();
    
    if (data.password !== data.confirmPassword) {
      alert('パスワードが一致しません');
      return;
    }
    
    const result = await createAdmin(data.email, data.password);
    
    if (result.success) {
      setShowCreateAdmin(false);
      resetCreate();
    }
  };

  // パスワードリセット
  const handlePasswordReset = async () => {
    const email = prompt('パスワードリセット用のメールアドレスを入力してください:');
    if (email) {
      const result = await resetPassword(email);
      if (result.success) {
        alert('パスワードリセットメールを送信しました');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            美容院 管理システム
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            管理者ログイン
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {!showCreateAdmin ? (
            <>
              {/* ログインフォーム */}
              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-6">
                {/* エラー表示 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    メールアドレス
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      {...registerLogin('email', {
                        required: 'メールアドレスを入力してください',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: '正しいメールアドレスを入力してください'
                        }
                      })}
                      className="input-field"
                      placeholder="admin@example.com"
                    />
                    {loginErrors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {loginErrors.email.message}
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
                      {...registerLogin('password', {
                        required: 'パスワードを入力してください',
                        minLength: {
                          value: 6,
                          message: 'パスワードは6文字以上で入力してください'
                        }
                      })}
                      className="input-field pr-10"
                      placeholder="パスワード"
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
                    {loginErrors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {loginErrors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'ログイン中...' : 'ログイン'}
                  </button>
                </div>
              </form>

              {/* パスワードリセット・アカウント作成 */}
              <div className="mt-6">
                <div className="flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-sm text-salon-600 hover:text-salon-500"
                  >
                    パスワードを忘れた場合
                  </button>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-600 mb-2">
                      初回設定の場合
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCreateAdmin(true)}
                      className="btn-secondary w-full text-sm"
                    >
                      管理者アカウントを作成
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 管理者アカウント作成フォーム */}
              <div className="mb-4">
                <button
                  onClick={() => setShowCreateAdmin(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  ← ログインに戻る
                </button>
              </div>

              <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    管理者アカウント作成
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    初回設定用のアカウント作成
                  </p>
                </div>

                {/* エラー表示 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    メールアドレス
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      {...registerCreate('email', {
                        required: 'メールアドレスを入力してください',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: '正しいメールアドレスを入力してください'
                        }
                      })}
                      className="input-field"
                      placeholder="admin@example.com"
                    />
                    {createErrors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {createErrors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    パスワード
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      {...registerCreate('password', {
                        required: 'パスワードを入力してください',
                        minLength: {
                          value: 6,
                          message: 'パスワードは6文字以上で入力してください'
                        }
                      })}
                      className="input-field"
                      placeholder="パスワード（6文字以上）"
                    />
                    {createErrors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {createErrors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    パスワード確認
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      {...registerCreate('confirmPassword', {
                        required: 'パスワード確認を入力してください'
                      })}
                      className="input-field"
                      placeholder="パスワード再入力"
                    />
                    {createErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">
                        {createErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'アカウント作成中...' : 'アカウント作成'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 