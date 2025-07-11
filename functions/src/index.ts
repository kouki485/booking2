import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Firebase Admin初期化
admin.initializeApp();

// Gmail SMTP設定
const gmailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().email?.user || 'mwd3145@gmail.com',
    pass: functions.config().email?.password || 'oajy gyub zxvn imkr'
  }
});

// 新規予約作成時のメール通知
export const sendBookingNotification = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    try {
      const booking = snap.data();
      const bookingId = context.params.bookingId;

      // 日本語の日付フォーマット
      const bookingDate = new Date(booking.date + 'T00:00:00+09:00');
      const dateStr = bookingDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });

      // 時間範囲の計算
      const [hours, minutes] = booking.time.split(':').map(Number);
      const endMinutes = minutes + 30;
      const endHours = endMinutes >= 60 ? hours + 1 : hours;
      const adjustedEndMinutes = endMinutes >= 60 ? endMinutes - 60 : endMinutes;
      const endTime = `${endHours.toString().padStart(2, '0')}:${adjustedEndMinutes.toString().padStart(2, '0')}`;
      const timeRange = `${booking.time}-${endTime}`;

      const mailOptions = {
        from: functions.config().email?.user || 'mwd3145@gmail.com',
        to: functions.config().email?.notify_to || 'fruit3146@yahoo.co.jp',
        subject: '【美容院】新規予約通知',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>新規予約通知</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px; }
              .booking-details { background-color: #f0f8f0; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .detail-row { display: flex; margin-bottom: 10px; }
              .detail-label { font-weight: bold; color: #28a745; min-width: 100px; }
              .detail-value { color: #333; }
              .emoji { font-size: 18px; margin-right: 8px; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🎉 新しい予約が入りました</h1>
              </div>
              
              <div class="content">
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                  お疲れ様です。新しい予約が完了しましたのでお知らせします。
                </p>
                
                <div class="booking-details">
                  <h3 style="margin-top: 0; color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
                    【予約詳細】
                  </h3>
                  
                  <div class="detail-row">
                    <div class="detail-label">
                      <span class="emoji">📅</span>日時:
                    </div>
                    <div class="detail-value">
                      ${dateStr} ${timeRange}
                    </div>
                  </div>
                  
                  <div class="detail-row">
                    <div class="detail-label">
                      <span class="emoji">👤</span>お客様:
                    </div>
                    <div class="detail-value">
                      ${booking.customerName}
                    </div>
                  </div>
                  
                  <div class="detail-row">
                    <div class="detail-label">
                      <span class="emoji">🆔</span>予約ID:
                    </div>
                    <div class="detail-value">
                      ${bookingId.substring(0, 8)}...
                    </div>
                  </div>
                  
                  <div class="detail-row">
                    <div class="detail-label">
                      <span class="emoji">⏰</span>予約時刻:
                    </div>
                    <div class="detail-value">
                      ${booking.createdAt.toDate().toLocaleString('ja-JP')}
                    </div>
                  </div>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  詳細は管理画面でご確認ください。<br>
                  当日の準備をよろしくお願いします。
                </p>
              </div>
              
              <div class="footer">
                <p style="margin: 0;">美容院予約管理システム</p>
                <p style="margin: 5px 0 0 0;">自動送信メールです。返信の必要はありません。</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await gmailTransporter.sendMail(mailOptions);
      
      functions.logger.info('予約通知メール送信成功', {
        bookingId,
        customerName: booking.customerName,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      functions.logger.error('予約通知メール送信エラー', {
        bookingId: context.params.bookingId,
        error: error.message
      });
      
      // エラーが発生してもFirestore操作は成功させる
      return { success: false, error: error.message };
    }
  });

// 予約削除時のメール通知
export const sendBookingCancelNotification = functions.firestore
  .document('bookings/{bookingId}')
  .onDelete(async (snap, context) => {
    try {
      const booking = snap.data();
      const bookingId = context.params.bookingId;

      // 日本語の日付フォーマット
      const bookingDate = new Date(booking.date + 'T00:00:00+09:00');
      const dateStr = bookingDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });

      // 時間範囲の計算
      const [hours, minutes] = booking.time.split(':').map(Number);
      const endMinutes = minutes + 30;
      const endHours = endMinutes >= 60 ? hours + 1 : hours;
      const adjustedEndMinutes = endMinutes >= 60 ? endMinutes - 60 : endMinutes;
      const endTime = `${endHours.toString().padStart(2, '0')}:${adjustedEndMinutes.toString().padStart(2, '0')}`;
      const timeRange = `${booking.time}-${endTime}`;

      const mailOptions = {
        from: functions.config().email?.user || 'mwd3145@gmail.com',
        to: functions.config().email?.notify_to || 'fruit3146@yahoo.co.jp',
        subject: '【美容院】予約キャンセル通知',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>予約キャンセル通知</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px; }
              .booking-details { background-color: #fff5f5; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .detail-row { display: flex; margin-bottom: 10px; }
              .detail-label { font-weight: bold; color: #dc3545; min-width: 100px; }
              .detail-value { color: #333; }
              .emoji { font-size: 18px; margin-right: 8px; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">❌ 予約がキャンセルされました</h1>
              </div>
              
              <div class="content">
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                  お疲れ様です。以下の予約がキャンセル（削除）されましたのでお知らせします。
                </p>
                
                <div class="booking-details">
                  <h3 style="margin-top: 0; color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
                    【キャンセルされた予約詳細】
                  </h3>
                  
                  <div class="detail-row">
                    <div class="detail-label">
                      <span class="emoji">📅</span>日時:
                    </div>
                    <div class="detail-value">
                      ${dateStr} ${timeRange}
                    </div>
                  </div>
                  
                  <div class="detail-row">
                    <div class="detail-label">
                      <span class="emoji">👤</span>お客様:
                    </div>
                    <div class="detail-value">
                      ${booking.customerName}
                    </div>
                  </div>
                  
                  <div class="detail-row">
                    <div class="detail-label">
                      <span class="emoji">🆔</span>予約ID:
                    </div>
                    <div class="detail-value">
                      ${bookingId.substring(0, 8)}...
                    </div>
                  </div>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  該当時間帯の予約枠が空きました。<br>
                  必要に応じてスケジュールの調整をお願いします。
                </p>
              </div>
              
              <div class="footer">
                <p style="margin: 0;">美容院予約管理システム</p>
                <p style="margin: 5px 0 0 0;">自動送信メールです。返信の必要はありません。</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await gmailTransporter.sendMail(mailOptions);
      
      functions.logger.info('予約キャンセル通知メール送信成功', {
        bookingId,
        customerName: booking.customerName,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      functions.logger.error('予約キャンセル通知メール送信エラー', {
        bookingId: context.params.bookingId,
        error: error.message
      });
      
      return { success: false, error: error.message };
    }
  });

// メール設定テスト用のHTTPS関数
export const testEmailConfiguration = functions.https.onRequest(async (req, res) => {
  // CORS設定
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const testMailOptions = {
      from: functions.config().email?.user || 'mwd3145@gmail.com',
      to: functions.config().email?.notify_to || 'fruit3146@yahoo.co.jp',
      subject: '【美容院】メール設定テスト',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #28a745;">🧪 メール設定テスト</h2>
          <p>このメールが届いている場合、メール通知機能は正常に動作しています。</p>
          <p><strong>送信時刻:</strong> ${new Date().toLocaleString('ja-JP')}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            美容院予約管理システム - 自動送信メール
          </p>
        </div>
      `
    };

    const info = await gmailTransporter.sendMail(testMailOptions);
    
    functions.logger.info('テストメール送信成功', { messageId: info.messageId });
    
    res.status(200).json({
      success: true,
      message: 'テストメールを送信しました',
      messageId: info.messageId
    });
    
  } catch (error) {
    functions.logger.error('テストメール送信エラー', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}); 