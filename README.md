# ARC Raiders Support Tool

ARC Raidersプレイヤー向けの攻略・管理ツールです。アイテム管理、レシピ検索、クエスト進捗管理、パーティー編成などの機能を提供します。

## 機能

### 📦 アイテム管理
- MetaForge APIからアイテムデータを自動同期
- カテゴリ・レアリティ・タグによるフィルタリング
- 日本語翻訳の編集機能

### 🔧 レシピ管理
- クラフトレシピの登録・編集
- 必要素材の管理
- 製作設備（Workbench、Gunsmith等）の指定

### 🔍 素材逆引き検索
- 素材がどのレシピ・クエストで使われるか検索
- 日本語/英語での検索対応

### 🎯 クエスト管理
- APIからクエストデータを同期
- 進捗をブラウザCookieに保存（ユーザー別）
- 納品アイテムの数量管理
- クエスト名の日本語翻訳編集

### ⭐ ウィッシュリスト
- 作りたいアイテムを登録
- 優先度の設定

### 📊 ダッシュボード
- ウィッシュリスト・クエストから必要素材を集計
- 必要素材の一覧表示

### 👥 パーティー管理
- パーティーの作成・メンバー管理
- 設計図マトリクス（誰が何を持っているか一覧）
- モバイル対応カード表示

## 技術スタック

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite + Prisma ORM
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Data Source**: MetaForge API

## セットアップ

```bash
# 依存関係のインストール
npm install

# データベースのセットアップ
npx prisma db push
npx prisma generate

# 開発サーバーの起動
npm run dev
```

開発サーバーは http://localhost:3939 で起動します。

## 初回セットアップ

1. アプリにアクセス後、ホームページの「APIから同期」ボタンをクリック
2. アイテムデータがMetaForge APIから取得されます
3. `/quests`で「APIから同期」をクリックしてクエストデータを取得

## 環境変数

`.env.local`ファイルを作成:

```env
DATABASE_URL="file:./dev.db"
```

## スクリーンショット

### デスクトップ
- アイテム一覧: カード形式でアイテムを表示
- 設計図マトリクス: テーブル形式でメンバーの所持状況を表示

### モバイル
- ハンバーガーメニュー対応
- 設計図マトリクス: 折りたたみカード形式

## Docker環境構築

プロジェクトには `docker-compose.yml` が同梱されています。

```bash
# ビルドと起動
docker compose up -d --build

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

### 注意事項
- データは `./data` ディレクトリに永続化されます
- 初回起動後、http://localhost:3939 にアクセス
- 「APIから同期」ボタンでデータを取得してください


## ライセンス

This is a fan-made tool. Not affiliated with Embark Studios.

Data provided by [MetaForge](https://metaforge.app/arc-raiders).
