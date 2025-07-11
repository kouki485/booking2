import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

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