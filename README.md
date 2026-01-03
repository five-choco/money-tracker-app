# AI領収書カレンダー

レシートの写真をアップロードするだけで、AIが内容を解析し、カレンダーに支出を記録してくれるアプリケーションです。

## 概要

このアプリケーションは、日々の面倒な支出管理を簡略化することを目的としています。ユーザーは受け取ったレシートをスマートフォンで撮影し、その画像をアップロードするだけで、AIが自動的に「日付」「金額」「店名」「カテゴリ」を抽出し、入力フォームに反映します。内容を確認して保存するだけで、カレンダーに支出が記録されていきます。

## 主な機能

-   **AIによるレシート解析**:
    -   アップロードされたレシート画像をGoogle Gemini APIが解析します。
    -   日付、金額、店名、カテゴリを自動で抽出します。
-   **カレンダー形式での支出管理**:
    -   支出を記録した日に印が表示され、一目で支出があった日が分かります。
    -   日付を選択すると、その日の支出履歴を一覧で確認できます。
-   **支出の手動登録・編集・削除**:
    -   AI解析後、内容を修正して保存できます。
    -   もちろん、レシートがなくても手動で支出を登録できます。
-   **レスポンシブデザイン**:
    -   PCでもスマートフォンでも見やすいレイアウトに対応しています。

## 使用技術

このプロジェクトで使用されている主な技術は以下の通りです。

-   **フロントエンド**:
    -   React 19
    -   TypeScript
    -   Vite
-   **バックエンドサービス (BaaS)**:
    -   Supabase (データベース、匿名認証)
-   **AI**:
    -   Google Gemini API (gemini-1.5-flash)
-   **テスト**:
    -   Vitest
    -   React Testing Library
-   **CI/CD**:
    -   GitHub Actions

## プロジェクトの構造

主要なディレクトリとファイルの役割です。

```
.
├── api/                  # Vercelサーバーレス関数
│   └── analyze-receipt.ts  # Gemini APIを呼び出すバックエンド処理
├── public/               # 静的ファイル
├── src/
│   ├── components/       # Reactコンポーネント
│   │   ├── CalendarSection.tsx
│   │   ├── ExpenseForm.tsx
│   │   ├── Header.tsx
│   │   ├── HistoryList.tsx
│   │   └── index.ts      # コンポーネントの再エクスポート
│   ├── lib/
│   │   └── gemini.ts     # バックエンドAPIを呼び出すクライアント側関数
│   ├── App.css           # グローバルなスタイル
│   ├── App.tsx           # アプリケーションのメインコンポーネント
│   ├── main.tsx          # アプリケーションのエントリーポイント
│   └── types.ts          # 共有の型定義
├── .env.example          # 環境変数のテンプレート
├── package.json          # プロジェクトの依存関係とスクリプト
└── vite.config.ts        # ViteとVitestの設定
```

## セットアップ方法

### 1. リポジトリをクローン

```bash
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git
cd <YOUR_REPOSITORY>
```

### 2. 環境変数の設定

プロジェクトのルートディレクトリに`.env.local`という名前のファイルを作成し、`.env.example`を参考に以下の内容を記述してください。

```plaintext
# .env.local

# Supabase
VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

# Google Gemini API
VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

-   `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` は、Supabaseのプロジェクト設定ページから取得できます。
-   `VITE_GEMINI_API_KEY` は、Google AI Studioで取得したAPIキーを設定してください。

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスすると、アプリケーションが表示されます。

## 利用可能なスクリプト

`package.json` に定義されている主なスクリプトです。

| スクリプト         | 説明                                                               |
| :----------------- | :----------------------------------------------------------------- |
| `npm run dev`      | 開発サーバーを起動します。                                         |
| `npm run build`    | 本番用にプロジェクトをビルドします（型チェックも同時に実行）。     |
| `npm run lint`     | ESLintを実行し、コードの静的解析を行います。                       |
| `npm test`         | Vitestを実行し、ユニットテスト・結合テストを一度だけ実行します。   |
| `npm test:ui`      | VitestのUIモードでテストを起動します。                             |
| `npm run coverage` | テストのカバレッジレポートを生成します。                           |
| `npm run preview`  | ビルド後の本番用ファイルをローカルでプレビューします。             |
