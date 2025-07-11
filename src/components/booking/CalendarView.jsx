import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { 
  generateWeekDates, 
  getPreviousWeek, 
  getNextWeek, 
  formatWeekHeader,
  getWeekdayJP,
  formatDateString,
  isBookableDate,
  isBookableTime,
  isBusinessDay,
  getDayName,
  isWithinBusinessHours
} from '../../utils/dateUtils';
import { useBookings } from '../../hooks/useBookings';

const CalendarView = ({ 
  selectedDate, 
  selectedTime, 
  onDateTimeSelect, 
  mode = 'booking' // 'booking' or 'admin'
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [timeSlotBookings, setTimeSlotBookings] = useState({});
  const { businessHours, getBookingStatus, generateTimeSlots } = useBookings();

  // 現在の週の日付配列を生成
  const weekDates = useMemo(() => {
    return generateWeekDates(currentWeekStart);
  }, [currentWeekStart]);

  // 営業時間から時間枠を生成
  const timeSlots = useMemo(() => {
    if (!businessHours) return [];
    
    // 全曜日の営業時間から最大の時間範囲を取得
    let earliestOpen = '24:00';
    let latestClose = '00:00';
    
    Object.values(businessHours).forEach(dayHours => {
      if (dayHours.isAvailable) {
        if (dayHours.start < earliestOpen) earliestOpen = dayHours.start;
        if (dayHours.end > latestClose) latestClose = dayHours.end;
      }
    });
    
    if (earliestOpen === '24:00') return [];
    
    return generateTimeSlots(earliestOpen, latestClose);
  }, [businessHours, generateTimeSlots]);

  // 各時間枠の予約状況を取得
  useEffect(() => {
    if (!timeSlots.length || !weekDates.length) return;

    const loadBookingStatuses = async () => {
      const statusMap = {};
      
      for (const date of weekDates) {
        const dateStr = formatDateString(date);
        statusMap[dateStr] = {};
        
        for (const time of timeSlots) {
          if (isBusinessDay(date, businessHours || {}) && 
              isBookableDate(date) && 
              isBookableTime(date, time) &&
              isWithinBusinessHours(date, time, businessHours || {})) {
            const status = await getBookingStatus(date, time);
            statusMap[dateStr][time] = status;
          } else {
            statusMap[dateStr][time] = 'disabled';
          }
        }
      }
      
      setTimeSlotBookings(statusMap);
    };

    loadBookingStatuses();
  }, [weekDates, timeSlots, businessHours, getBookingStatus]);

  // 週切り替え
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => getPreviousWeek(prev));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => getNextWeek(prev));
  };

  // 日付・時間選択ハンドラ
  const handleTimeSlotClick = (date, time) => {
    const dateStr = formatDateString(date);
    const status = timeSlotBookings[dateStr]?.[time];
    
    if (status === 'disabled' || status === 'full') return;
    
    onDateTimeSelect?.(date, time);
  };

  // 時間枠のスタイルクラスを取得
  const getTimeSlotClass = (date, time) => {
    const dateStr = formatDateString(date);
    const status = timeSlotBookings[dateStr]?.[time];
    const isSelected = selectedDate && selectedTime && 
                       formatDateString(selectedDate) === dateStr && 
                       selectedTime === time;

    let baseClasses = 'calendar-cell text-xs font-medium transition-all duration-200 relative';
    
    if (isSelected) {
      baseClasses += ' ring-2 ring-salon-500 bg-salon-500 text-white';
    } else {
      switch (status) {
        case 'available':
          baseClasses += ' calendar-cell-available hover:bg-salon-200';
          break;
        case 'partial':
          baseClasses += ' calendar-cell-partial hover:bg-yellow-200';
          break;
        case 'full':
          baseClasses += ' calendar-cell-full';
          break;
        case 'disabled':
        default:
          baseClasses += ' calendar-cell-disabled';
          break;
      }
    }
    
    return baseClasses;
  };

  // 予約数表示
  const getBookingCountDisplay = (date, time) => {
    const dateStr = formatDateString(date);
    const status = timeSlotBookings[dateStr]?.[time];
    
    if (status === 'disabled' || status === 'available') return null;
    
    return (
      <span className="absolute top-0 right-0 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
        {status === 'partial' ? '1-2' : '3'}
      </span>
    );
  };

  if (!businessHours) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">営業時間を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* カレンダーヘッダー */}
      <div className="bg-salon-500 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-1 hover:bg-salon-600 rounded transition-colors duration-200"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <h2 className="text-lg font-semibold">
            {formatWeekHeader(weekDates[0], weekDates[6])}
          </h2>
          
          <button
            onClick={goToNextWeek}
            className="p-1 hover:bg-salon-600 rounded transition-colors duration-200"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* カレンダー本体 */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50">
              時間
            </div>
            {weekDates.map((date, index) => (
              <div
                key={index}
                className={`p-3 text-center text-sm font-medium border-r border-gray-200 ${
                  index === 5 ? 'bg-blue-50 text-blue-700' : // 土曜日
                  index === 6 ? 'bg-red-50 text-red-700' :   // 日曜日
                  'bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-semibold">{getWeekdayJP(date)}</div>
                <div className="text-xs mt-1">
                  {date.getMonth() + 1}/{date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* 時間枠グリッド */}
          <div className="divide-y divide-gray-200">
            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-8">
                {/* 時間ラベル */}
                <div className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  {time}
                </div>
                
                {/* 各日の時間枠 */}
                {weekDates.map((date, dayIndex) => (
                  <button
                    key={`${formatDateString(date)}-${time}`}
                    onClick={() => handleTimeSlotClick(date, time)}
                    className={getTimeSlotClass(date, time)}
                    disabled={
                      timeSlotBookings[formatDateString(date)]?.[time] === 'disabled' ||
                      timeSlotBookings[formatDateString(date)]?.[time] === 'full'
                    }
                  >
                    <span className="sr-only">
                      {formatDateString(date)} {time}
                    </span>
                    {getBookingCountDisplay(date, time)}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-salon-100 border border-salon-300 rounded"></div>
            <span className="text-gray-600">空き</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-gray-600">一部空き</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-gray-600">満席</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600">利用不可</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView; 