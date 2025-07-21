import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { 
  CalendarDaysIcon, 
  UserGroupIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import AdminCalendarView from './AdminCalendarView';
import { useBookings } from '../../hooks/useBookings';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, getCurrentDate } from '../../hooks/useBookings';
import { exportBookingsByDateRange } from '../../services/calendarExportService';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [weekBookings, setWeekBookings] = useState([]);
  const [sortOrder, setSortOrder] = useState('datetime'); // 'datetime' or 'created'
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({
    startDate: getCurrentDate(),
    endDate: getCurrentDate()
  });
  
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { 
    fetchBookingsByDateRange, 
    deleteExistingBooking, 
    loading, 
    error,
    clearError 
  } = useBookings();

  // 日付をローカルタイムゾーンでYYYY-MM-DD形式に変換
  const formatDateForQuery = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 予約一覧をソートする関数
  const sortBookings = (bookings, order) => {
    const sortedBookings = [...bookings];
    
    if (order === 'datetime') {
      // 日時順（日付→時間）でソート
      sortedBookings.sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return a.time.localeCompare(b.time);
      });
    } else if (order === 'created') {
      // 予約が入った順番（createdAt）でソート
      sortedBookings.sort((a, b) => {
        const aCreated = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const bCreated = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return aCreated - bCreated;
      });
    }
    
    return sortedBookings;
  };

  // ソート順を変更する関数
  const handleSortChange = (newOrder) => {
    setSortOrder(newOrder);
    const sortedBookings = sortBookings(weekBookings, newOrder);
    setWeekBookings(sortedBookings);
  };

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // タブメニュー
  const tabs = [
    { name: '予約カレンダー', icon: CalendarDaysIcon },
    { name: '予約一覧', icon: UserGroupIcon }
  ];

  // 現在の週の予約を取得
  useEffect(() => {
    const loadWeekBookings = async () => {
      if (!isAuthenticated || authLoading) {
        return;
      }
      
      // 常に今日を基準にした週を取得（月曜日起算）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfWeek = new Date(today);
      // 月曜日起算: (getDay() + 6) % 7 で月曜日を0とする
      startOfWeek.setDate(today.getDate() - (today.getDay() + 6) % 7);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startDate = formatDateForQuery(startOfWeek);
      const endDate = formatDateForQuery(endOfWeek);
      
      try {
        const bookings = await fetchBookingsByDateRange(startDate, endDate);
        
        // データの整合性チェック
        const validBookings = bookings.filter(booking => {
          const hasValidDate = booking.date && typeof booking.date === 'string';
          const hasValidTime = booking.time && typeof booking.time === 'string';
          const hasValidName = booking.customerName && typeof booking.customerName === 'string';
          
          if (!hasValidDate || !hasValidTime || !hasValidName) {
            console.warn('無効な予約データを検出:', booking);
            return false;
          }
          
          return true;
        });
        
        const sortedBookings = sortBookings(validBookings, sortOrder);
        setWeekBookings(sortedBookings);
        
      } catch (err) {
        console.error('予約取得エラー:', err);
        setWeekBookings([]);
      }
    };

    // 認証状態が確定した時にデータ取得
    loadWeekBookings();
  }, [isAuthenticated, authLoading, fetchBookingsByDateRange, sortOrder]);

  // 日時選択ハンドラ（管理者モード）
  const handleDateTimeSelect = (date, time) => {
    setSelectedDate(date);
    // 管理者モードでは予約作成は行わない
  };

  // Googleカレンダーエクスポート処理
  const handleCalendarExport = async (exportType = 'week') => {
    try {
      setIsExporting(true);
      
      let startDate, endDate;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (exportType === 'week') {
        // 今週の予約をエクスポート
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (today.getDay() + 6) % 7);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        startDate = formatDateForQuery(startOfWeek);
        endDate = formatDateForQuery(endOfWeek);
      } else if (exportType === 'month') {
        // 今月の予約をエクスポート
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        startDate = formatDateForQuery(startOfMonth);
        endDate = formatDateForQuery(endOfMonth);
      } else if (exportType === 'custom') {
        // カスタム期間での予約をエクスポート
        startDate = exportDateRange.startDate;
        endDate = exportDateRange.endDate;
      }
      
      const result = await exportBookingsByDateRange(
        startDate,
        endDate,
        fetchBookingsByDateRange
      );
      
      if (result.success) {
        alert(`${result.count}件の予約をエクスポートしました。\nファイル名: ${result.filename}`);
      }
    } catch (error) {
      console.error('エクスポートエラー:', error);
      alert('エクスポートに失敗しました。もう一度お試しください。');
    } finally {
      setIsExporting(false);
    }
  };

  // 期間選択ダイアログの表示
  const showDateRangeDialog = () => {
    setShowDateRangePicker(true);
  };

  // 期間選択ダイアログの確認
  const handleDateRangeConfirm = () => {
    setShowDateRangePicker(false);
    handleCalendarExport('custom');
  };

  // 期間選択ダイアログのキャンセル
  const handleDateRangeCancel = () => {
    setShowDateRangePicker(false);
  };

  // 予約削除の確認表示
  const handleDeleteBookingRequest = (bookingId, customerName, date, time) => {
    setDeleteTarget({ bookingId, customerName, date, time });
    setShowDeleteConfirm(true);
  };

  // 予約削除の実行
  const handleDeleteBookingConfirmed = async () => {
    if (!deleteTarget) return;
    
    const { bookingId, customerName, date, time } = deleteTarget;
    
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    
    try {
      await deleteExistingBooking(bookingId);
      
      // 予約一覧を再読み込み（月曜日起算）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfWeek = new Date(today);
      // 月曜日起算: (getDay() + 6) % 7 で月曜日を0とする
      startOfWeek.setDate(today.getDate() - (today.getDay() + 6) % 7);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startDate = formatDateForQuery(startOfWeek);
      const endDate = formatDateForQuery(endOfWeek);
      
      const updatedBookings = await fetchBookingsByDateRange(startDate, endDate);
      const sortedUpdatedBookings = sortBookings(updatedBookings, sortOrder);
      setWeekBookings(sortedUpdatedBookings);
      
      // 削除成功メッセージ
      alert(`${customerName}様の予約を削除しました`);
      
    } catch (error) {
      console.error('削除処理エラー:', error);
      alert('予約の削除に失敗しました: ' + error.message);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // 予約削除のキャンセル
  const handleDeleteBookingCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // 日付を正規化する関数
  const normalizeDate = (dateInput) => {
    if (!dateInput) return null;
    
    if (typeof dateInput === 'string') {
      // 既にYYYY-MM-DD形式の場合はそのまま返す
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
    }
    
    // Dateオブジェクトまたは他の形式の場合、YYYY-MM-DD形式に変換
    try {
      const date = new Date(dateInput);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('日付の正規化に失敗:', dateInput, error);
      return null;
    }
  };

  // 予約統計情報
  const getBookingStats = () => {
    const today = getCurrentDate();
    const todayNormalized = formatDateForQuery(new Date());
    
    // 今日の予約をフィルタリング
    const todayBookings = weekBookings.filter(booking => {
      if (!booking.date) {
        return false;
      }
      
      const bookingDateNormalized = booking.date; // 既にYYYY-MM-DD形式で保存されている
      const isToday = bookingDateNormalized === today || bookingDateNormalized === todayNormalized;
      
      return isToday;
    });
    
    const weekTotal = weekBookings.length;
    
    return {
      today: todayBookings.length,
      week: weekTotal
    };
  };

  const stats = getBookingStats();

  // 認証確認中はローディング表示
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">認証確認中...</div>
        </div>
      </div>
    );
  }

  // 認証されていない場合は何も表示しない（リダイレクト処理中）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">管理ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-600">
          予約管理を行えます
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
              <AdminCalendarView 
                onDateTimeSelect={handleDateTimeSelect}
                selectedDate={selectedDate}
              />
            </div>
          </Tab.Panel>

          {/* 予約一覧 */}
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      予約一覧
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      現在の週の予約状況
                    </p>
                  </div>
                  <div className="flex flex-col space-y-3">
                    {/* ソートボタン */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">並び順:</span>
                      <button
                        onClick={() => handleSortChange('datetime')}
                        className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          sortOrder === 'datetime' 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        時間順
                      </button>
                      <button
                        onClick={() => handleSortChange('created')}
                        className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          sortOrder === 'created' 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        予約順
                      </button>
                    </div>
                    
                    {/* エクスポートボタン */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCalendarExport('week')}
                        disabled={isExporting}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        {isExporting ? '処理中...' : '今週'}
                      </button>
                      <button
                        onClick={() => handleCalendarExport('month')}
                        disabled={isExporting}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        {isExporting ? '処理中...' : '今月'}
                      </button>
                      <button
                        onClick={showDateRangeDialog}
                        disabled={isExporting}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        期間選択
                      </button>
                      <div className="text-xs text-gray-500">
                        Googleカレンダーエクスポート
                      </div>
                    </div>
                  </div>
                </div>
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
                                  {(booking.age || booking.occupation) && (
                                    <span className="font-normal text-gray-600">
                                      ({booking.age && `${booking.age}歳`}
                                      {booking.age && booking.occupation && ', '}
                                      {booking.occupation})
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(booking.date)} {booking.time}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDeleteBookingRequest(
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


        </Tab.Panels>
      </Tab.Group>
      
      {/* 削除確認モーダル */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                予約を削除しますか？
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-900">{deleteTarget.customerName}</span>様の予約を削除します。
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  日時: {deleteTarget.date} {deleteTarget.time}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  この操作は取り消せません。
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={handleDeleteBookingCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteBookingConfirmed}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                >
                  {isDeleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 期間選択ダイアログ */}
      {showDateRangePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">エクスポート期間を選択</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始日
                </label>
                <input
                  type="date"
                  value={exportDateRange.startDate}
                  onChange={(e) => setExportDateRange({
                    ...exportDateRange,
                    startDate: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了日
                </label>
                <input
                  type="date"
                  value={exportDateRange.endDate}
                  onChange={(e) => setExportDateRange({
                    ...exportDateRange,
                    endDate: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleDateRangeCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                キャンセル
              </button>
              <button
                onClick={handleDateRangeConfirm}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isExporting ? '処理中...' : 'エクスポート'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 