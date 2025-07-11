import React from 'react';
import { formatDateWithWeekday, formatTimeRange } from '../../utils/dateUtils';

const BookingConfirm = ({ 
  selectedDate, 
  selectedTime, 
  customerName, 
  onConfirm, 
  onBack, 
  isSubmitting 
}) => {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          予約内容をご確認ください
        </h2>
        <p className="text-gray-600 text-sm">
          内容に間違いがなければ「予約を確定する」ボタンを押してください
        </p>
      </div>

      {/* 予約内容カード */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-salon-700 font-semibold mb-4 border-b border-salon-200 pb-2">
          📋 予約詳細
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-16 text-sm text-gray-600 font-medium">日時:</div>
            <div className="text-gray-900">
              <div className="font-medium">
                📅 {formatDateWithWeekday(selectedDate)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                🕐 {formatTimeRange(selectedTime)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-16 text-sm text-gray-600 font-medium">お名前:</div>
            <div className="text-gray-900 font-medium">
              👤 {customerName}
            </div>
          </div>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="text-blue-800 font-medium text-sm mb-2">
          ⚠️ ご確認ください
        </h4>
        <ul className="text-blue-700 text-xs space-y-1">
          <li>• 予約確定後のキャンセルは店舗まで直接お電話ください</li>
          <li>• 時間に余裕を持ってお越しください</li>
          <li>• 当日の体調管理にご注意ください</li>
        </ul>
      </div>

      {/* アクションボタン */}
      <div className="space-y-3">
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="btn-primary w-full"
        >
          {isSubmitting ? '予約確定中...' : '✅ 予約を確定する'}
        </button>
        
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="btn-secondary w-full"
        >
          ← 内容を修正する
        </button>
      </div>
    </div>
  );
};

export default BookingConfirm; 