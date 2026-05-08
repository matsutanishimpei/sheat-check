# 🪑 SeatCheck Studio

教室の座席配置を直感的に作成・編集し、**Supabase Realtime** を使って学生の授業理解度（OK/NG状態、コメント）を教員がリアルタイムに監視できる、型安全なフルスタック・モノレポアプリケーションです。

---

## ⚡️ クイックスタート (起動手順)

### 1. 依存関係のインストール
プロジェクトのルートディレクトリで以下を実行します。
```bash
npm install
```

### 2. ローカル SQLite (D1) データベースのセットアップ
バックエンド（D1）のマイグレーションファイルをローカルに適用します。
```bash
# packages/backend に移動して実行
cd packages/backend
npx wrangler d1 migrations apply DB --local
```

### 3. ローカル開発サーバーの起動
ルートディレクトリから、教員・学生画面（フロントエンド）と API（バックエンド）の双方のサーバーを起動します。
```bash
# バックエンドサーバーの起動 (http://127.0.0.1:8787)
npm run dev:backend

# フロントエンドサーバーの起動 (デフォルト http://localhost:5173、使用中の場合は 5174 や 5175 にフォールバック)
npm run dev:frontend
```
起動完了後、ターミナルに表示されたアドレス（例: **[http://localhost:5173/](http://localhost:5173/)**）にブラウザでアクセスしてください。

---

## 🔑 Supabase 接続設定の取得方法

本システムは、教員と学生間のリアルタイム双方向通信（Broadcast）に **Supabase** を利用しています。  
教員画面の「**Supabase 接続設定**」カードに入力する **Supabase URL** と **Anon Key** は、以下の手順で無料ですぐに取得できます。

### Step 1. Supabase でプロジェクトを作成する
1. [Supabase 公式サイト (https://supabase.com)](https://supabase.com) にアクセスし、サインイン（GitHubアカウント等で無料登録可能）します。
2. ダッシュボード画面で「**New Project**」をクリックします。
3. 以下の推奨設定を入力し、「**Create new project**」をクリックします。
   * **Region (リージョン)**: 日本で利用する場合は **`Northeast Asia (Tokyo)`** を選択します（リアルタイム通信の遅延を最小化するため最も重要です）。
   * **Security (セキュリティ項目)**:
     * **`Enable Data API`**: **ON (チェックする)** ➔ フロントエンドから `supabase-js` を使って接続するために必要です。
     * **`Automatically expose new tables`**: **OFF (チェックを外す/推奨値)** ➔ セキュリティのため、新しく作ったテーブルが自動公開されるのを防ぎます。
     * **`Enable automatic RLS`**: **ON (チェックする/推奨値)** ➔ テーブルへのアクセス権を制御する「行レベルセキュリティ(RLS)」をデフォルトで有効化し、データベースを保護します。
4. プロジェクトの作成が完了するまで数分待ちます。

### Step 2. API 接続情報の確認・コピー
プロジェクトが起動したら、接続設定用のキーをコピーします。

1. 左メニュー最下部にある「⚙️ **Project Settings**（歯車アイコン）」をクリックします。
2. 設定メニューから「🔑 **API**」を選択します。
3. 画面に表示される以下の2つの値をコピーします：
   * 🌐 **Project URL**: `https://xxxxxxxxxxxxxxxxxxxx.supabase.co` の形式のURL。  
     ➔ これを教員画面の **`Supabase URL`** に貼り付けます。
   * 🔑 **Project API keys (anon / public)**: `eyJhbGciOi...` で始まる非常に長い文字列。  
     ➔ これが **「Publishable Key (公開鍵)」** に相当します。これを教員画面の **`Anon Key`** に貼り付けます。

> [!IMPORTANT]
> **重要: 鍵の種類に注意してください**
> * **使用するもの**: Labelが **`anon / public`** となっているキー（Publishable Key 相当）。これはブラウザ（フロントエンド）に公開しても安全な鍵です。
> * **絶対に使用しないもの**: Labelが **`service_role / secret`** となっているキー（Secret Key）。これはすべての制限（RLS等）をバイパスする最強の管理者権限を持つため、ブラウザに設定するとデータベースを乗っ切られる危険性があります。絶対に公開しないでください。

---

## 📡 Supabase Realtime (Broadcast) について

### 💡 特別な設定は必要？
新規に作成した Supabase プロジェクトであれば、**特別なデータベースの追加設定やテーブル作成は一切不要**です！  
本アプリケーションは、データベースを介さない「**Realtime Broadcast**」という軽量なインメモリ通信機能を利用しています。

* **教員画面** に URL と Anon Key を入力し「接続設定を保存」するだけで、ローカルの `localStorage` に情報が記憶され、次回以降自動接続されます。
* **学生画面** は、教員が入力した認証情報にバックグラウンドで自動同期・通信します。

---

## 📂 フォルダ構成と使用技術

本プロジェクトは `npm workspaces` を用いたモノレポ構成であり、型安全性をフロント ⇄ バックで究極に統一しています。

* **`packages/shared/`**: 型の源泉。Zod スキーマでデータ構造（`RoomLayout`, `SeatStatus`, `BroadcastEvent`）を一元管理。
* **`packages/backend/`**: Cloudflare Workers ＋ Cloudflare D1 (SQLite) ＋ Hono。教室レイアウトを永続化保存・取得。
* **`packages/frontend/`**: Vite ＋ React ＋ Hono RPC ＋ @dnd-kit (ドラッグ＆ドロップエディタ) ＋ Supabase JS。

---

## 🏗️ 技術的ハイライト (フロントエンド設計)

本アプリケーションのフロントエンドは、保守性・パフォーマンス・UXを最大化するため、最先端の設計プラクティスを導入しています。

### 1. ロジックの完全分離とカスタムHooks化
肥大化しがちな React コンポーネントから、ドメインごとにロジックを独立したカスタム Hooks へ抽出しています。
- `useRoomLayout`: 教室レイアウトの作成・変更、D1 データベース保存・復旧。
- `useSeatManager`: ローカルの座席状態管理、ロック状態制御、ローカル永続化。
- `useRealtimeSession`: Supabase 接続の確立、ブロードキャスト（送受信）制御。

### 2. リアルタイム通信の接続ライフサイクル安定化 (useRef パターン)
WebSocket 通信やリアルタイム購読を React 上で正しく動作させるため、**関数の参照安定化パターン**を採用しています。
- **課題**: コールバック関数（トースト通知や状態リセット操作等）が再レンダリングのたびに作り直されると、`useEffect` の再稼働により購読解除（unsubscribe）と再購読（subscribe）が毎秒のように走り、接続が壊れます。
- **解決**: 変化する関数や状態（`addToast`, `onTeacherReset`, `isSeatLocked` 等）を `useRef` で保持・同期することで、**購読ライフサイクル用の `useEffect` から揮発性依存関係を完全に排除**。WebSocket 接続を常にクリーンかつ切断なしで稼働させ続けます。

### 3. 常時接続の再利用による超低遅延ブロードキャスト
- 送信処理（座席のOK/NGやリセット操作）のたびに新規の一時的な接続を作成・購読開始を待つ無駄を排除。
- すでに確立されている常時接続用チャンネル（`teacherChannelRef` / `studentChannelRef`）を通じてダイレクトにメッセージを `.send` することで、通信遅延をほぼゼロに削減。
- 同じチャンネル名での多重 subscribe のバグ（一方の切断が他方の購読を破壊する問題）を根本から解決しています。

