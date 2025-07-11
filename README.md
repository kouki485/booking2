# 予約管理システム

総合予約管理システムです。顧客からの予約受付から管理者による予約管理まで、一括して管理できるWebアプリケーションです。

## 🌟 主な機能

### 顧客向け機能
- 📅 **週表示カレンダー**: 直感的な週間ビューで空き時間を確認
- ⏰ **30分単位予約**: 細かい時間設定で効率的な予約管理
- 👤 **シンプル予約**: お名前のみの簡単入力
- ✅ **即座確認**: リアルタイムで予約可能時間を表示

### 管理者向け機能
- 🔐 **認証システム**: Firebase Authenticationによる安全なログイン
- 📊 **予約一覧管理**: 日付別・時間別の予約確認と削除
- ⚙️ **営業時間設定**: 曜日別の営業時間・休業日設定
- 📧 **自動メール通知**: 新規予約・キャンセル時の自動通知

### 技術仕様
- 🔄 **リアルタイム同期**: Firestoreによるデータのリアルタイム更新
- 📱 **レスポンシブデザイン**: モバイル・タブレット・PC対応
- 🛡️ **セキュリティ**: XSS対策、入力値検証、Firestore Security Rules
- 🎨 **モダンUI**: Tailwind CSSによる美しいインターフェース

## 🚀 技術スタック

- **フロントエンド**: React 18, React Router, React Hooks
- **バックエンド**: Firebase Firestore, Firebase Authentication, Firebase Functions
- **UI/デザイン**: Tailwind CSS
- **メール送信**: Gmail SMTP (Nodemailer)
- **日本語対応**: 完全日本語ローカライゼーション

## 📋 要件

- Node.js 16.0以上
- npm または yarn
- Firebaseプロジェクト
- Gmailアカウント（メール通知用）

## 🛠️ インストール手順

### 1. プロジェクトのクローン
```bash
git clone <repository-url>
cd booking
```

### 2. 依存関係のインストール
```bash
# フロントエンド依存関係
npm install

# Firebase Functions依存関係
cd functions
npm install
cd ..
```

### 3. Firebase設定

#### 3.1 Firebaseプロジェクトの作成
1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Authentication, Firestore Database, Functions, Hostingを有効化

#### 3.2 Firebase設定ファイル
`src/services/firebase.js` に以下の設定を記入：

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 4. Firebase CLIの設定
```bash
# Firebase CLIのインストール
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# プロジェクトの初期化（既に設定済みの場合はスキップ）
firebase init
```

### 5. メール通知の設定

#### 5.1 Gmailアプリパスワードの生成
1. Googleアカウントの2段階認証を有効化
2. [アプリパスワード](https://myaccount.google.com/apppasswords)を生成

#### 5.2 Firebase Functions環境変数の設定
```bash
firebase functions:config:set email.user="your-gmail@gmail.com"
firebase functions:config:set email.password="your-app-password"
firebase functions:config:set email.notify_to="notification-email@example.com"
```

### 6. Firestore Security Rulesのデプロイ
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 🏃‍♂️ 開発環境での起動

### フロントエンド開発サーバー
```bash
npm start
```
http://localhost:3000 でアプリケーションが起動します。

### Firebase Emulator（開発用）
```bash
firebase emulators:start
```

## 🚀 本番環境へのデプロイ

### 1. フロントエンドのビルドとデプロイ
```bash
npm run build
firebase deploy --only hosting
```

### 2. Firebase Functionsのデプロイ
```bash
firebase deploy --only functions
```

### 3. 全体デプロイ
```bash
firebase deploy
```

## 📊 データ構造

### 予約データ (bookings)
```javascript
{
  id: "自動生成ID",
  date: "2024-01-15",
  time: "10:00",
  customerName: "田中太郎",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 営業時間設定 (businessHours)
```javascript
{
  monday: { closed: false, open: "09:00", close: "18:00" },
  tuesday: { closed: false, open: "09:00", close: "18:00" },
  wednesday: { closed: true },
  // ... 他の曜日
}
```

## 🔧 設定可能項目

### 営業時間設定
- 曜日別の営業時間
- 休業日設定
- 時間単位: 30分間隔

### 予約制限
- 1つの時間枠に最大3名まで予約可能
- 同一顧客による重複予約の防止
- 過去の日付への予約禁止

### メール通知
- 新規予約時の自動通知
- 予約キャンセル時の自動通知
- 美しいHTMLメールテンプレート

## 🛡️ セキュリティ対策

### フロントエンド
- XSS攻撃対策（入力値サニタイゼーション）
- SQLインジェクション検出
- 入力値バリデーション
- CSRFトークン保護

### バックエンド
- Firestore Security Rules
- Firebase Authentication
- 管理者権限の分離
- データアクセス制限

## 📱 対応デバイス

- **デスクトップ**: Windows, macOS, Linux
- **タブレット**: iPad, Android タブレット
- **スマートフォン**: iPhone, Android
- **ブラウザ**: Chrome, Firefox, Safari, Edge

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. Firebase接続エラー
```bash
# Firebase設定を確認
firebase projects:list
firebase use your-project-id
```

#### 2. メール送信エラー
```bash
# Firebase Functions設定を確認
firebase functions:config:get
```

#### 3. ビルドエラー
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 4. Firestore権限エラー
```bash
# セキュリティルールを再デプロイ
firebase deploy --only firestore:rules
```

## 📞 サポート

### 管理者アカウント作成
初回利用時は以下の手順で管理者アカウントを作成：

1. `/admin/login` にアクセス
2. 「アカウント作成」をクリック
3. メールアドレスとパスワードを入力
4. Firebase Consoleで必要に応じて権限を調整

### メール設定テスト
管理画面から「メール設定テスト」機能を使用して、メール送信が正常に動作することを確認できます。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 貢献

バグ報告や機能要求は、GitHubのIssuesでお知らせください。

---

## 📝 更新履歴

### v1.0.0 (2024-01-XX)
- 初期リリース
- 基本的な予約管理機能
- 管理者認証システム
- メール通知機能
- レスポンシブデザイン

---

**予約管理システム** - 効率的で使いやすい予約管理を実現 