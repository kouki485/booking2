import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useBookings } from '../../hooks/useBookings';
import { updateAvailableHours } from '../../services/bookingService';

// 曜日の設定（定数として外部に移動）
const daysOfWeek = [
  { key: '月', label: '月曜日' },
  { key: '火', label: '火曜日' },
  { key: '水', label: '水曜日' },
  { key: '木', label: '木曜日' },
  { key: '金', label: '金曜日' },
  { key: '土', label: '土曜日' },
  { key: '日', label: '日曜日' }
];

const AvailableHours = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { 
    availableHours, 
    fetchAvailableHours, 
    loading, 
    error, 
    clearError 
  } = useBookings();

  const { 
    register, 
    handleSubmit, 
    setValue,
    watch
  } = useForm();

  // 時間オプション
  const timeOptions = [];
  for (let hour = 9; hour < 19; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  // 対応可能時間データの読み込み
  useEffect(() => {
    if (availableHours && Object.keys(availableHours).length > 0) {
      // フォームにデータを設定
      daysOfWeek.forEach(day => {
        const dayData = availableHours[day.key];
        if (dayData) {
          setValue(`${day.key}.start`, dayData.start);
          setValue(`${day.key}.end`, dayData.end);
          setValue(`${day.key}.isAvailable`, dayData.isAvailable);
        }
      });
    }
  }, [availableHours, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // フォーム送信
  const onSubmit = async (data) => {
    setIsSaving(true);
    
    try {
      await updateAvailableHours(data);
      setIsEditing(false);
      await fetchAvailableHours(); // 最新データを再読み込み
    } catch (error) {
      console.error('対応可能時間保存エラー:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 編集キャンセル
  const handleCancel = () => {
    setIsEditing(false);
    if (availableHours) {
      // 元のデータに戻す
      daysOfWeek.forEach(day => {
        const dayData = availableHours[day.key];
        if (dayData) {
          setValue(`${day.key}.start`, dayData.start);
          setValue(`${day.key}.end`, dayData.end);
          setValue(`${day.key}.isAvailable`, dayData.isAvailable);
        }
      });
    }
    clearError();
  };

  // 全日コピー機能
  const copyToAllDays = (sourceDay) => {
    const sourceData = watch(sourceDay);
    if (sourceData) {
      daysOfWeek.forEach(day => {
        if (day.key !== sourceDay) {
          setValue(`${day.key}.start`, sourceData.start);
          setValue(`${day.key}.end`, sourceData.end);
          setValue(`${day.key}.isAvailable`, sourceData.isAvailable);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">対応可能時間を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              対応可能時間設定
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              各曜日の予約を受け付けできる時間帯を30分単位で設定できます
            </p>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              編集する
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                キャンセル
              </button>
            </div>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 曜日別設定 */}
          <div className="space-y-4">
            {daysOfWeek.map((day, index) => {
              const isNotAvailable = !watch(`${day.key}.isAvailable`);
              
              return (
                <div key={day.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {day.label}
                    </h4>
                    
                    {isEditing && index === 0 && (
                      <button
                        type="button"
                        onClick={() => copyToAllDays(day.key)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        全曜日にコピー
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* 対応可能チェック */}
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register(`${day.key}.isAvailable`)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">対応可能</span>
                    </label>
                    
                    {/* 開始時間 */}
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <select
                        {...register(`${day.key}.start`)}
                        disabled={!isEditing || isNotAvailable}
                        className="block w-24 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    
                    <span className="text-sm text-gray-500">〜</span>
                    
                    {/* 終了時間 */}
                    <div className="flex items-center space-x-2">
                      <select
                        {...register(`${day.key}.end`)}
                        disabled={!isEditing || isNotAvailable}
                        className="block w-24 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* 現在の設定表示 */}
                  {!isEditing && (
                    <div className="mt-2 text-sm text-gray-600">
                      {availableHours[day.key]?.isAvailable ? (
                        `${availableHours[day.key]?.start} 〜 ${availableHours[day.key]?.end}`
                      ) : (
                        <span className="text-gray-400">対応不可</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 保存ボタン */}
          {isEditing && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  '保存する'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AvailableHours; 