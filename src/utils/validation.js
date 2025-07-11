/**
 * 入力値検証とサニタイゼーション用ユーティリティ
 */

/**
 * 文字列の基本的なサニタイゼーション
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>\"']/g, '') // XSS対策：HTMLタグと引用符を除去
    .substring(0, 100); // 長すぎる入力を制限
};

/**
 * 顧客名のバリデーション
 */
export const validateCustomerName = (name) => {
  const sanitized = sanitizeString(name);
  
  const errors = [];
  
  if (!sanitized) {
    errors.push('お名前を入力してください');
  } else if (sanitized.length < 1) {
    errors.push('お名前を入力してください');
  } else if (sanitized.length > 50) {
    errors.push('お名前は50文字以内で入力してください');
  } else if (!/^[ぁ-んァ-ヶ一-龯a-zA-Z\s　]+$/.test(sanitized)) {
    errors.push('お名前は日本語またはアルファベットで入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
};

/**
 * メールアドレスのバリデーション
 */
export const validateEmail = (email) => {
  const sanitized = sanitizeString(email);
  
  const errors = [];
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  
  if (!sanitized) {
    errors.push('メールアドレスを入力してください');
  } else if (!emailRegex.test(sanitized)) {
    errors.push('正しいメールアドレスを入力してください');
  } else if (sanitized.length > 100) {
    errors.push('メールアドレスが長すぎます');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized.toLowerCase()
  };
};

/**
 * 日付のバリデーション
 */
export const validateBookingDate = (date) => {
  const errors = [];
  
  if (!date) {
    errors.push('日付を選択してください');
    return { isValid: false, errors };
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  
  // 過去の日付チェック
  if (selectedDate < today) {
    errors.push('過去の日付は選択できません');
  }
  
  // 未来すぎる日付チェック（3ヶ月先まで）
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  maxDate.setHours(23, 59, 59, 999);
  
  if (selectedDate > maxDate) {
    errors.push('3ヶ月先までの日付を選択してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 時間のバリデーション
 */
export const validateBookingTime = (time, date) => {
  const errors = [];
  
  if (!time) {
    errors.push('時間を選択してください');
    return { isValid: false, errors };
  }
  
  // 時間フォーマットチェック
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    errors.push('正しい時間形式で入力してください（HH:MM）');
    return { isValid: false, errors };
  }
  
  // 30分単位チェック
  const [hours, minutes] = time.split(':').map(Number);
  if (minutes !== 0 && minutes !== 30) {
    errors.push('30分単位で時間を選択してください');
  }
  
  // 当日の場合、現在時刻から30分後以降かチェック
  if (date) {
    const now = new Date();
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly.getTime() === today.getTime()) {
      const minTime = new Date(now.getTime() + 30 * 60 * 1000);
      if (selectedDateTime <= minTime) {
        errors.push('現在時刻から30分後以降の時間を選択してください');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * パスワードのバリデーション
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('パスワードを入力してください');
  } else if (password.length < 6) {
    errors.push('パスワードは6文字以上で入力してください');
  } else if (password.length > 128) {
    errors.push('パスワードは128文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 営業時間のバリデーション
 */
export const validateBusinessHours = (businessHours) => {
  const errors = [];
  
  if (!businessHours || typeof businessHours !== 'object') {
    errors.push('営業時間設定が不正です');
    return { isValid: false, errors };
  }
  
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of daysOfWeek) {
    const dayData = businessHours[day];
    
    if (!dayData) {
      errors.push(`${day}の設定がありません`);
      continue;
    }
    
    if (typeof dayData.closed !== 'boolean') {
      errors.push(`${day}の休業日設定が不正です`);
    }
    
    if (!dayData.closed) {
      if (!dayData.open || !dayData.close) {
        errors.push(`${day}の営業時間が設定されていません`);
      } else {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        if (!timeRegex.test(dayData.open)) {
          errors.push(`${day}の開店時間の形式が不正です`);
        }
        
        if (!timeRegex.test(dayData.close)) {
          errors.push(`${day}の閉店時間の形式が不正です`);
        }
        
        if (dayData.open >= dayData.close) {
          errors.push(`${day}の開店時間は閉店時間より前に設定してください`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 一般的な入力値サニタイゼーション
 */
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return sanitizeString(input);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeString(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

/**
 * SQLインジェクション対策（基本的なチェック）
 */
export const detectSQLInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/i,
    /((\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+))/i,
    /((\\x3C)|<)((\s|\\n|\\r|\\t)*(\\x2F)|\/)*script((\s|\\n|\\r|\\t)*>)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * XSS攻撃パターンの検出
 */
export const detectXSS = (input) => {
  if (typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[\\s]*=[\\s]*["\']?[\\s]*javascript:/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * 安全でない文字の検出と除去
 */
export const removeDangerousChars = (input) => {
  if (typeof input !== 'string') return input;
  
  // 危険な文字を除去
  return input
    .replace(/[<>]/g, '') // HTMLタグの開始・終了文字
    .replace(/['"]/g, '') // クォート文字
    .replace(/[&]/g, '') // アンパサンド
    .replace(/javascript:/gi, '') // JavaScript URL
    .replace(/on\w+=/gi, ''); // イベントハンドラ
}; 