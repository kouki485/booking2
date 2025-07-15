import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  getDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { validateCustomerName, sanitizeString } from '../utils/validation';
import { 
  checkRateLimit, 
  getClientIP, 
  detectSQLInjection, 
  detectXSS, 
  sanitizeInput,
  logSecurityEvent,
  detectAnomalousActivity
} from '../utils/security';
import { DEFAULT_AVAILABLE_HOURS } from '../utils/initData';

/**
 * 予約を作成する（セキュリティ強化版）
 */
export const createBooking = async (bookingData) => {
  try {
    const clientId = getClientIP();
    
    // レート制限チェック（1時間に5回まで）
    if (!checkRateLimit(`booking_${clientId}`, 5, 60 * 60 * 1000)) {
      logSecurityEvent('rate_limit_exceeded', { 
        action: 'create_booking',
        clientId 
      });
      throw new Error('予約作成回数の上限に達しました。しばらく時間をおいてから再試行してください。');
    }
    
    // IPアドレス制限チェック（同じIPから2件まで）
    const ipLimitCheck = await checkIPAddressBookingLimit(clientId, 2);
    if (ipLimitCheck.isLimitExceeded) {
      logSecurityEvent('ip_booking_limit_exceeded', { 
        action: 'create_booking',
        clientId: ipLimitCheck.clientId,
        currentCount: ipLimitCheck.currentCount,
        maxAllowed: ipLimitCheck.maxAllowed
      });
      throw new Error(`同じ端末からの予約は${ipLimitCheck.maxAllowed}件までに制限されています。現在${ipLimitCheck.currentCount}件の予約があります。`);
    }
    
    // 異常なアクティビティの検出
    if (detectAnomalousActivity(clientId, 'booking_creation')) {
      logSecurityEvent('anomalous_activity', { 
        action: 'create_booking',
        clientId 
      });
      throw new Error('異常なアクセスパターンが検出されました。');
    }
    
    // 入力データのセキュリティチェック
    const securityChecks = {
      customerName: detectSQLInjection(bookingData.customerName) || detectXSS(bookingData.customerName),
      date: detectSQLInjection(bookingData.date) || detectXSS(bookingData.date),
      time: detectSQLInjection(bookingData.time) || detectXSS(bookingData.time)
    };
    
    if (Object.values(securityChecks).some(check => check)) {
      logSecurityEvent('malicious_input_detected', { 
        bookingData,
        securityChecks,
        clientId 
      });
      throw new Error('不正な入力が検出されました。');
    }
    
    // 入力データのサニタイゼーション
    const sanitizedData = {
      customerName: sanitizeInput(bookingData.customerName, { maxLength: 50, allowSpecialChars: false }),
      date: sanitizeInput(bookingData.date, { maxLength: 10, allowSpecialChars: false }),
      time: sanitizeInput(bookingData.time, { maxLength: 5, allowSpecialChars: false }),
      status: 'confirmed',
      createdAt: new Date(),
      clientId: clientId.substring(0, 8) // 識別用に一部のみ保存
    };
    
    // バリデーション
    const nameValidation = validateCustomerName(sanitizedData.customerName);
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.errors[0]);
    }
    
    // 管理者の設定を確認
    const isBookable = await isTimeSlotBookable(sanitizedData.date, sanitizedData.time);
    if (!isBookable) {
      throw new Error('申し訳ございませんが、この時間枠は現在予約を受け付けておりません。');
    }

    // 既存の予約数をチェック（容量制限）
    const timeSlotQuery = query(
      collection(db, 'bookings'),
      where('date', '==', sanitizedData.date),
      where('time', '==', sanitizedData.time),
      where('status', '==', 'confirmed')
    );
    
    const existingBookings = await getDocs(timeSlotQuery);
    const maxCapacity = 3;
    
    if (existingBookings.size >= maxCapacity) {
      throw new Error('申し訳ございませんが、この時間枠は既に満席です。');
    }
    
    // 同じ顧客名での重複予約チェック
    const duplicateQuery = query(
      collection(db, 'bookings'),
      where('date', '==', sanitizedData.date),
      where('time', '==', sanitizedData.time),
      where('customerName', '==', sanitizedData.customerName),
      where('status', '==', 'confirmed')
    );
    
    const duplicateBookings = await getDocs(duplicateQuery);
    if (!duplicateBookings.empty) {
      throw new Error('同じお名前で同じ時間帯に既に予約が存在します。');
    }
    
    // 予約をFirestoreに追加
    const docRef = await addDoc(collection(db, 'bookings'), sanitizedData);
    
    // セキュリティログ
    logSecurityEvent('booking_created', {
      bookingId: docRef.id,
      clientId: clientId.substring(0, 8),
      date: sanitizedData.date,
      time: sanitizedData.time,
      ipBookingCount: ipLimitCheck.currentCount + 1
    });
    
    return {
      success: true,
      bookingId: docRef.id,
      ...sanitizedData
    };
    
  } catch (error) {
    console.error('予約作成エラー:', error);
    
    // エラーログ（詳細情報は本番環境では記録しない）
    if (process.env.NODE_ENV === 'development') {
      logSecurityEvent('booking_creation_error', {
        error: error.message,
        bookingData
      });
    }
    
    throw error;
  }
};

/**
 * 予約一覧を取得する（管理者用）
 */
export const getBookings = async (filters = {}) => {
  try {
    let q = collection(db, 'bookings');
    
    // フィルターの適用
    if (filters.date) {
      q = query(q, where('date', '==', filters.date));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    // 日付順でソート
    q = query(q, orderBy('date', 'asc'), orderBy('time', 'asc'));
    
    const querySnapshot = await getDocs(q);
    
    const bookings = [];
    const debugInfo = {
      totalDocs: querySnapshot.size,
      validBookings: 0,
      invalidBookings: 0,
      sampleData: []
    };
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // デバッグ用: 最初の3件のデータを記録
      if (debugInfo.sampleData.length < 3) {
        debugInfo.sampleData.push({
          id: doc.id,
          data: data
        });
      }
      
      // データ検証: 必須フィールドが存在し、有効な値であることを確認
      if (data && 
          data.date && 
          data.time && 
          data.customerName && 
          typeof data.date === 'string' &&
          typeof data.time === 'string' &&
          typeof data.customerName === 'string') {
        
        debugInfo.validBookings++;
        bookings.push({
          id: doc.id,
          ...data
        });
      } else {
        debugInfo.invalidBookings++;
        console.warn('無効な予約データをスキップしました:', doc.id, data);
      }
    });
    

    
    return bookings;
  } catch (error) {
    console.error('予約取得エラー:', error);
    throw new Error('予約データの取得に失敗しました');
  }
};

/**
 * 予約を削除する（管理者用、セキュリティ強化版）
 */
export const deleteBooking = async (bookingId, adminUser) => {
  try {
    if (!adminUser) {
      throw new Error('管理者権限が必要です');
    }
    
    // Firebase Auth の現在のユーザーを確認
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Firebase認証が必要です。再度ログインしてください。');
    }
    
    const clientId = getClientIP();
    
    // 管理者操作のレート制限（1分間に10回まで）
    if (!checkRateLimit(`admin_delete_${clientId}`, 10, 60 * 1000)) {
      logSecurityEvent('admin_rate_limit_exceeded', { 
        action: 'delete_booking',
        adminId: adminUser.uid,
        bookingId 
      });
      throw new Error('操作回数の上限に達しました。');
    }
    
    // 入力のサニタイゼーション
    const sanitizedBookingId = sanitizeString(bookingId);
    
    if (!sanitizedBookingId) {
      throw new Error('無効な予約IDです');
    }
    
    // Firestoreから予約を削除
    await deleteDoc(doc(db, 'bookings', sanitizedBookingId));
    
    // セキュリティログ
    logSecurityEvent('booking_deleted', {
      bookingId: sanitizedBookingId,
      adminId: adminUser.uid,
      adminEmail: adminUser.email
    });
    
    return { success: true };
  } catch (error) {
    console.error('予約削除エラー:', error);
    
    logSecurityEvent('booking_deletion_error', {
      error: error.message,
      errorCode: error.code,
      bookingId,
      adminId: adminUser?.uid
    });
    
    throw error;
  }
};

/**
 * 複数の予約を一括削除する（管理者用）
 */
export const deleteMultipleBookings = async (bookingIds, adminUser) => {
  try {
    if (!adminUser) {
      throw new Error('管理者権限が必要です');
    }
    
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      throw new Error('削除する予約が選択されていません');
    }
    
    if (bookingIds.length > 50) {
      throw new Error('一度に削除できる予約は50件までです');
    }
    
    const clientId = getClientIP();
    
    // 一括削除のレート制限
    if (!checkRateLimit(`admin_bulk_delete_${clientId}`, 3, 60 * 1000)) {
      logSecurityEvent('admin_bulk_delete_rate_limit', { 
        adminId: adminUser.uid,
        attemptedCount: bookingIds.length 
      });
      throw new Error('一括削除の回数制限に達しました。');
    }
    
    const batch = writeBatch(db);
    const sanitizedIds = bookingIds.map(id => sanitizeString(id)).filter(id => id);
    
    sanitizedIds.forEach(bookingId => {
      const bookingRef = doc(db, 'bookings', bookingId);
      batch.delete(bookingRef);
    });
    
    await batch.commit();
    
    // セキュリティログ
    logSecurityEvent('bulk_booking_deletion', {
      deletedCount: sanitizedIds.length,
      adminId: adminUser.uid,
      adminEmail: adminUser.email
    });
    
    return { 
      success: true, 
      deletedCount: sanitizedIds.length 
    };
  } catch (error) {
    console.error('一括削除エラー:', error);
    throw error;
  }
};

/**
 * 今日の予約数を取得
 */
export const getTodayBookingsCount = async () => {
  try {
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    const todayQuery = query(
      collection(db, 'bookings'),
      where('date', '==', today),
      where('status', '==', 'confirmed')
    );
    
    const snapshot = await getDocs(todayQuery);
    return snapshot.size;
  } catch (error) {
    console.error('今日の予約数取得エラー:', error);
    return 0;
  }
};

/**
 * 指定期間の予約数を取得
 */
export const getBookingsCountByDateRange = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      where('status', '==', 'confirmed')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('期間別予約数取得エラー:', error);
    return 0;
  }
};

/**
 * 特定の日付と時間の予約数を取得
 */
export const getBookingCount = async (date, time) => {
  try {
    // 入力データ検証
    if (!date || !time || typeof date !== 'string' || typeof time !== 'string') {
      console.warn('getBookingCount: 無効なパラメータ', { date, time });
      return 0;
    }
    
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
    const availableHoursRef = doc(db, 'settings', 'availableHours');
    const availableHoursDoc = await getDoc(availableHoursRef);
    
    if (availableHoursDoc.exists()) {
      const data = availableHoursDoc.data();
      return data.hours || DEFAULT_AVAILABLE_HOURS;
    } else {
      // ドキュメントが存在しない場合、デフォルト値を返す
      return DEFAULT_AVAILABLE_HOURS;
    }
  } catch (error) {
    console.error('getAvailableHours: Firebase接続エラー:', error);
    
    // エラーが発生した場合、LocalStorageから取得を試行
    try {
      const savedHours = localStorage.getItem('availableHours');
      if (savedHours) {
        return JSON.parse(savedHours);
      }
    } catch (localStorageError) {
      console.warn('getAvailableHours: LocalStorageからの取得に失敗:', localStorageError);
    }
    
    // すべて失敗した場合、デフォルト値を返す
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
 * 日付範囲の予約を取得
 */
export const getBookingsByDateRange = async (startDate, endDate) => {
  try {
    // 入力データ検証
    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      console.warn('getBookingsByDateRange: 無効なパラメータ', { startDate, endDate });
      return [];
    }
    
    // シンプルなクエリを使用してFirestoreの制限を回避
    const q = query(
      collection(db, 'bookings'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    
    const bookings = [];
    const debugInfo = {
      totalDocs: querySnapshot.size,
      validBookings: 0,
      invalidBookings: 0,
      confirmedBookings: 0,
      sampleData: []
    };
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // デバッグ用: 最初の5件のデータを記録
      if (debugInfo.sampleData.length < 5) {
        debugInfo.sampleData.push({
          id: doc.id,
          data: data
        });
      }
      
      // データ検証と絞り込み: 必須フィールドが存在し、有効な値であることを確認
      if (data && 
          data.date && 
          data.time && 
          data.customerName && 
          typeof data.date === 'string' &&
          typeof data.time === 'string' &&
          typeof data.customerName === 'string') {
        
        debugInfo.validBookings++;
        
        // クライアントサイドでstatusフィルタリング
        if (data.status === 'confirmed' || !data.status) {
          debugInfo.confirmedBookings++;
          bookings.push({
            id: doc.id,
            ...data
          });
        }
      } else {
        debugInfo.invalidBookings++;
        console.warn('無効な予約データをスキップしました:', doc.id, data);
      }
    });
    
    // クライアントサイドでソート
    const sortedBookings = bookings.sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
    
    return sortedBookings;
  } catch (error) {
    console.error('期間別予約取得エラー:', error);
    return [];
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

/**
 * IPアドレス別の予約統計を取得（管理者用）
 */
export const getIPAddressBookingStats = async () => {
  try {
    const allBookingsQuery = query(
      collection(db, 'bookings'),
      where('status', '==', 'confirmed')
    );
    
    const querySnapshot = await getDocs(allBookingsQuery);
    const ipStats = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const clientId = data.clientId;
      
      if (clientId) {
        if (!ipStats[clientId]) {
          ipStats[clientId] = {
            count: 0,
            bookings: []
          };
        }
        
        ipStats[clientId].count++;
        ipStats[clientId].bookings.push({
          id: doc.id,
          customerName: data.customerName,
          date: data.date,
          time: data.time,
          createdAt: data.createdAt
        });
      }
    });
    
    // 件数が多い順にソート
    const sortedStats = Object.entries(ipStats)
      .map(([clientId, stats]) => ({
        clientId,
        ...stats,
        isOverLimit: stats.count > 2
      }))
      .sort((a, b) => b.count - a.count);
    
    return {
      totalUniqueIPs: Object.keys(ipStats).length,
      overLimitIPs: sortedStats.filter(stat => stat.isOverLimit).length,
      stats: sortedStats
    };
  } catch (error) {
    console.error('IPアドレス別統計取得エラー:', error);
    return {
      totalUniqueIPs: 0,
      overLimitIPs: 0,
      stats: []
    };
  }
};

/**
 * IPアドレス（clientId）ベースの予約制限チェック
 */
export const checkIPAddressBookingLimit = async (clientId, maxBookingsPerIP = 2) => {
  try {
    // clientIdの前8文字で検索（保存時と同じ形式）
    const shortClientId = clientId.substring(0, 8);
    
    const ipBookingsQuery = query(
      collection(db, 'bookings'),
      where('clientId', '==', shortClientId),
      where('status', '==', 'confirmed')
    );
    
    const querySnapshot = await getDocs(ipBookingsQuery);
    const existingBookings = querySnapshot.size;
    

    
    return {
      isLimitExceeded: existingBookings >= maxBookingsPerIP,
      currentCount: existingBookings,
      maxAllowed: maxBookingsPerIP,
      clientId: shortClientId
    };
  } catch (error) {
    console.error('IPアドレス制限チェックエラー:', error);
    // エラーが発生した場合は制限なしとして処理を継続
    return {
      isLimitExceeded: false,
      currentCount: 0,
      maxAllowed: maxBookingsPerIP,
      clientId: clientId.substring(0, 8)
    };
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

/**
 * 時間枠状態を取得
 * @param {string} date - 日付 (YYYY-MM-DD)
 * @param {string} time - 時間 (HH:MM)
 * @returns {Promise<string>} 'available' | 'partial' | 'unavailable'
 */
export const getTimeSlotStatus = async (date, time) => {
  try {
    const slotId = `${date}_${time}`;
    const slotRef = doc(db, 'timeSlotStatus', slotId);
    const slotDoc = await getDoc(slotRef);
    
    if (slotDoc.exists()) {
      return slotDoc.data().status || 'available';
    } else {
      return 'available'; // デフォルト状態
    }
  } catch (error) {
    console.error('時間枠状態取得エラー:', error);
    return 'available'; // エラー時はデフォルト状態を返す
  }
};

/**
 * 時間枠状態を更新
 * @param {string} date - 日付 (YYYY-MM-DD)
 * @param {string} time - 時間 (HH:MM)
 * @param {string} status - 状態 ('available' | 'partial' | 'unavailable')
 * @param {Object} adminUser - 管理者ユーザー情報
 * @returns {Promise<Object>} 更新結果
 */
export const updateTimeSlotStatus = async (date, time, status, adminUser) => {
  try {
    if (!adminUser) {
      throw new Error('管理者権限が必要です');
    }
    
    // 状態値の検証
    const validStatuses = ['available', 'partial', 'unavailable'];
    if (!validStatuses.includes(status)) {
      throw new Error('無効な状態値です');
    }
    
    const slotId = `${date}_${time}`;
    const slotRef = doc(db, 'timeSlotStatus', slotId);
    
    const slotData = {
      status,
      date,
      time,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser.uid,
      updatedByEmail: adminUser.email
    };
    
    // ドキュメントが存在しない場合は作成、存在する場合は更新
    await updateDoc(slotRef, slotData).catch(async (error) => {
      if (error.code === 'not-found') {
        // ドキュメントが存在しない場合は作成
        await setDoc(slotRef, {
          ...slotData,
          createdAt: new Date().toISOString()
        });
      } else {
        throw error;
      }
    });
    
    // セキュリティログ
    logSecurityEvent('time_slot_status_updated', {
      slotId,
      date,
      time,
      status,
      adminId: adminUser.uid,
      adminEmail: adminUser.email
    });
    
    return { success: true, slotId, status };
  } catch (error) {
    console.error('時間枠状態更新エラー:', error);
    throw error;
  }
};

/**
 * 複数の時間枠状態を一括取得
 * @param {string} startDate - 開始日付 (YYYY-MM-DD)
 * @param {string} endDate - 終了日付 (YYYY-MM-DD)
 * @returns {Promise<Object>} 時間枠状態の辞書 {`${date}_${time}`: status}
 */
export const getTimeSlotStatuses = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'timeSlotStatus'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    const statuses = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const slotId = `${data.date}_${data.time}`;
      statuses[slotId] = data.status;
    });
    
    return statuses;
  } catch (error) {
    console.error('時間枠状態一括取得エラー:', error);
    return {};
  }
};

/**
 * 時間枠状態に基づいて予約可否を判定
 * @param {string} date - 日付 (YYYY-MM-DD)
 * @param {string} time - 時間 (HH:MM)
 * @returns {Promise<boolean>} 予約可能かどうか
 */
export const isTimeSlotBookable = async (date, time) => {
  try {
    const status = await getTimeSlotStatus(date, time);
    return status !== 'unavailable';
  } catch (error) {
    console.error('時間枠予約可否判定エラー:', error);
    return true; // エラー時はデフォルトで予約可能とする
  }
}; 