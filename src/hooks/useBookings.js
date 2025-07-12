import { useState, useEffect, useCallback } from 'react';
import { 
  getBookings,
  getBookingCount,
  checkDuplicateBooking,
  getAvailableHours,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingsByDateRange,
  getBookingStats,
  generateTimeSlots,
  isAvailableDay,
  isAvailableTime
} from '../services/bookingService';
import { useAuth } from './useAuth'; // 追加

/**
 * 予約管理のためのカスタムフック
 */
export const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [availableHours, setAvailableHours] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user } = useAuth(); // 認証済みユーザー情報を取得

  // 対応可能時間を取得
  const fetchAvailableHours = useCallback(async () => {
    try {
      setLoading(true);
      const hours = await getAvailableHours();
      setAvailableHours(hours);
      setError(null);
    } catch (err) {
      console.error('対応可能時間の取得に失敗しました:', err);
      setError('対応可能時間の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // 予約一覧を取得
  const fetchBookings = useCallback(async (date = null) => {
    try {
      setLoading(true);
      
      // 入力データ検証
      const filters = {};
      if (date) {
        if (typeof date === 'string') {
          filters.date = date;
        } else {
          console.warn('fetchBookings: 無効な日付形式', date);
          setError('無効な日付形式です');
          return;
        }
      }
      
      const bookingData = await getBookings(filters);
      
      // 取得したデータの再検証
      const validBookings = bookingData.filter(booking => 
        booking && 
        booking.date && 
        booking.time && 
        booking.customerName &&
        typeof booking.date === 'string' &&
        typeof booking.time === 'string' &&
        typeof booking.customerName === 'string'
      );
      
      setBookings(validBookings);
      setError(null);
    } catch (err) {
      console.error('予約の取得に失敗しました:', err);
      setError('予約の取得に失敗しました');
      setBookings([]); // エラー時は空の配列を設定
    } finally {
      setLoading(false);
    }
  }, []);

  // 予約を作成
  const createNewBooking = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      
      // 重複チェック
      const isDuplicate = await checkDuplicateBooking(
        bookingData.customerName,
        bookingData.date,
        bookingData.time
      );
      
      if (isDuplicate) {
        throw new Error('同じ日時に同じお客様の予約が既に存在します');
      }
      
      // 予約数制限チェック
      const count = await getBookingCount(bookingData.date, bookingData.time);
      if (count >= 3) {
        throw new Error('この時間帯は予約が満席です');
      }
      
      const result = await createBooking(bookingData);
      
      // 予約一覧を更新
      await fetchBookings();
      
      setError(null);
      return result;
    } catch (err) {
      console.error('予約の作成に失敗しました:', err);
      setError(err.message || '予約の作成に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBookings]);

  // 予約を更新
  const updateExistingBooking = useCallback(async (bookingId, updates) => {
    try {
      setLoading(true);
      await updateBooking(bookingId, updates);
      
      // 予約一覧を更新
      await fetchBookings();
      
      setError(null);
    } catch (err) {
      console.error('予約の更新に失敗しました:', err);
      setError('予約の更新に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBookings]);

  // 予約を削除
  const deleteExistingBooking = useCallback(async (bookingId) => {
    try {
      setLoading(true);
      
      // 管理者権限チェック: 認証済みユーザーが必要
      if (!user) {
        throw new Error('管理者としてログインしてください');
      }
      
      await deleteBooking(bookingId, user);
      
      // 予約一覧を更新
      await fetchBookings();
      
      setError(null);
    } catch (err) {
      console.error('予約の削除に失敗しました:', err);
      setError(err.message || '予約の削除に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBookings, user]);

  // 指定日の利用可能時間を取得
  const getAvailableSlots = useCallback(async (date) => {
    try {
      const dayOfWeek = new Date(date).toLocaleDateString('ja-JP', { weekday: 'long' });
      const dayKey = dayOfWeek.replace('曜日', '');
      const dayInfo = availableHours[dayKey];
      
      if (!dayInfo || !dayInfo.isAvailable) {
        return [];
      }
      
      const allSlots = generateTimeSlots(dayInfo.start, dayInfo.end);
      const availableSlots = [];
      
      for (const slot of allSlots) {
        const count = await getBookingCount(date, slot);
        if (count < 3) {
          availableSlots.push({
            time: slot,
            available: 3 - count
          });
        }
      }
      
      return availableSlots;
    } catch (err) {
      console.error('利用可能時間の取得に失敗しました:', err);
      return [];
    }
  }, [availableHours]);

  // 期間別予約を取得
  const fetchBookingsByDateRange = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);
      const bookingData = await getBookingsByDateRange(startDate, endDate);
      setError(null);
      return bookingData;
    } catch (err) {
      console.error('期間別予約の取得に失敗しました:', err);
      setError('期間別予約の取得に失敗しました');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 予約統計を取得
  const fetchBookingStats = useCallback(async (month = null) => {
    try {
      setLoading(true);
      const stats = await getBookingStats(month);
      setError(null);
      return stats;
    } catch (err) {
      console.error('予約統計の取得に失敗しました:', err);
      setError('予約統計の取得に失敗しました');
      return { total: 0, thisMonth: 0, bookings: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // 対応可能日かどうかを判定
  const checkAvailableDay = useCallback((date) => {
    return isAvailableDay(date, availableHours);
  }, [availableHours]);

  // 対応可能時間内かどうかを判定
  const checkAvailableTime = useCallback((time, date) => {
    return isAvailableTime(time, date, availableHours);
  }, [availableHours]);

  // 予約状況を取得
  const getBookingStatus = useCallback(async (date, time) => {
    try {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      const count = await getBookingCount(dateStr, time);
      
      if (count === 0) return 'available';
      if (count < 3) return 'partial';
      return 'full';
    } catch (error) {
      console.error('予約状況取得エラー:', error);
      return 'disabled';
    }
  }, []);

  // 初期化時に対応可能時間を取得
  useEffect(() => {
    fetchAvailableHours();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    bookings,
    availableHours,
    businessHours: availableHours, // CalendarViewコンポーネント用のエイリアス
    loading,
    error,
    fetchBookings,
    fetchAvailableHours,
    createNewBooking,
    addBooking: createNewBooking, // エイリアス
    updateExistingBooking,
    deleteExistingBooking,
    getAvailableSlots,
    fetchBookingsByDateRange,
    fetchBookingStats,
    checkAvailableDay,
    checkAvailableTime,
    getBookingStatus,
    generateTimeSlots,
    clearError: () => setError(null)
  };
};

// 日付関連のユーティリティ関数
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

export const formatTime = (time) => {
  return time;
};

export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const getWeekDays = () => {
  return ['日', '月', '火', '水', '木', '金', '土'];
};

export const getDayOfWeek = (date) => {
  const dayOfWeek = new Date(date).toLocaleDateString('ja-JP', { weekday: 'long' });
  return dayOfWeek.replace('曜日', '');
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

export default useBookings; 