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
    // 指定されたアカウント情報（セキュリティ考慮で環境変数から取得、なければデフォルト値）
    const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || 'admin@idea.com';
    const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD || 'xTC4PVMivKiC';
    
    // アカウントが既に存在するかチェック用のマーカー
    const adminMarkerRef = doc(db, 'settings', 'adminInitialized');
    const adminMarkerDoc = await getDoc(adminMarkerRef);
    
    if (!adminMarkerDoc.exists()) {
      // 管理者アカウントの作成を試行
      const result = await createAdminAccount(adminEmail, adminPassword);
      
      if (result.success) {
        // 作成成功時にマーカーを設定
        await setDoc(adminMarkerRef, {
          email: adminEmail,
          createdAt: new Date().toISOString(),
          note: 'Initial admin account created'
        });
        console.log('管理者アカウントを初期化しました');
      } else {
        // アカウントが既に存在する場合など、エラーでも処理を続行
        console.log('管理者アカウントの初期化をスキップしました:', result.error);
        
        // エラーでもマーカーを設定（重複実行を防ぐため）
        await setDoc(adminMarkerRef, {
          email: adminEmail,
          createdAt: new Date().toISOString(),
          note: 'Admin account initialization attempted',
          error: result.error
        });
      }
    } else {
      console.log('管理者アカウントは既に初期化済みです');
    }
  } catch (error) {
    console.warn('管理者アカウントの初期化エラー:', error);
    // エラーが発生してもアプリケーションの動作を継続
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
      console.log('対応可能時間を初期化しました');
    }
  } catch (error) {
    console.warn('対応可能時間の初期化エラー:', error);
    // エラーが発生した場合、LocalStorageにデフォルト値を保存
    try {
      localStorage.setItem('availableHours', JSON.stringify(DEFAULT_AVAILABLE_HOURS));
      console.log('LocalStorageに対応可能時間を保存しました');
    } catch (localStorageError) {
      console.warn('LocalStorageの保存に失敗:', localStorageError);
    }
  }
};

// すべてのデータを初期化する関数
export const initializeData = async () => {
  try {
    await initializeAvailableHours();
    await initializeAdminAccount();
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
    console.log('対応可能時間データをリセットしました');
    
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