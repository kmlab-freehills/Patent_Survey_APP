# Patent Survey App

### リファクタリング基本方針

**ドキュメント指向 / ファイルベースアーキテクチャ**

「Jupyter Notebook の Web アプリ化」

「アプリの状態をシステムが裏で必死に維持する」のではなく、**「ユーザーがファイルを管理し、アプリはそれを開くための高性能なエディタ/ビューワーである」**という考え方にシフト

### 1. セッションから「ドキュメント」へ

|              | 従来のアプローチ (Session-Centric)  | **新しいアプローチ (Document-Centric)**       |
| ------------ | ----------------------------------- | --------------------------------------------- |
| **主役**     | **システム** (勝手に保存・復元する) | **ユーザー** (明示的に作成・保存・開く)       |
| **データ**   | 裏側の DB や隠しファイル            | **レポートファイル** (JSON/zip)               |
| **リロード** | 「消えちゃった！復元しなきゃ！」    | 「初期画面に戻る (当たり前)」                 |
| **再開**     | 自動復元 (不安定になりがち)         | **「レポートを開く」**で確実に戻る            |
| **分岐**     | 難しい (1 つの特許 = 1 つの状態)    | **容易** (「別名で保存」すれば無限に分岐可能) |

### 2. 具体的なワークフローの変化

ユーザー体験（UX）は以下のようにシンプルかつ強力になります。

#### シナリオ A：新規作成（New Report）

1. **トップ画面:** 「新規作成」ボタンを押す。
2. **アップロード:** 特許 PDF をアップロード。
3. **解析・生成:** LLM が解析 → アイデア生成（今のフロー）。
4. **保存:** ユーザーが「保存」ボタンを押すと、**現在の状態すべて（特許 ID, 解析文, チャット履歴）を含んだ JSON ファイル**がダウンロードされる（またはサーバー上のユーザーフォルダに名前付きで保存される）。

#### シナリオ B：続きから再開 / 他の人に共有（Load Report）

1. **トップ画面:** 「レポートを開く（JSON アップロード）」ボタンを押す。
2. **復元:** アプリが JSON を読み込み、**「あの時の Step 3 の状態」**を完全に再現する。
3. **再開:** そのままチャットを続けたり、アイデアを修正したりする。

#### シナリオ C：分析の分岐（Branching）

-   ある特許について「食品業界向け」のアイデア出しをしたレポートがある。
-   それを読み込み、今度は対話機能で「自動車業界向けにアレンジして」と指示し、**「別名で保存」**する。
-   → **1 つの特許から、複数の異なる分析レポートが派生する。** これは RDB でガチガチに管理するよりも、ファイルベースの方が圧倒的に柔軟です。

---

### 1. 新しい画面遷移とディレクトリ構成

これまで `GeneratingScreen.tsx` という巨大なコンポーネントの中で `Step` ステートを切り替えていましたが、これを **Next.js のルーティング** に任せます。

#### ディレクトリ構造（案）

```
frontend/app/
├── page.tsx  (トップページ: ダッシュボード)
├── layout.tsx (全体レイアウト)
└── workspace (作業画面)
    ├── layout.tsx (ヘッダー・サイドバー・Context提供)
    ├── idea (アイデア生成機能)
    │   ├── page.tsx (リダイレクト用)
    │   ├── analysis (Step 1)
    │   │   └── page.tsx
    │   ├── generation (Step 2)
    │   │   └── page.tsx
    │   └── chat (Step 3)
    │       └── page.tsx
    ├── search (特許検索機能: 将来)
    │   └── ...
    └── matching (マッチング機能: 将来)
        └── ...

```

こうすることで、**「今はどの工程にいるのか」が URL で表現**され、ブラウザの「戻る・進む」も自然に機能します。

### 2. データ管理：`ReportContext`

すべての状態を管理する「レポートファイル」の構造を定義し、これを `useContext` でアプリ全体に供給します。

**レポート JSON の構造イメージ (`ReportData`)**

```json
{
  "metadata": {
    "title": "特許AB-1234 アイデア出し",
    "type": "idea_generation", // レポートの種類
    "created_at": "2025-01-01T12:00:00Z",
    "updated_at": "2025-01-02T15:30:00Z"
  },
  "content": {
    // 機能ごとに構造が変わる部分
    "analysis_result": "...",
    "ideas": "...",
    "chat_history": [...]
  }
}

```

**Context の役割**

-   `loadReport(json)`: ファイルを読み込んで State にセット → 画面遷移
-   `saveReport()`: 現在の State を JSON ファイルとしてダウンロード（またはサーバー保存）
-   `updateContent(key, value)`: 各ページからの更新を受け付ける

### 3. UI の役割分担

| UI エリア    | 役割               | 挙動                       |
| ------------ | ------------------ | -------------------------- |
| **ヘッダー** | **ファイル操作盤** | ・現在のファイル名表示<br> |

<br>・「上書き保存」「別名保存」ボタン<br>

<br>・「ホームに戻る」 |
| **サイドバー** | **目次 (TOC)** | ・機能に応じたステップを表示（今は Step1, 2, 3）<br>

<br>・クリックで `router.push('/workspace/idea/chat')` 等へ遷移<br>

<br>・完了済みのステップにチェックマーク |
| **メイン** | **作業エリア** | ・各 `page.tsx` の内容を表示<br>

<br>・余計な枠を排除し、コンテンツに集中できる |

### 4. トップページ（ダッシュボード）のデザイン

「何をしますか？」から始まる、明確なエントリーポイントにします。

```text
[ Patent Survey App ]

■ 新規作成 (Create New)
+------------------------+  +------------------------+  +------------------------+
|  アイデア生成レポート  |  |  特許検索レポート      |  |  マッチングレポート    |
|  (特許PDFから発想)     |  |  (キーワードから調査)  |  |  (アイデアから協業先)  |
+------------------------+  +------------------------+  +------------------------+

■ 読み込み (Load)
[ 📂 JSONファイルを開く... ]

## 現時点のディレクトリ構成


```
Patent_Survey_APP
├─ backend
│  ├─ .python-version
│  ├─ Dockerfile
│  ├─ main.py
│  ├─ pyproject.toml
│  ├─ src
│  │  ├─ core
│  │  │  ├─ client.py
│  │  │  └─ config.py
│  │  └─ services
│  │     ├─ patent
│  │     │  ├─ functions.py
│  │     │  ├─ patent_api.py
│  │     │  ├─ schemas.py
│  │     │  ├─ supports
│  │     │  │  ├─ patent_parser.py
│  │     │  │  └─ patent_text.py
│  │     │  └─ __init__.py
│  │     └─ report
│  │        ├─ report_api.py
│  │        ├─ schemas.py
│  │        ├─ store.py
│  │        └─ __init__.py
│  └─ uv.lock
├─ docker-compose.yml
├─ frontend
│  ├─ app
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ workspace
│  │     ├─ idea
│  │     │  └─ [reportId]
│  │     │     ├─ IdeaSidebar.tsx
│  │     │     ├─ layout.tsx
│  │     │     ├─ page.tsx
│  │     │     ├─ upload
│  │     │     │  └─ page.tsx
│  │     │     └─ viewer
│  │     ├─ layout.tsx
│  │     ├─ MainLayout.tsx
│  │     └─ page.tsx
│  ├─ components
│  │  ├─ layout
│  │  │  ├─ Header.tsx
│  │  │  ├─ LeftSidebar.tsx
│  │  │  └─ RightSidebar.tsx
│  │  └─ ui
│  │     ├─ CopyButton.tsx
│  │     ├─ ImageModal.tsx
│  │     ├─ MarkdownViewer.tsx
│  │     └─ Mermaid.tsx
│  ├─ Dockerfile
│  ├─ eslint.config.mjs
│  ├─ hooks
│  │  ├─ useLayoutState.tsx
│  │  └─ useReport.tsx
│  ├─ next.config.ts
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.mjs
│  ├─ styles
│  │  ├─ chat_input_style.css
│  │  └─ markdown_style.css
│  ├─ tailwind.config.js
│  ├─ tsconfig.json
│  └─ types
│     └─ schema.ts
├─ README.md
├─ repomix-output.xml
├─ repomix.config.json
└─ SETUP.md

```