import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useBookings } from '../../hooks/useBookings';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const BookingForm = () => {
  const [step, setStep] = useState(1); // 1: 日程選択, 2: 情報入力, 3: 確認, 4: 完了
  const [currentWeek, setCurrentWeek] = useState(() => {
    // 今日の日付から始まる週を設定
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingStatuses, setBookingStatuses] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  const { addBooking, getBookingStatus: getBookingStatusAPI, loading, error, clearError } = useBookings();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset 
  } = useForm();

  // 週の日付を生成（今日以降のみ）
  const generateWeekDates = (startDate) => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 今日の日付から7日間を生成
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = generateWeekDates(currentWeek);

  // 曜日の名前を取得
  const getDayName = (date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  // 時間スロットを生成
  const timeSlots = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  // 予約状況を取得
  useEffect(() => {
    const loadBookingStatuses = async () => {
      const statuses = {};
      const currentWeekDates = generateWeekDates(currentWeek);
      
      for (const date of currentWeekDates) {
        const dateStr = date.toISOString().split('T')[0];
        statuses[dateStr] = {};
        
        for (const time of timeSlots) {
          try {
            const status = await getBookingStatusAPI(date, time);
            statuses[dateStr][time] = status;
          } catch (error) {
            console.error('予約状況取得エラー:', error);
            statuses[dateStr][time] = 'available';
          }
        }
      }
      
      setBookingStatuses(statuses);
    };

    loadBookingStatuses();
  }, [currentWeek, getBookingStatusAPI]); // eslint-disable-line react-hooks/exhaustive-deps

  // 週の表示テキストを生成
  const getWeekText = (dates) => {
    if (dates.length === 0) return '';
    
    const start = dates[0];
    const end = dates[6];
    const startMonth = start.getMonth() + 1;
    const startDay = start.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();
    
    return `${start.getFullYear()}-${startMonth.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')} ~ ${end.getFullYear()}-${endMonth.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`;
  };

  // 前の週へ移動
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    
    // 今日より前には戻れないように制限
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newWeek >= today) {
      setCurrentWeek(newWeek);
    }
  };

  // 次の週へ移動
  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  // 日時選択ハンドラ
  const handleTimeSlotClick = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  // 次のステップへ進む
  const goToNextStep = () => {
    if (step === 1 && selectedDate && selectedTime) {
      setStep(2);
    }
  };

  // 前のステップに戻る
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // フォーム送信
  const onSubmit = async (data) => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    
    const bookingData = {
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      customerName: data.customerName.trim()
    };

    try {
      const result = await addBooking(bookingData);
      
      if (result.success) {
        setBookingResult({
          success: true,
          bookingId: result.id,
          ...bookingData
        });
        setStep(4);
      } else {
        setBookingResult({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      setBookingResult({
        success: false,
        error: '予約の作成に失敗しました'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 最初からやり直し
  const handleRestart = () => {
    setStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setBookingResult(null);
    reset();
    clearError();
  };

  // 予約履歴を表示
  const handleShowHistory = () => {
    setShowHistory(true);
  };

  // 予約履歴を閉じる
  const handleCloseHistory = () => {
    setShowHistory(false);
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3">
        <div className="flex items-center justify-center">
          <h1 className="text-base sm:text-lg font-medium text-gray-900">予約ページ</h1>
        </div>
      </div>

      {/* 予約履歴ボタン */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex justify-end">
          <button 
            className="flex items-center text-xs sm:text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-2 sm:px-3 py-1 transition-colors"
            onClick={handleShowHistory}
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            予約履歴
          </button>
        </div>
      </div>

      {/* ステップインジケーター */}
      <div className="bg-white px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
              </div>
              <span className={`text-xs mt-1 text-center ${
                step >= 1 ? 'text-green-600 font-medium' : 'text-gray-500'
              }`}>
                日程選択
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
              </div>
              <span className={`text-xs mt-1 text-center ${
                step >= 2 ? 'text-green-600 font-medium' : 'text-gray-500'
              }`}>
                情報入力
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
              </div>
              <span className={`text-xs mt-1 text-center ${
                step >= 3 ? 'text-green-600 font-medium' : 'text-gray-500'
              }`}>
                確認
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                step >= 4 ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
              </div>
              <span className={`text-xs mt-1 text-center ${
                step >= 4 ? 'text-green-600 font-medium' : 'text-gray-500'
              }`}>
                完了
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-3 sm:px-4 pb-20">
        {/* ステップ1: 日程選択 */}
        {step === 1 && (
          <div className="space-y-4">
            {/* 週選択 */}
            <div className="bg-green-500 text-white rounded-lg px-3 sm:px-4 py-3 flex items-center justify-between">
              <button 
                onClick={goToPreviousWeek} 
                className={`p-1 rounded ${
                  (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    return currentWeek <= today 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-green-600';
                  })()
                }`}
                disabled={(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  return currentWeek <= today;
                })()}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <span className="font-medium text-sm sm:text-base text-center flex-1 mx-2">
                {getWeekText(weekDates)}
              </span>
              <button onClick={goToNextWeek} className="p-1 hover:bg-green-600 rounded">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            {/* カレンダーグリッド */}
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
              {/* 曜日・日付ヘッダー */}
              <div className="grid grid-cols-8 border-b border-gray-200 min-w-[480px]">
                <div className="p-1 sm:p-2 w-14 sm:w-16 bg-gray-50"></div>
                {weekDates.map((date, index) => (
                  <div 
                    key={index} 
                    className={`p-1 sm:p-2 text-center border-r border-gray-200 last:border-r-0 flex-1 min-w-[50px] sm:min-w-[60px] ${
                      date.getDay() === 6 ? 'bg-blue-50' : 
                      date.getDay() === 0 ? 'bg-red-50' : 
                      'bg-gray-50'
                    }`}
                  >
                    <div className={`text-xs font-medium ${
                      date.getDay() === 6 ? 'text-blue-600' : 
                      date.getDay() === 0 ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {getDayName(date)}
                    </div>
                    <div className={`text-sm sm:text-base font-bold mt-1 ${
                      date.getDay() === 6 ? 'text-blue-600' : 
                      date.getDay() === 0 ? 'text-red-600' : 
                      'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* 時間グリッド */}
              {timeSlots.map((time, timeIndex) => (
                <div key={time} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0 min-w-[480px]">
                  <div className="p-1 sm:p-2 text-center font-medium text-gray-600 bg-gray-50 border-r border-gray-200 text-xs sm:text-sm w-14 sm:w-16 flex items-center justify-center">
                    {time}
                  </div>
                  {weekDates.map((date, dateIndex) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const status = bookingStatuses[dateStr]?.[time] || 'available';
                    const isSelected = selectedDate && selectedTime && 
                                     selectedDate.toDateString() === date.toDateString() && 
                                     selectedTime === time;
                    
                    return (
                      <button
                        key={`${dateIndex}-${timeIndex}`}
                        onClick={() => handleTimeSlotClick(date, time)}
                        className={`p-1 sm:p-2 border-r border-gray-200 last:border-r-0 flex items-center justify-center flex-1 min-w-[50px] sm:min-w-[60px] min-h-[40px] sm:min-h-[48px] ${
                          isSelected ? 'bg-green-500' : 'hover:bg-gray-50 active:bg-gray-100'
                        }`}
                        disabled={status === 'unavailable' || status === 'full'}
                      >
                        {status === 'available' || status === 'partial' ? (
                          <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'bg-white border-white' : 'border-green-500'
                          }`}>
                            {isSelected && <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>}
                          </div>
                        ) : (
                          <div className="w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center">
                            <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ステップ2: 情報入力 */}
        {step === 2 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-white rounded-lg p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">お客様情報</h2>
              
              {/* 選択された日時 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="text-green-800">
                  <div className="font-medium text-sm sm:text-base">
                    📅 {selectedDate?.toLocaleDateString('ja-JP', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      weekday: 'short' 
                    })}
                  </div>
                  <div className="text-xs sm:text-sm mt-1">
                    🕐 {selectedTime}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    お名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('customerName', {
                      required: 'お名前を入力してください',
                      minLength: { value: 1, message: 'お名前を入力してください' },
                      maxLength: { value: 50, message: 'お名前は50文字以内で入力してください' }
                    })}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    placeholder="山田 太郎"
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.customerName.message}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ステップ4: 完了 */}
        {step === 4 && bookingResult && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 text-center">
              {bookingResult.success ? (
                <>
                  <div className="text-green-600 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold mb-4">予約が完了しました！</h2>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="text-green-800">
                      <div className="font-medium">
                        📅 {selectedDate?.toLocaleDateString('ja-JP', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric', 
                          weekday: 'short' 
                        })}
                      </div>
                      <div className="text-sm mt-1">🕐 {selectedTime}</div>
                      <div className="text-sm mt-1">👤 {bookingResult.customerName}</div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    予約が確定いたしました。<br />
                    当日は時間に余裕を持ってお越しください。
                  </p>
                </>
              ) : (
                <>
                  <div className="text-red-600 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold mb-4">予約に失敗しました</h2>
                  <p className="text-red-600 text-sm mb-4">{bookingResult.error}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 固定ボタン */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-inset-bottom">
        {step === 1 && (
          <button
            onClick={goToNextStep}
            disabled={!selectedDate || !selectedTime}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              selectedDate && selectedTime
                ? 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            次へ
          </button>
        )}
        
        {step === 2 && (
          <div className="flex space-x-3">
            <button
              onClick={goToPreviousStep}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 active:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? '予約中...' : '予約する'}
            </button>
          </div>
        )}
        
        {step === 4 && (
          <button
            onClick={handleRestart}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 active:bg-green-700 transition-colors"
          >
            新しい予約を作成する
          </button>
        )}
      </div>

      {/* 予約履歴モーダル */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">予約履歴</h3>
                <button
                  onClick={handleCloseHistory}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  予約履歴はまだありません。<br />
                  予約を作成すると、こちらに表示されます。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm; 