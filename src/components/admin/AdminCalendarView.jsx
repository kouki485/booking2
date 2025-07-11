import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useBookings } from '../../hooks/useBookings';

const AdminCalendarView = ({ selectedDate, onDateTimeSelect }) => {
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const { fetchBookingsByDateRange } = useBookings();

  // 時間スロット（11:00-19:00）
  const timeSlots = [
    '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  // 今日から7日間の日付を生成
  const generateWeekDates = (startDate) => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
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

  // 予約データを取得
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      try {
        const startDate = weekDates[0].toISOString().split('T')[0];
        const endDate = weekDates[6].toISOString().split('T')[0];
        
        const fetchedBookings = await fetchBookingsByDateRange(startDate, endDate);
        setBookings(fetchedBookings);
      } catch (error) {
        console.error('予約データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    if (weekDates.length > 0) {
      loadBookings();
    }
  }, [currentWeek, fetchBookingsByDateRange]);

  // 特定の日時の予約を取得
  const getBookingForSlot = (date, time) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.find(booking => 
      booking.date === dateStr && booking.time === time
    );
  };

  // 時間スロットのクリックハンドラ
  const handleTimeSlotClick = (date, time) => {
    onDateTimeSelect?.(date, time);
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
                const booking = getBookingForSlot(date, time);
                
                return (
                  <button
                    key={`${dateIndex}-${timeIndex}`}
                    onClick={() => handleTimeSlotClick(date, time)}
                    className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[48px] flex items-center justify-center text-xs ${
                      booking 
                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {booking ? (
                      <div className="text-center">
                        <div className="font-medium">{booking.customerName}</div>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                    )}
                  </button>
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
            <span className="text-gray-600">予約済み</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full"></div>
            <span className="text-gray-600">空き</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendarView; 