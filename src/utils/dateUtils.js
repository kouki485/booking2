import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addWeeks, 
  subWeeks,
  isSameDay,
  isToday,
  isAfter,
  isBefore,
  parseISO
} from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 日本語曜日名
 */
export const WEEKDAYS_JP = ['月', '火', '水', '木', '金', '土', '日'];
export const WEEKDAYS_FULL_JP = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];

/**
 * 指定した日付の週の開始日（月曜日）を取得
 */
export const getWeekStart = (date) => {
  return startOfWeek(date, { weekStartsOn: 1 }); // 月曜日開始
};

/**
 * 指定した日付の週の終了日（日曜日）を取得
 */
export const getWeekEnd = (date) => {
  return endOfWeek(date, { weekStartsOn: 1 }); // 月曜日開始
};

/**
 * 週の日付配列を生成（月曜日から日曜日）
 */
export const generateWeekDates = (startDate) => {
  const weekStart = getWeekStart(startDate);
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(weekStart, i));
  }
  
  return dates;
};

/**
 * 前の週を取得
 */
export const getPreviousWeek = (date) => {
  return subWeeks(date, 1);
};

/**
 * 次の週を取得
 */
export const getNextWeek = (date) => {
  return addWeeks(date, 1);
};

/**
 * 日付を日本語形式でフォーマット
 */
export const formatDateJP = (date, formatStr = 'yyyy年MM月dd日') => {
  return format(date, formatStr, { locale: ja });
};

/**
 * 日付を曜日付きでフォーマット
 */
export const formatDateWithWeekday = (date) => {
  return format(date, 'MM月dd日(E)', { locale: ja });
};

/**
 * 週表示用のヘッダーフォーマット
 */
export const formatWeekHeader = (startDate, endDate) => {
  const startYear = format(startDate, 'yyyy');
  const endYear = format(endDate, 'yyyy');
  
  if (startYear === endYear) {
    return `${format(startDate, 'yyyy年MM月dd日', { locale: ja })} 〜 ${format(endDate, 'MM月dd日', { locale: ja })}`;
  } else {
    return `${format(startDate, 'yyyy年MM月dd日', { locale: ja })} 〜 ${format(endDate, 'yyyy年MM月dd日', { locale: ja })}`;
  }
};

/**
 * 時間を表示用にフォーマット
 */
export const formatTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
};

/**
 * 時間範囲を表示用にフォーマット
 */
export const formatTimeRange = (startTime, duration = 30) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endMinutes = minutes + duration;
  const endHours = endMinutes >= 60 ? hours + 1 : hours;
  const adjustedEndMinutes = endMinutes >= 60 ? endMinutes - 60 : endMinutes;
  
  const endTime = `${endHours.toString().padStart(2, '0')}:${adjustedEndMinutes.toString().padStart(2, '0')}`;
  
  return `${startTime}-${endTime}`;
};

/**
 * 今日かどうかを判定
 */
export const isDateToday = (date) => {
  return isToday(date);
};

/**
 * 日付が同じかどうかを判定
 */
export const isDateSame = (date1, date2) => {
  return isSameDay(date1, date2);
};

/**
 * 予約可能日かどうかを判定（今日以降）
 */
export const isBookableDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return !isBefore(targetDate, today);
};

/**
 * 営業日かどうかを判定
 */
export const isBusinessDay = (date, businessHours) => {
  const dayNameJP = getDayNameJP(date);
  return businessHours[dayNameJP] && businessHours[dayNameJP].isAvailable;
};

/**
 * 日付から曜日名を取得（英語）
 */
export const getDayName = (date) => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[date.getDay()];
};

/**
 * 日付から日本語曜日名を取得（営業時間データ用）
 */
export const getDayNameJP = (date) => {
  const dayNamesJP = ['日', '月', '火', '水', '木', '金', '土'];
  return dayNamesJP[date.getDay()];
};

/**
 * 日付から日本語曜日を取得
 */
export const getWeekdayJP = (date) => {
  return WEEKDAYS_JP[date.getDay() === 0 ? 6 : date.getDay() - 1];
};

/**
 * 文字列から日付オブジェクトに変換
 */
export const parseDate = (dateStr) => {
  return parseISO(dateStr);
};

/**
 * 日付を文字列（YYYY-MM-DD）に変換
 */
export const formatDateString = (date) => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * 現在時刻を取得（HH:mm形式）
 */
export const getCurrentTime = () => {
  return format(new Date(), 'HH:mm');
};

/**
 * 予約可能時間かどうかを判定（30分後の時間のみ予約可能）
 */
export const isBookableTime = (date, time) => {
  const now = new Date();
  const bookingDateTime = new Date(date);
  const [hours, minutes] = time.split(':').map(Number);
  bookingDateTime.setHours(hours, minutes, 0, 0);
  
  // 現在時刻から30分後以降のみ予約可能
  const minBookingTime = new Date(now.getTime() + 30 * 60 * 1000);
  
  return isAfter(bookingDateTime, minBookingTime);
};

/**
 * 週番号を取得
 */
export const getWeekNumber = (date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - startOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};

/**
 * 営業時間内かどうかを判定
 */
export const isWithinBusinessHours = (date, time, businessHours) => {
  const dayNameJP = getDayNameJP(date);
  const dayHours = businessHours[dayNameJP];
  
  if (!dayHours || !dayHours.isAvailable) {
    return false;
  }
  
  return time >= dayHours.start && time < dayHours.end;
}; 