/**
 * Googleカレンダーエクスポート機能
 * 予約データをiCal形式（.ics）に変換してダウンロード
 */

/**
 * 日付と時刻をiCal形式のDTSTART/DTENDに変換
 */
const formatICalDateTime = (dateStr, timeStr) => {
  const date = new Date(`${dateStr}T${timeStr}:00`);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * iCal形式のテキストをエスケープ
 */
const escapeICalText = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
};

/**
 * 予約データをiCal VEVENTに変換
 */
const createICalEvent = (booking) => {
  const startDateTime = formatICalDateTime(booking.date, booking.time);
  // 予約時間を1時間と仮定
  const endDate = new Date(`${booking.date}T${booking.time}:00`);
  endDate.setHours(endDate.getHours() + 1);
  const endDateTime = formatICalDateTime(
    endDate.toISOString().split('T')[0],
    endDate.toTimeString().split(' ')[0].slice(0, 5)
  );

  const summary = escapeICalText(`予約 - ${booking.customerName}`);
  const description = escapeICalText(
    `顧客名: ${booking.customerName}\n` +
    `年齢: ${booking.age || 'なし'}${booking.age ? '歳' : ''}\n` +
    `職業: ${booking.occupation || 'なし'}`
  );

  const uid = `booking-${booking.id}@booking-system`;
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  return `BEGIN:VEVENT
UID:${uid}
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${summary}
DESCRIPTION:${description}
CREATED:${now}
LAST-MODIFIED:${now}
STATUS:CONFIRMED
END:VEVENT`;
};

/**
 * 予約データをiCal形式に変換
 */
export const exportBookingsToICal = (bookings, options = {}) => {
  const { 
    calendarName = '予約管理システム',
    timezone = 'Asia/Tokyo'
  } = options;

  const header = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//予約管理システム//予約カレンダー//JA
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${escapeICalText(calendarName)}
X-WR-TIMEZONE:${timezone}
BEGIN:VTIMEZONE
TZID:${timezone}
X-LIC-LOCATION:${timezone}
BEGIN:STANDARD
DTSTART:20231105T020000
TZOFFSETFROM:+0900
TZOFFSETTO:+0900
TZNAME:JST
END:STANDARD
END:VTIMEZONE`;

  const events = bookings.map(booking => createICalEvent(booking)).join('\n');
  
  const footer = 'END:VCALENDAR';

  return `${header}\n${events}\n${footer}`;
};

/**
 * iCalファイルをダウンロード
 */
export const downloadICalFile = (icalContent, filename = 'bookings.ics') => {
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * 期間を指定して予約データをエクスポート
 */
export const exportBookingsByDateRange = async (startDate, endDate, fetchBookingsFn) => {
  try {
    const bookings = await fetchBookingsFn(startDate, endDate);
    
    if (bookings.length === 0) {
      alert('指定された期間に予約がありません。');
      return;
    }

    const icalContent = exportBookingsToICal(bookings, {
      calendarName: `予約管理システム (${startDate} - ${endDate})`
    });

    const filename = `bookings_${startDate}_${endDate}.ics`;
    downloadICalFile(icalContent, filename);
    
    return {
      success: true,
      count: bookings.length,
      filename
    };
  } catch (error) {
    console.error('カレンダーエクスポートエラー:', error);
    alert('エクスポートに失敗しました。もう一度お試しください。');
    return {
      success: false,
      error: error.message
    };
  }
}; 