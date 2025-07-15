import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useBookings } from '../../hooks/useBookings';

const AdminCalendarView = ({ selectedDate, onDateTimeSelect }) => {
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 月曜日を週の始まりとする
    const startOfWeek = new Date(today);
    // 月曜日起算: (getDay() + 6) % 7 で月曜日を0とする
    startOfWeek.setDate(today.getDate() - (today.getDay() + 6) % 7);
    return startOfWeek;
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlotBookings, setSelectedSlotBookings] = useState([]);
  const [selectedDateTime, setSelectedDateTime] = useState({ date: null, time: null });
  const [slotStatuses, setSlotStatuses] = useState({});

  const { fetchBookingsByDateRange, getSlotStatuses, updateSlotStatus } = useBookings();

  // 時間スロット（11:00-19:00）
  const timeSlots = [
    '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  // 日付をローカルタイムゾーンでYYYY-MM-DD形式に変換
  const formatDateForComparison = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 指定した週の開始日から7日間の日付を生成（日曜日起算）
  const generateWeekDates = (startDate) => {
    const dates = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = generateWeekDates(currentWeek);

  // 曜日名を取得
  const getDayName = (date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  // 週の表示テキストを生成
  const getWeekText = (dates) => {
    if (dates.length === 0) return '';
    
    const start = dates[0];
    const end = dates[6];
    return `${start.getFullYear()}年${(start.getMonth() + 1).toString().padStart(2, '0')}月${start.getDate().toString().padStart(2, '0')}日 ～ ${end.getFullYear()}年${(end.getMonth() + 1).toString().padStart(2, '0')}月${end.getDate().toString().padStart(2, '0')}日`;
  };

  // 前の週へ移動
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWeekStart = new Date(today);
    // 月曜日起算での今日の週の開始日
    todayWeekStart.setDate(today.getDate() - (today.getDay() + 6) % 7);
    
    if (newWeek >= todayWeekStart) {
      setCurrentWeek(newWeek);
    }
  };

  // 次の週へ移動
  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  // 予約データと時間枠状態を取得
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      try {
        const startDate = formatDateForComparison(weekDates[0]);
        const endDate = formatDateForComparison(weekDates[6]);
        
        const [fetchedBookings, fetchedStatuses] = await Promise.all([
          fetchBookingsByDateRange(startDate, endDate),
          getSlotStatuses(startDate, endDate)
        ]);
        
        setBookings(fetchedBookings);
        setSlotStatuses(fetchedStatuses);
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    if (weekDates.length > 0) {
      loadBookings();
    }
  }, [currentWeek, fetchBookingsByDateRange, getSlotStatuses]);

  // 特定の日時の予約を全て取得（複数予約対応）
  const getBookingsForSlot = (date, time) => {
    const dateStr = formatDateForComparison(date);
    return bookings.filter(booking => 
      booking.date === dateStr && booking.time === time
    );
  };

  // 時間枠の状態を取得
  const getSlotStatus = (date, time) => {
    const dateStr = formatDateForComparison(date);
    const slotId = `${dateStr}_${time}`;
    return slotStatuses[slotId] || 'available';
  };

  // 記号を次の状態に切り替え
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'available':
        return 'partial';
      case 'partial':
        return 'unavailable';
      case 'unavailable':
        return 'available';
      default:
        return 'available';
    }
  };

  // 時間枠状態を更新
  const handleSlotStatusChange = async (date, time, event) => {
    event.stopPropagation();
    
    const dateStr = formatDateForComparison(date);
    const currentStatus = getSlotStatus(date, time);
    const nextStatus = getNextStatus(currentStatus);
    
    try {
      await updateSlotStatus(dateStr, time, nextStatus);
      
      // ローカル状態を更新
      const slotId = `${dateStr}_${time}`;
      setSlotStatuses(prev => ({
        ...prev,
        [slotId]: nextStatus
      }));
    } catch (error) {
      console.error('時間枠状態の更新に失敗しました:', error);
    }
  };

  // 記号を表示
  const getStatusSymbol = (status) => {
    switch (status) {
      case 'available':
        return <span className="text-green-600 font-bold text-lg">⚪︎</span>;
      case 'partial':
        return <span className="text-yellow-600 font-bold text-lg">△</span>;
      case 'unavailable':
        return <span className="text-red-600 font-bold text-lg">×</span>;
      default:
        return <span className="text-green-600 font-bold text-lg">⚪︎</span>;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return '⚪︎';
      case 'partial':
        return '△';
      case 'unavailable':
        return '×';
      default:
        return '⚪︎';
    }
  };

  // 記号の色を取得
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'text-green-600';
      case 'partial':
        return 'text-yellow-600';
      case 'unavailable':
        return 'text-red-600';
      default:
        return 'text-green-600';
    }
  };

  // 時間スロットのクリックハンドラ
  const handleTimeSlotClick = (date, time) => {
    const slotBookings = getBookingsForSlot(date, time);
    
    if (slotBookings.length > 0) {
      // 予約がある場合は詳細モーダルを表示
      setSelectedSlotBookings(slotBookings);
      setSelectedDateTime({ date, time });
      setShowBookingModal(true);
    } else {
      // 予約がない場合は通常の処理
      onDateTimeSelect?.(date, time);
    }
  };

  // 日付フォーマット
  const formatDisplayDate = (date) => {
    return `${date.getMonth() + 1}月${date.getDate()}日（${getDayName(date)}）`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 週選択ヘッダー */}
      <div className="bg-green-500 text-white rounded-t-lg px-4 py-3 flex items-center justify-between">
        <button 
          onClick={goToPreviousWeek} 
          className={`p-1 rounded ${
            (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const todayWeekStart = new Date(today);
              // 月曜日起算での今日の週の開始日
              todayWeekStart.setDate(today.getDate() - (today.getDay() + 6) % 7);
              
              return currentWeek < todayWeekStart
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-green-600';
            })()
          }`}
          disabled={(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayWeekStart = new Date(today);
            // 月曜日起算での今日の週の開始日
            todayWeekStart.setDate(today.getDate() - (today.getDay() + 6) % 7);
            
            return currentWeek < todayWeekStart;
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
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* 曜日・日付ヘッダー */}
          <div className="grid border-b border-gray-200" style={{gridTemplateColumns: '45px repeat(7, 1fr)'}}>
            <div className="p-1 text-center text-xs font-medium text-gray-600 bg-gray-50">
              時間
            </div>
            {weekDates.map((date, index) => (
              <div 
                key={index} 
                className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
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
                <div className={`text-sm font-bold mt-1 ${
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
            <div key={time} className="grid border-b border-gray-200 last:border-b-0" style={{gridTemplateColumns: '45px repeat(7, 1fr)'}}>
              <div className="p-1 text-center font-medium text-gray-600 bg-gray-50 border-r border-gray-200 text-xs">
                {time}
              </div>
              {weekDates.map((date, dateIndex) => {
                const slotBookings = getBookingsForSlot(date, time);
                const slotStatus = getSlotStatus(date, time);
                
                return (
                  <div key={`${dateIndex}-${timeIndex}`} className="relative">
                    <button
                      onClick={() => handleTimeSlotClick(date, time)}
                      className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[48px] flex items-center justify-center text-xs w-full ${
                        slotBookings.length > 0
                          ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 cursor-pointer' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {slotBookings.length > 0 ? (
                        <div className="text-center w-full">
                          {slotBookings.length === 1 ? (
                            <div className="font-medium">{slotBookings[0].customerName}</div>
                          ) : (
                            <div>
                              <div className="font-medium text-[10px]">
                                {slotBookings[0].customerName}
                              </div>
                              {slotBookings.length > 1 && (
                                <div className="text-[10px] mt-1">
                                  +{slotBookings.length - 1}件
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                      )}
                    </button>
                    
                    {/* 記号表示・編集ボタン */}
                    <button
                      onClick={(e) => handleSlotStatusChange(date, time, e)}
                      className={`absolute top-0 right-0 w-6 h-6 text-lg font-bold hover:scale-110 transition-transform ${getStatusColor(slotStatus)}`}
                      title={`クリックで状態を変更: ${getStatusText(slotStatus)}`}
                    >
                      {getStatusSymbol(slotStatus)}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-gray-600">予約済み（クリックで詳細表示）</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full"></div>
            <span className="text-gray-600">空き</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold">⚪︎</span>
            <span className="text-gray-600">利用可能</span>
          </div>
          <div className="flex items-center gap-2">
                            <span className="text-yellow-600 font-bold text-lg">△</span>
            <span className="text-gray-600">一部制限</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-lg">×</span>
            <span className="text-gray-600">利用不可</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600">記号をクリックで状態を変更</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      )}

      {/* 予約詳細モーダル */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                予約詳細
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {selectedDateTime.date && formatDisplayDate(selectedDateTime.date)} {selectedDateTime.time}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {selectedSlotBookings.length}件の予約
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedSlotBookings.map((booking, index) => (
                <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-600">{booking.phone}</p>
                      {booking.email && (
                        <p className="text-sm text-gray-600">{booking.email}</p>
                      )}
                      {booking.notes && (
                        <p className="text-sm text-gray-600 mt-1">備考: {booking.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendarView; 