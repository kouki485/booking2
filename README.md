# 美容院予約管理システム

React + Firebase で構築された美容院予約管理システムです。

## 主な機能

- 📅 **予約管理**: 日時指定による予約作成・管理
- 👤 **顧客管理**: 顧客情報の登録・管理
- 🔒 **管理者機能**: 予約状況の確認・操作
- 📱 **レスポンシブ**: モバイル・デスクトップ対応
- 🎨 **美しいUI**: Tailwind CSSによる洗練されたデザイン

## 技術スタック

- **フロントエンド**: React 18, TypeScript
- **バックエンド**: Firebase (Firestore, Authentication, Functions)
- **スタイリング**: Tailwind CSS
- **ルーティング**: React Router
- **フォーム**: React Hook Form

## 必要な環境

- Node.js 18以上
- npm または yarn
- Firebase プロジェクト

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/salon-booking-system.git
cd salon-booking-system
```

### 2. 依存関係のインストール

```bash
npm install
cd functions
npm install
```

### 3. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) で新しいプロジェクトを作成
2. Authentication を有効化（Email/Password認証）
3. Firestore Database を作成
4. Firebase Functions を有効化

### 4. Firebase 設定

```bash
firebase login
firebase init
```

プロジェクトの設定で以下を選択：
- Firestore
- Functions
- Hosting

### 5. 環境変数の設定

`src/services/firebase.js` で Firebase 設定を確認し、必要に応じて環境変数を設定。

### 6. 起動

```bash
npm start
```

## デプロイ

```bash
# プロジェクトをビルド
npm run build

# Firebase にデプロイ
firebase deploy
```

## 使用方法

### 顧客側

1. 予約ページにアクセス
2. 希望の日時を選択
3. 顧客情報を入力
4. 予約を確定

### 管理者側

1. `/admin/login` にアクセス
2. 管理者でログイン
3. 予約状況を確認・管理

## プロジェクト構成

```
salon-booking-system/
├── public/
├── src/
│   ├── components/
│   │   ├── booking/     # 予約関連コンポーネント
│   │   ├── admin/       # 管理者画面
│   │   └── common/      # 共通コンポーネント
│   ├── hooks/           # カスタムフック
│   ├── services/        # Firebase サービス
│   ├── utils/           # ユーティリティ関数
│   └── styles/          # スタイルファイル
├── functions/           # Firebase Functions
└── firestore.rules      # Firestore セキュリティルール
```

## 主要な機能

### 予約システム
- カレンダー表示による日時選択
- 予約枠の空き状況リアルタイム表示
- 予約の作成・確認・キャンセル

### 管理機能
- 予約一覧の確認
- 予約の管理（承認・キャンセル）
- 顧客情報の管理

### セキュリティ
- Firebase Authentication による認証
- Firestore セキュリティルールによるデータ保護
- 入力値のサニタイズ・バリデーション

## カスタマイズ

### スタイリング
Tailwind CSS を使用しているため、`tailwind.config.js` でカスタマイズ可能。

### 予約時間の設定
`src/utils/dateUtils.js` で営業時間や予約可能時間を設定。

### セキュリティルール
`firestore.rules` でデータアクセス権限を制御。

## トラブルシューティング

### よくある問題

#### 1. Firebase 接続エラー
- Firebase 設定が正しいか確認
- プロジェクトIDが正しいか確認

#### 2. 認証エラー
- Firebase Authentication が有効化されているか確認
- セキュリティルールが適切に設定されているか確認

#### 3. ビルドエラー
- Node.js のバージョンが18以上か確認
- 依存関係が正しくインストールされているか確認

## 今後の拡張予定

- 複数店舗対応
- 予約リマインダー機能
- 売上レポート機能
- 顧客レビュー機能

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 貢献

バグ報告や機能要求は Issues で受け付けています。
プルリクエストも歓迎します。

## サポート

質問やサポートが必要な場合は、Issues でお知らせください。 