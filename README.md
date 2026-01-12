# Patent Survey App

背景:
- 一連のコードは、リファクタリングを進めている途中のものです。
- 特許読み込み～解析～アイデア生成～対話までの流れは過去に実装しているものの、情報保持周りが複雑になりすぎてしまったため、一度ブランチを切って最初から再構築しているところです。


## 概要

Patent Survey App は、特許情報を起点として
**解析・アイデア生成・対話を行い、その結果を「レポート」として蓄積・再利用する**ためのアプリケーションです。

本アプリは、従来の「セッション中心・状態隠蔽型」な Web アプリ設計から脱却し、
**ドキュメント（レポート）を主役に据えた設計**を採用しています。

---

## 設計思想（最重要）

### ドキュメント指向 / レポート指向アーキテクチャ

> **「Jupyter Notebook の Web アプリ化」**

本アプリでは、
「アプリが裏で状態を必死に維持する」のではなく、

> **ユーザーがレポート（ファイル）を管理し、
> アプリはそれを開くための高性能なエディタ / ビューワーである**

という考え方を採用しています。

---

## 1. セッション中心設計からの脱却

### 従来のアプローチとの比較

|          | 従来のアプローチ (Session-Centric) | **新しいアプローチ (Document / Report-Centric)** |
| -------- | ---------------------------------- | ------------------------------------------------ |
| **主役** | システム                           | **ユーザー**                                     |
| **状態** | セッション / DB に分散             | **1 つのレポート(JSON)**                         |
| **復元** | 自動復元（壊れやすい）             | **「レポートを開く」だけ**                       |
| **分岐** | 困難                               | **容易（別名保存）**                             |
| **共有** | 実装コストが高い                   | **ファイル共有で完結**                           |

---

## 2. レポートという「唯一の状態」

### 基本原則

-   アプリの状態は **常にレポートが正**
-   フロントエンドの state は **表示用キャッシュ**
-   バックエンド・LLM は **状態を持たない**
-   再取得できるものは保存しない

---

## 3. レポート構造の考え方

### レポートは 1 JSON ドキュメント

```json
{
    "metadata": {
        "report_id": "...",
        "title": "...",
        "report_type": "idea",
        "created_at": "...",
        "updated_at": "..."
    },
    "content": {
        // 機能ごとに自由に設計される
    }
}
```

#### metadata

-   一覧表示・検索・ルーティングに必要な最小限の共通情報
-   バックエンドで統一管理

#### content

-   機能ごとに構造が異なる自由領域
-   正規化は行わない
-   「1 レポート = 1 完結した作業成果物」

---

## 4. generated フィールドの共通化

### 人間入力と AI 生成物を明確に分離

```ts
content.generated;
```

配下は、**すべての機能で共通利用可能**な構造として設計されています。

### 4.1 単発生成（artifact）

-   特許要約
-   解析結果
-   アイデア生成結果 など

```ts
GeneratedArtifact {
  type: "single_shot"
  system_prompt_type
  prompt_type
  input
  output
  meta
}
```

**再生成・差し替え可能な最小単位**として扱います。

---

### 4.2 対話（conversation）

-   状態を持つため artifact とは分離
-   会話履歴はすべてレポートに保存

```ts
conversation {
  type: "multi_turn"
  system_prompt_type
  context
  messages
  meta
}
```

---

## 5. 生成処理における責務分離

### フロントエンドの責務

-   プロンプトタイプの指定
-   context に渡すテキストの収集
-   UI 表示（ストリーミング描画）
-   レポートの読み込み・表示

### バックエンドの責務

-   プロンプト構築
-   LLM 実行
-   **generated フィールドへの保存**
-   レポート更新の一元管理

> フロントエンドは
> **「状態を作らない・持たない・壊さない」**
> ことを最優先します。

---

## 6. UI 設計とレポート指向

### Next.js ルーティングによる工程表現

```
/workspace/idea/[reportId]/analysis
/workspace/idea/[reportId]/generation
/workspace/idea/[reportId]/chat
```

-   URL が「今どの工程か」を表す
-   ブラウザの戻る・進むが自然に機能
-   Step 管理ロジックを UI から排除

---

## 7. ReportContext の役割

```ts
loadReport(report);
saveReport();
updateContent(path, value);
```

-   ReportContext は **唯一の状態供給源**
-   各ページは content の一部を編集するだけ
-   画面遷移 ≠ 状態遷移

---

## 8. ワークフロー例

### 新規作成

1. レポート作成
2. 特許アップロード
3. 解析・生成
4. 保存

### 再開・共有

-   レポートを開くだけで完全復元

### 分岐

-   別名保存で無限に派生可能

---

## 9. 実装上の優先順位（判断基準）

1. **レポートが壊れないこと**
2. 再実行・再生成が容易であること
3. フロントエンドを薄く保つこと
4. 将来フィールド追加しても破綻しない構造
5. 「今は使わないものは作らない」

---

## まとめ

このアプリは、

-   状態管理の複雑さを **構造で解消**
-   AI 実装を **汎用・再利用可能** に保ち
-   UX を **ファイル操作として直感的** にする

ことを目的とした、
**レポート指向アプリケーション**です。

---

## ディレクトリ構造



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
│  │  ├─ prompt
│  │  │  ├─ manager.py
│  │  │  └─ templates
│  │  │     ├─ system
│  │  │     │  └─ patent_system_prompt.py
│  │  │     ├─ task
│  │  │     │  ├─ analysis_prompt.py
│  │  │     │  └─ idea_prompt.py
│  │  │     └─ template_memo.py
│  │  └─ services
│  │     ├─ gemini
│  │     │  ├─ functions.py
│  │     │  ├─ generate_api.py
│  │     │  └─ schemas.py
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
│  │     │     ├─ analysis
│  │     │     │  └─ page.tsx
│  │     │     ├─ ideaReportType.ts
│  │     │     ├─ IdeaSidebar.tsx
│  │     │     ├─ layout.tsx
│  │     │     ├─ page.tsx
│  │     │     ├─ upload
│  │     │     │  └─ page.tsx
│  │     │     └─ viewer
│  │     │        └─ page.tsx
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
│  │  ├─ internal
│  │  │  └─ readSSE.ts
│  │  ├─ useGeminiMultiTurn.ts
│  │  ├─ useGeminiSingleShot.ts
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
│     ├─ gemini.ts
│     └─ schema.ts
├─ README.md
├─ repomix-output.xml
├─ repomix.config.json
└─ SETUP.md

```