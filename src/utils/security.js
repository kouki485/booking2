/**
 * セキュリティ関連のユーティリティ
 */

// レート制限のための記録
const rateLimitStore = new Map();

/**
 * レート制限の実装
 * @param {string} key - レート制限のキー（IPアドレスやユーザーIDなど）
 * @param {number} maxRequests - 最大リクエスト数（デフォルト: 10）
 * @param {number} windowMs - 時間窓（ミリ秒、デフォルト: 15分）
 * @returns {boolean} - リクエストが許可されるかどうか
 */
export const checkRateLimit = (key, maxRequests = 10, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  
  const requests = rateLimitStore.get(key);
  
  // 古いリクエストを削除
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= maxRequests) {
    return false; // レート制限に達している
  }
  
  // 新しいリクエストを記録
  recentRequests.push(now);
  rateLimitStore.set(key, recentRequests);
  
  return true;
};

/**
 * IPアドレスの取得（簡易版）
 */
export const getClientIP = () => {
  // ブラウザ環境では完全なIPアドレスの取得は制限されているため
  // セッションIDやブラウザフィンガープリントを代替として使用
  return generateSessionId();
};

/**
 * セッションIDの生成
 */
export const generateSessionId = () => {
  if (sessionStorage.getItem('sessionId')) {
    return sessionStorage.getItem('sessionId');
  }
  
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : generateFallbackId();
  sessionStorage.setItem('sessionId', sessionId);
  return sessionId;
};

/**
 * フォールバック用のID生成（crypto.randomUUIDが使えない場合）
 */
const generateFallbackId = () => {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * セキュリティメタタグの設定（フロントエンド用簡易版）
 */
export const setupBasicSecurity = () => {
  // Referrer-Policy（メタタグで設定可能）
  const referrerPolicy = document.createElement('meta');
  referrerPolicy.name = 'referrer';
  referrerPolicy.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrerPolicy);
  
  // Viewport設定（セキュリティ向上）
  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    document.head.appendChild(viewportMeta);
  }
};

/**
 * ブルートフォース攻撃の検出
 */
export const detectBruteForce = (identifier, maxAttempts = 5, windowMs = 30 * 60 * 1000) => {
  const key = `bruteforce_${identifier}`;
  return !checkRateLimit(key, maxAttempts, windowMs);
};

/**
 * 異常なアクセスパターンの検出
 */
export const detectAnomalousActivity = (identifier, activityType) => {
  const key = `activity_${identifier}_${activityType}`;
  
  // 1分間に20回以上のアクセスは異常とみなす
  if (!checkRateLimit(key, 20, 60 * 1000)) {
    console.warn(`異常なアクティビティを検出: ${identifier} - ${activityType}`);
    return true;
  }
  
  return false;
};

/**
 * SQLインジェクション検出（フロントエンド用簡易版）
 */
export const detectSQLInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
    /(\s|^)(or|and)\s/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * XSS検出
 */
export const detectXSS = (input) => {
  if (typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*style[\s]*=[\s]*[^>]*>/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * 入力のサニタイゼーション（強化版）
 */
export const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return '';
  
  const {
    maxLength = 1000,
    allowHTML = false,
    allowSpecialChars = true
  } = options;
  
  let sanitized = input.trim();
  
  // 長さ制限
  sanitized = sanitized.substring(0, maxLength);
  
  // XSS対策
  if (!allowHTML) {
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // 特殊文字の除去（オプション）
  if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[<>\"'`]/g, '');
  }
  
  return sanitized;
};

/**
 * ログイン試行回数の制限
 */
export const checkLoginAttempts = (identifier) => {
  const key = `login_${identifier}`;
  const maxAttempts = 5;
  const windowMs = 30 * 60 * 1000; // 30分
  
  return checkRateLimit(key, maxAttempts, windowMs);
};

/**
 * セキュリティイベントのログ記録
 */
export const logSecurityEvent = (eventType, details = {}) => {
  const timestamp = new Date().toISOString();
  const sessionId = generateSessionId();
  
  const logEntry = {
    timestamp,
    sessionId,
    eventType,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // 本番環境では外部のログサービスに送信することを推奨
  if (process.env.NODE_ENV === 'development') {
    console.warn('Security Event:', logEntry);
  }
  
  // セキュリティログを localStorage に保存（開発用）
  const securityLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
  securityLogs.push(logEntry);
  
  // 最新の100件のみ保持
  if (securityLogs.length > 100) {
    securityLogs.splice(0, securityLogs.length - 100);
  }
  
  localStorage.setItem('securityLogs', JSON.stringify(securityLogs));
};

/**
 * セキュリティ初期化
 */
export const initializeSecurity = () => {
  try {
    setupBasicSecurity();
    
    // セキュリティイベントを記録
    logSecurityEvent('security_initialized', {
      timestamp: new Date().toISOString()
    });
    
  
  } catch (error) {
    console.error('セキュリティ初期化エラー:', error);
  }
}; 