import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserGroupIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import CalendarView from '../booking/CalendarView';
import AvailableHours from './BusinessHours';
import { useBookings } from '../../hooks/useBookings';
import { formatDate, getCurrentDate } from '../../hooks/useBookings';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [weekBookings, setWeekBookings] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { 
    fetchBookingsByDateRange, 
    deleteExistingBooking, 
    loading, 
    error,
    clearError 
  } = useBookings();

  // タブメニュー
  const tabs = [
    { name: '予約カレンダー', icon: CalendarDaysIcon },
    { name: '予約一覧', icon: UserGroupIcon },
    { name: '対応可能時間設定', icon: ClockIcon }
  ];

  // 現在の週の予約を取得
  useEffect(() => {
    const loadWeekBookings = async () => {
      const today = new Date(selectedDate);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];
      
      try {
        const bookings = await fetchBookingsByDateRange(startDate, endDate);
        setWeekBookings(bookings);
      } catch (err) {
        console.error('予約取得エラー:', err);
      }
    };

    loadWeekBookings();
  }, [selectedDate, fetchBookingsByDateRange]);

  // 日時選択ハンドラ（管理者モード）
  const handleDateTimeSelect = (date, time) => {
    setSelectedDate(date);
    // 管理者モードでは予約作成は行わない
  };

  // 予約削除
  const handleDeleteBooking = async (bookingId, customerName, date, time) => {
    if (!window.confirm(`${customerName}様の予約を削除しますか？\n日時: ${date} ${time}`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteExistingBooking(bookingId);
      
      // 予約一覧を再読み込み
      const today = new Date(selectedDate);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];
      
      const updatedBookings = await fetchBookingsByDateRange(startDate, endDate);
      setWeekBookings(updatedBookings);
    } catch (error) {
      alert('予約の削除に失敗しました: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // 予約統計情報
  const getBookingStats = () => {
    const today = getCurrentDate();
    
    const todayBookings = weekBookings.filter(booking => booking.date === today);
    const weekTotal = weekBookings.length;
    
    return {
      today: todayBookings.length,
      week: weekTotal
    };
  };

  const stats = getBookingStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">管理ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-600">
          予約管理と店舗設定を行えます
        </p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    本日の予約
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.today}件
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    今週の予約
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.week}件
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 text-sm underline ml-2"
          >
            閉じる
          </button>
        </div>
      )}

      {/* タブメニュー */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-100 p-1">
          {tabs.map((tab, index) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
                )
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6">
          {/* 予約カレンダー */}
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                予約カレンダー
              </h3>
              <CalendarView 
                onDateTimeSelect={handleDateTimeSelect}
                selectedDate={selectedDate}
                isAdminMode={true}
              />
            </div>
          </Tab.Panel>

          {/* 予約一覧 */}
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  予約一覧
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  現在の週の予約状況
                </p>
              </div>

              <div className="overflow-hidden">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-600 mt-2">読み込み中...</p>
                  </div>
                ) : weekBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">予約がありません</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {weekBookings.map((booking) => (
                      <div key={booking.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {booking.customerName.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {booking.customerName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(booking.date)} {booking.time}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDeleteBooking(
                                booking.id,
                                booking.customerName,
                                booking.date,
                                booking.time
                              )}
                              disabled={isDeleting}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Tab.Panel>

          {/* 対応可能時間設定 */}
          <Tab.Panel>
            <AvailableHours />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AdminDashboard; 