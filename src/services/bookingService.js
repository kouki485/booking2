import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  limit,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { DEFAULT_AVAILABLE_HOURS } from '../utils/initData';

/**
 * 予約を作成
 */
export const createBooking = async (bookingData) => {
  try {
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    });
    
    return { success: true, id: bookingRef.id };
  } catch (error) {
    console.error('予約作成エラー:', error);
    throw error;
  }
};

/**
 * 予約一覧を取得
 */
export const getBookings = async (date = null) => {
  try {
    let q = collection(db, 'bookings');
    
    if (date) {
      q = query(
        collection(db, 'bookings'),
        where('date', '==', date)
      );
    } else {
      q = query(
        collection(db, 'bookings'),
        limit(100)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const bookings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // クライアントサイドでソート
    if (date) {
      return bookings.sort((a, b) => a.time.localeCompare(b.time));
    } else {
      return bookings.sort((a, b) => {
        const aDate = new Date(a.createdAt || a.date);
        const bDate = new Date(b.createdAt || b.date);
        return bDate - aDate;
      });
    }
  } catch (error) {
    console.error('予約取得エラー:', error);
    throw error;
  }
};

/**
 * 特定の日付と時間の予約数を取得
 */
export const getBookingCount = async (date, time) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', date),
      where('time', '==', time),
      where('status', '==', 'confirmed')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('予約数取得エラー:', error);
    return 0;
  }
};

/**
 * 重複予約をチェック
 */
export const checkDuplicateBooking = async (customerName, date, time) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('customerName', '==', customerName),
      where('date', '==', date),
      where('time', '==', time),
      where('status', '==', 'confirmed')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size > 0;
  } catch (error) {
    console.error('重複チェックエラー:', error);
    return false;
  }
};

/**
 * 対応可能時間を取得
 */
export const getAvailableHours = async () => {
  try {
    console.log('getAvailableHours: Firebase接続を試行中');
    const availableHoursRef = doc(db, 'settings', 'availableHours');
    const availableHoursDoc = await getDoc(availableHoursRef);
    
    if (availableHoursDoc.exists()) {
      const data = availableHoursDoc.data();
      console.log('getAvailableHours: Firestoreからデータを取得', data);
      return data.hours || DEFAULT_AVAILABLE_HOURS;
    } else {
      // ドキュメントが存在しない場合、デフォルト値を返す
      console.warn('getAvailableHours: ドキュメントが存在しません。デフォルト値を使用します');
      return DEFAULT_AVAILABLE_HOURS;
    }
  } catch (error) {
    console.error('getAvailableHours: Firebase接続エラー:', error);
    
    // エラーが発生した場合、LocalStorageから取得を試行
    try {
      const savedHours = localStorage.getItem('availableHours');
      if (savedHours) {
        console.log('getAvailableHours: LocalStorageから取得しました');
        return JSON.parse(savedHours);
      }
    } catch (localStorageError) {
      console.warn('getAvailableHours: LocalStorageからの取得に失敗:', localStorageError);
    }
    
    // すべて失敗した場合、デフォルト値を返す
    console.warn('getAvailableHours: すべて失敗。デフォルト値を使用します', DEFAULT_AVAILABLE_HOURS);
    return DEFAULT_AVAILABLE_HOURS;
  }
};

/**
 * 対応可能時間を更新
 */
export const updateAvailableHours = async (availableHours) => {
  try {
    const availableHoursRef = doc(db, 'settings', 'availableHours');
    await updateDoc(availableHoursRef, {
      hours: availableHours,
      updatedAt: new Date().toISOString()
    });
    
    // LocalStorageにも保存
    try {
      localStorage.setItem('availableHours', JSON.stringify(availableHours));
    } catch (localStorageError) {
      console.warn('LocalStorageの保存に失敗:', localStorageError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('対応可能時間更新エラー:', error);
    throw error;
  }
};

/**
 * 予約を更新
 */
export const updateBooking = async (bookingId, updates) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('予約更新エラー:', error);
    throw error;
  }
};

/**
 * 予約を削除
 */
export const deleteBooking = async (bookingId) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await deleteDoc(bookingRef);
    
    return { success: true };
  } catch (error) {
    console.error('予約削除エラー:', error);
    throw error;
  }
};

/**
 * 日付範囲の予約を取得
 */
export const getBookingsByDateRange = async (startDate, endDate) => {
  try {
    // インデックスの問題を回避するため、シンプルなクエリを使用
    const q = query(
      collection(db, 'bookings'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const bookings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // クライアントサイドで時間順にソート
    return bookings.sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  } catch (error) {
    console.error('期間別予約取得エラー:', error);
    throw error;
  }
};

/**
 * 予約統計を取得
 */
export const getBookingStats = async (month = null) => {
  try {
    let q;
    
    if (month) {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      
      // インデックスの問題を回避するため、シンプルなクエリを使用
      q = query(
        collection(db, 'bookings'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
    } else {
      q = query(
        collection(db, 'bookings')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const allBookings = querySnapshot.docs.map(doc => doc.data());
    
    // クライアントサイドで confirmed のみフィルタリング
    const bookings = allBookings.filter(booking => 
      booking.status === 'confirmed' || !booking.status // デフォルトは confirmed
    );
    
    return {
      total: bookings.length,
      thisMonth: bookings.filter(booking => {
        const bookingMonth = booking.date.substring(0, 7);
        const currentMonth = new Date().toISOString().substring(0, 7);
        return bookingMonth === currentMonth;
      }).length,
      bookings
    };
  } catch (error) {
    console.error('予約統計取得エラー:', error);
    return { total: 0, thisMonth: 0, bookings: [] };
  }
};

// 時間スロットを生成する関数
export const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  const slots = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  while (start < end) {
    const timeString = start.toTimeString().substring(0, 5);
    slots.push(timeString);
    start.setMinutes(start.getMinutes() + intervalMinutes);
  }
  
  return slots;
};

// 日付文字列をフォーマットする関数
export const formatDateString = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

// 時間文字列をフォーマットする関数
export const formatTimeString = (timeString) => {
  return timeString;
};

// 対応可能日かどうかを判定する関数
export const isAvailableDay = (date, availableHours) => {
  const dayOfWeek = new Date(date).toLocaleDateString('ja-JP', { weekday: 'long' });
  const dayKey = dayOfWeek.replace('曜日', '');
  return availableHours[dayKey]?.isAvailable || false;
};

// 対応可能時間内かどうかを判定する関数
export const isAvailableTime = (time, date, availableHours) => {
  const dayOfWeek = new Date(date).toLocaleDateString('ja-JP', { weekday: 'long' });
  const dayKey = dayOfWeek.replace('曜日', '');
  const dayInfo = availableHours[dayKey];
  
  if (!dayInfo || !dayInfo.isAvailable) {
    return false;
  }
  
  return time >= dayInfo.start && time <= dayInfo.end;
}; 