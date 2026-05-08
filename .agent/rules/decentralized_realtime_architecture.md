# 🌐 分散型リアルタイム・アーキテクチャ設計思想 (Decentralized Realtime Architecture)

このドキュメントは、プロジェクト「Sheets and Check」におけるリアルタイム同期基盤（Supabase Realtime）と、データベース（Cloudflare D1）を組み合わせた**「完全分散セルフホスト型リアルタイムアーキテクチャ」**の設計思想とルールをまとめたものである。

---

## 🎯 1. 背景と最大の課題：無料枠制限と「デフォルト接続先」の罠

このアプリケーションは、学生と教員のデバイス間を **Supabase Realtime (Broadcast)** で瞬時につなぎ、リアクション（OK/NG状態など）をインタラクティブに可視化する。

### 🚨 Supabase Free Tier の物理的限界
Supabase の無料プランには以下の厳密なリミットがある。
* **最大同時接続数（Realtime Connections）: 200台**

### ☠️ 「システムデフォルト接続先（共有アカウント）」がはらむ破綻シナリオ
もし開発者側で 1 つの共有 Supabase プロジェクトを用意し、それを「デフォルトの接続先」として全ユーザーに相乗りさせた場合、以下の破煉が発生する。
1. 各教室（40人学級とする）で、5クラスが同時に授業を行った瞬間、接続数が **200台** に達する。
2. 6クラス目が授業を始めた瞬間、または特定の授業内で接続が溢れた瞬間に、**システム全体のリアルタイム通信機能がバグではなく「クラウドの制限」によって突然死する**。
3. これにより、「いつ動かなくなるか予想がつかない」という運用上の重大な不安定さが生じ、アプリ自体の信頼性を著しく損なう。

---

## 💡 2. 解決策：完全分散型リアルタイム (Decentralized Realtime)

このプロジェクトでは、**「お試し用のデフォルト接続先はあえて一切用意せず、各教員に自前の Supabase アカウントを用意してもらう（完全オプションB）」**という意思決定を下した。

```mermaid
flowchart TD
    subgraph システム共通
        D1[(Cloudflare D1)]
    end

    subgraph 教室 A (教員Aの無料Supabase)
        T_A[教員A] -->|Room A + Key A 保存| D1
        S_A1[学生1] -->|QR読込: D1からKey Aを取得| Conn_A((Supabase A))
        S_A2[学生2] -->|QR読込: D1からKey Aを取得| Conn_A
        Conn_A <-->|リアルタイム同期| T_A
    end

    subgraph 教室 B (教員Bの無料Supabase)
        T_B[教員B] -->|Room B + Key B 保存| D1
        S_B1[学生1] -->|QR読込: D1からKey Bを取得| Conn_B((Supabase B))
        S_B2[学生2] -->|QR読込: D1からKey Bを取得| Conn_B
        Conn_B <-->|リアルタイム同期| T_B
    end
```

### 💎 このアーキテクチャのメリット
1. **責任境界が極めて明確（他人の授業に影響を与えない）**:
   * 万が一、ある授業の同時接続が 200人 を超えて制限がかかっても、その影響はその教員のクラスだけに留まる。他のすべての教員の授業は、それぞれの Supabase を使っているため、何の影響もなく 100% 稼働し続ける。
2. **開発側の運営コストが完全に「ゼロ」**:
   * 各教員が自分で無料枠のアカウントをホストするため、システム全体の接続数が 2,000人、20,000人 とスケールしても、開発者側にかかるインフラ代金は Cloudflare Workers / D1 の無料枠（または超低額な基本料金）だけに抑えられる。
3. **無制限のスケール性（セルフホスト化）**:
   * 利用する教員の数だけ Supabase の無料枠がシステム全体に「掛け算」で増えていくため、実質的に無料で無限にスケールアップする「分散型リアルタイムネットワーク」が実現する。

---

## 🎨 3. デメリットの克服：極上の UX（QRコード ＋ 自動連携）

「各自が Supabase の設定を入力しなければならない」という敷居の高さを、**「学生側への完全自動配信」**によって完全に相殺する。

### 🚀 学生は一切の設定変更を不要とするマジック
1. **D1 への一元保存**:
   * 教員が教員画面で Supabase の URL と Anon Key を入力し「D1 に保存」すると、教室レイアウト情報（Grid）と接続キーが Cloudflare D1 にペアリングされて保存される。
2. **招待URL（QRコード）の動的生成**:
   * 保存が完了すると、教員画面に `?room=UUID` 形式の招待リンクと、その **QRコード** が自動表示される。
3. **学生側のゼロ構成（Zero-Config）ログイン**:
   * 学生がスマホで QR コードをスキャンすると、フロントエンドは D1（Hono API）を叩いて教室レイアウトと共に **「その教員専用の Supabase URL と Anon Key」を裏側で自動フェッチ** する。
   * フロントエンド内の Supabase クライアントは、取得したキーで**動的に再初期化・接続**を確立する。
   * 学生は API キーの存在すら知ることなく、完全自動でその先生専用の Supabase の無料枠に吸い込まれ、高精度なブロードキャスト同期がスタートする。

---

## ⚙️ 4. 開発者・AI エージェントが厳守すべき実装ルール

今後、新機能の追加やリファクタリングを行う開発者、および AI エージェントは、本アーキテクチャを維持するために以下のルールを必ず遵守すること。

### ① スキーマの整合性
* 教室の保存・更新スキーマ（[roomLayout.ts](file:///d:/dev/seets-and-check/packages/shared/src/schemas/roomLayout.ts) 内の `SaveRoomLayoutInputSchema`）は、必ず `supabaseUrl` および `supabaseAnonKey` を**必須項目（Required）**として定義し続けること。

### ② 親コンポーネントによる状態の一元管理（循環依存の防止）
* `supabaseUrl` と `supabaseAnonKey` の `useState` は、必ず [App.tsx](file:///d:/dev/seets-and-check/packages/frontend/src/App.tsx) のルートコンポーネントで管理し、各フック（`useRoomLayout`, `useRealtimeSession`）へ Props で流し込む。
* フック内部で個別に Credential の `useState` を持ってフックの戻り値同士をバインドしようとすると、TypeScript の TDZ（Temporal Dead Zone）エラー、または循環依存が発生するため絶対に禁止する。

### ③ 動的再接続の保証
* [useRealtimeSession.ts](file:///d:/dev/seets-and-check/packages/frontend/src/hooks/useRealtimeSession.ts) では、受け取った `supabaseUrl` および `supabaseAnonKey` が更新された場合、`useEffect` により Supabase クライアントを動的に自動再生成・再接続（ホットリロード）する機構を維持すること。画面のリロードに依存する設計にしてはならない。

### ④ セキュリティの担保（RLS の適用）
* `Anon Key` は公開前提のクライアントキーであり、クライアントに配布しても問題はない。ただし、悪意ある学生による他人の座席データの書き換え等を防ぐため、Supabase 側のテーブル/チャンネルに対しては **Row Level Security (RLS)** または **Channel Authorization/Channel Name によるアイソレーション（`roomId`（UUID）をチャンネル名にする）** の設計を厳守し、教員側のセキュリティ境界を保護すること。
