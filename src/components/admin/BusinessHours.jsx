import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useBookings } from '../../hooks/useBookings';

const BusinessHours = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { 
    businessHours, 
    loadBusinessHours, 
    saveBusinessHours, 
    loading, 
    error, 
    clearError 
  } = useBookings();

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    setValue,
    watch
  } = useForm();

  // 曜日の設定
  const daysOfWeek = [
    { key: 'monday', label: '月曜日' },
    { key: 'tuesday', label: '火曜日' },
    { key: 'wednesday', label: '水曜日' },
    { key: 'thursday', label: '木曜日' },
    { key: 'friday', label: '金曜日' },
    { key: 'saturday', label: '土曜日' },
    { key: 'sunday', label: '日曜日' }
  ];

  // 時間オプション
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  // 営業時間データの読み込み
  useEffect(() => {
    if (businessHours) {
      // フォームにデータを設定
      daysOfWeek.forEach(day => {
        const dayData = businessHours[day.key];
        if (dayData) {
          setValue(`${day.key}.open`, dayData.open);
          setValue(`${day.key}.close`, dayData.close);
          setValue(`${day.key}.closed`, dayData.closed);
        }
      });
    }
  }, [businessHours, setValue]);

  // フォーム送信
  const onSubmit = async (data) => {
    setIsSaving(true);
    
    try {
      const result = await saveBusinessHours(data);
      
      if (result.success) {
        setIsEditing(false);
        await loadBusinessHours(); // 最新データを再読み込み
      }
    } catch (error) {
      console.error('営業時間保存エラー:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 編集キャンセル
  const handleCancel = () => {
    setIsEditing(false);
    if (businessHours) {
      // 元のデータに戻す
      daysOfWeek.forEach(day => {
        const dayData = businessHours[day.key];
        if (dayData) {
          setValue(`${day.key}.open`, dayData.open);
          setValue(`${day.key}.close`, dayData.close);
          setValue(`${day.key}.closed`, dayData.closed);
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
          setValue(`${day.key}.open`, sourceData.open);
          setValue(`${day.key}.close`, sourceData.close);
          setValue(`${day.key}.closed`, sourceData.closed);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-salon-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">営業時間を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              営業時間設定
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              各曜日の営業時間を30分単位で設定できます
            </p>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              編集する
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="btn-secondary"
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
              const isClosed = watch(`${day.key}.closed`);
              
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
                        className="text-xs text-salon-600 hover:text-salon-800"
                      >
                        全曜日にコピー
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* 休業日チェック */}
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register(`${day.key}.closed`)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-salon-600 shadow-sm focus:border-salon-500 focus:ring-salon-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">休業日</span>
                    </label>

                    {/* 営業時間 */}
                    {!isClosed && (
                      <>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <select
                            {...register(`${day.key}.open`, {
                              required: !isClosed ? '開店時間を選択してください' : false
                            })}
                            disabled={!isEditing || isClosed}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-salon-500 focus:ring-salon-500"
                          >
                            <option value="">開店時間</option>
                            {timeOptions.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                          
                          <span className="text-gray-500">〜</span>
                          
                          <select
                            {...register(`${day.key}.close`, {
                              required: !isClosed ? '閉店時間を選択してください' : false
                            })}
                            disabled={!isEditing || isClosed}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-salon-500 focus:ring-salon-500"
                          >
                            <option value="">閉店時間</option>
                            {timeOptions.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* エラー表示 */}
                  {errors[day.key]?.open && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[day.key].open.message}
                    </p>
                  )}
                  {errors[day.key]?.close && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[day.key].close.message}
                    </p>
                  )}
                  
                  {/* 現在の設定表示（編集中でない場合） */}
                  {!isEditing && businessHours && businessHours[day.key] && (
                    <div className="mt-2 text-sm text-gray-600">
                      {businessHours[day.key].closed ? (
                        <span className="text-red-600">休業日</span>
                      ) : (
                        <span>
                          {businessHours[day.key].open} 〜 {businessHours[day.key].close}
                        </span>
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
                className="btn-primary"
              >
                {isSaving ? '保存中...' : '営業時間を保存'}
              </button>
            </div>
          )}
        </form>

        {/* 注意事項 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ClockIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                営業時間設定について
              </h4>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>営業時間は30分単位で設定してください</li>
                  <li>休業日に設定した曜日は予約を受け付けません</li>
                  <li>設定変更後は既存の予約に影響する可能性があります</li>
                  <li>各時間帯は最大3名まで予約を受け付けます</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHours; 