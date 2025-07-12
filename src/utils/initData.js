import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { createAdminAccount } from '../services/authService';

// デフォルト対応可能時間データ
export const DEFAULT_AVAILABLE_HOURS = {
  月: { start: '10:00', end: '17:00', isAvailable: true },
  火: { start: '10:00', end: '17:00', isAvailable: true },
  水: { start: '10:00', end: '17:00', isAvailable: true },
  木: { start: '10:00', end: '17:00', isAvailable: true },
  金: { start: '10:00', end: '17:00', isAvailable: true },
  土: { start: '10:00', end: '16:00', isAvailable: true },
  日: { start: '10:00', end: '16:00', isAvailable: false }
};

// 管理者アカウントを初期化する関数
export const initializeAdminAccount = async () => {
  try {
    // アカウントが既に存在するかチェック用のマーカー
    const adminMarkerRef = doc(db, 'settings', 'adminInitialized');
    const adminMarkerDoc = await getDoc(adminMarkerRef);
    
    if (!adminMarkerDoc.exists()) {
      // 指定されたアカウント情報（セキュリティ考慮で環境変数から取得、なければデフォルト値）
      const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || 'admin@idea.com';
      const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD || 'xTC4PVMivKiC';
      
      // 管理者アカウントの作成を試行
      const result = await createAdminAccount(adminEmail, adminPassword);
      
      if (result.success) {
        // 作成成功時にマーカーを設定
        await setDoc(adminMarkerRef, {
          email: adminEmail,
          createdAt: new Date().toISOString(),
          note: 'Initial admin account created',
          status: 'success'
        });

      } else {
        // アカウントが既に存在する場合、マーカーを設定
        if (result.error && result.error.includes('既に使用されています')) {
          await setDoc(adminMarkerRef, {
            email: adminEmail,
            createdAt: new Date().toISOString(),
            note: 'Admin account already exists',
            status: 'exists'
          });

        } else {
          console.warn('管理者アカウント作成エラー:', result.error);
        }
      }
    } else {
      // 管理者アカウントは既に初期化済み
    }
  } catch (error) {
    console.warn('管理者アカウントの初期化エラー:', error);
    // 権限エラーなど、重要でないエラーの場合は処理を継続
    if (error.message && error.message.includes('Missing or insufficient permissions')) {
      // 権限不足のため管理者アカウント初期化をスキップ
    }
  }
};

// 対応可能時間を初期化する関数
export const initializeAvailableHours = async () => {
  try {
    const availableHoursRef = doc(db, 'settings', 'availableHours');
    const availableHoursDoc = await getDoc(availableHoursRef);
    
    if (!availableHoursDoc.exists()) {
      await setDoc(availableHoursRef, {
        hours: DEFAULT_AVAILABLE_HOURS,
        description: '実際に予約を受け付けることができる時間帯です',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

    }
  } catch (error) {
    console.warn('対応可能時間の初期化エラー:', error);
    // エラーが発生した場合、LocalStorageにデフォルト値を保存
    try {
      localStorage.setItem('availableHours', JSON.stringify(DEFAULT_AVAILABLE_HOURS));

    } catch (localStorageError) {
      console.warn('LocalStorageの保存に失敗:', localStorageError);
    }
  }
};

// すべてのデータを初期化する関数（エラーハンドリングを改善）
export const initializeData = async () => {
  try {
    // 対応可能時間の初期化
    await initializeAvailableHours();
    
    // 管理者アカウント初期化は別途実行（エラーが発生してもアプリケーションを停止させない）
    try {
      await initializeAdminAccount();
    } catch (adminError) {
      console.warn('管理者アカウント初期化をスキップしました:', adminError.message);
    }
  } catch (error) {
    console.warn('データの初期化でエラーが発生しました:', error);
  }
};

/**
 * 開発用：対応可能時間データを強制初期化
 */
export const resetAvailableHours = async () => {
  try {
    const availableHoursRef = doc(db, 'availableHours', 'default');
    
    const initialAvailableHours = {
      monday: {
        closed: false,
        open: "09:00",
        close: "18:00"
      },
      tuesday: {
        closed: false,
        open: "09:00",
        close: "18:00"
      },
      wednesday: {
        closed: false,
        open: "09:00",
        close: "18:00"
      },
      thursday: {
        closed: false,
        open: "09:00",
        close: "18:00"
      },
      friday: {
        closed: false,
        open: "09:00",
        close: "18:00"
      },
      saturday: {
        closed: false,
        open: "09:00",
        close: "17:00"
      },
      sunday: {
        closed: true,
        open: "",
        close: ""
      },
      updatedAt: new Date()
    };
    
    await setDoc(availableHoursRef, initialAvailableHours);

    
    return { 
      success: true, 
      message: '対応可能時間データをリセットしました',
      data: initialAvailableHours 
    };
    
  } catch (error) {
    console.error('対応可能時間のリセットエラー:', error);
    return { 
      success: false, 
      message: '対応可能時間のリセットに失敗しました',
      error: error.message 
    };
  }
}; 