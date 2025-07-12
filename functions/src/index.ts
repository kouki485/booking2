import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firebase Admin初期化
admin.initializeApp();

// 単純なヘルスチェック用のHTTPS関数
export const healthCheck = functions.https.onRequest(async (req, res) => {
  // CORS設定
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    res.status(200).json({
      success: true,
      message: 'Firebase Functions is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}); 