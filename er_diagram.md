# 🪑 SeatCheck Studio - Entity Relationship (ER) Diagram & Architecture

本アプリケーションは、Cloudflare D1（SQLite）を用いた「永続化データ」と、Supabase Realtime を用いた「揮発性（リアルタイム）データ」のハイブリッドアーキテクチャを採用しています。

## 1. Cloudflare D1 Database (永続化)

教室のレイアウトや、各教員が設定した固有の Supabase 接続情報は、Cloudflare D1 データベースの `rooms` テーブルに保存されます。

```mermaid
erDiagram
    rooms {
        TEXT id PK "教室のUUID (例: 1234-abcd)"
        TEXT name "教室の表示名 (例: 1年A組 数学)"
        TEXT layouts "JSON形式の教室レイアウト・ケース配列"
        TEXT supabaseUrl "教員が指定した固有のSupabase URL"
        TEXT supabaseAnonKey "教員が指定した固有のSupabase Anon Key"
        INTEGER created_at "作成日時のタイムスタンプ(Unix Epoch)"
        INTEGER updated_at "更新日時のタイムスタンプ(Unix Epoch)"
    }
```

### `layouts` カラムの JSON 構造 (Zod スキーマベース)
`rooms.layouts` の内部には、複数の「ケース（通常講義、グループワーク等）」の配列が JSON 形式で保存されています。

```json
[
  {
    "caseName": "通常講義 (標準)",
    "grid": {
      "4,0": "teacher",
      "0,8": "door",
      "8,8": "door",
      "1,2": "student",
      "2,2": "student"
      // "x,y" 座標をキーとし、"teacher" | "student" | "obstacle" | "door" のいずれかを値とする
    }
  }
]
```

---

## 2. Supabase Realtime Channels (揮発性データ / ブロードキャスト)

学生の理解度（OK/NG）や着席状態、教員からの座席リセット指示などはデータベースには一切保存されません。すべて Supabase のインメモリ `Broadcast` 機能を用いて、接続しているクライアント（ブラウザ）間で直接送受信されます。

チャンネルは `room_UUID` 単位で隔離されており、異なる教室のデータが混ざることはありません。

```mermaid
graph TD
    subgraph Supabase Realtime
        Channel[Channel: "room_UUID"]
        EventTeacher[Event: "teacher_reset" / "teacher_lock_state"]
        EventStudent[Event: "student_status"]
        
        Channel --> EventTeacher
        Channel --> EventStudent
    end

    TeacherUI(教員画面<br/>TeacherPage) --"座席リセット指示<br/>ロック指示"--> EventTeacher
    EventStudent --"OK/NGステータス<br/>名前/コメント"--> TeacherUI
    
    StudentUI1(学生A<br/>StudentPage) --"OK/NGステータス<br/>名前/コメント"--> EventStudent
    EventTeacher --"座席リセット指示<br/>ロック指示"--> StudentUI1
    
    StudentUI2(学生B<br/>StudentPage) --"OK/NGステータス<br/>名前/コメント"--> EventStudent
    EventTeacher --"座席リセット指示<br/>ロック指示"--> StudentUI2

    classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef highlight fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    class Channel highlight;
```

### ブロードキャストペイロード構造 (TypeScript)

**1. 学生から教員へ (`event: "student_status"`)**
```typescript
{
  seatId: string;    // "1,2" などの座標
  status: 'ok' | 'ng' | 'none'; // 理解度ステータス
  studentName: string; // "山田太郎"
  comment: string | null; // "ここがわかりません"
}
```

**2. 教員から学生へ (`event: "teacher_reset"`)**
```typescript
{
  timestamp: string; // リセットが実行されたISO時刻
}
```

**3. 教員から学生へ (`event: "teacher_lock_state"`)**
```typescript
{
  locked: boolean; // true(座席移動禁止) / false(解除)
}
```

---

## 3. 全体アーキテクチャフロー (入室からリアルタイム通信まで)

「完全分散型セルフホストアーキテクチャ」により、教員が用意した無料の Supabase リソースを、QRコード経由でアクセスした学生が直接利用します。

```mermaid
sequenceDiagram
    participant Teacher as 教員画面 (/)
    participant D1 as Cloudflare D1
    participant Supabase as 独自 Supabase
    participant Student as 学生画面 (/student/:id)

    Teacher->>D1: 1. 教室レイアウト＆Supabase設定(URL/Key)を保存
    D1-->>Teacher: 保存完了
    Teacher->>Teacher: 2. QRコード生成 (URL: /student/UUID)
    
    Student->>Teacher: 3. スマホ等でQRをスキャン
    Student->>D1: 4. /api/rooms/UUID をフェッチ
    D1-->>Student: 5. レイアウト＆Supabase設定を返却
    Student->>Supabase: 6. 取得した設定でクライアント初期化＆接続
    Supabase-->>Student: 接続確立完了
    
    Student->>Supabase: 7. 「わかった/わからない」をBroadcast
    Supabase->>Teacher: 8. メッセージ受信＆教員画面のUI更新
```
