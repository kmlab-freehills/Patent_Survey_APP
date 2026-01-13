# Patent Survey App

> **「Jupyter Notebook の思想を Web アプリケーションへ」**

日本の特許庁（J-PlatPat）から取得した特許公報（PDF）を読み込み、生成 AI（Google Gemini）を用いて内容の要約・構造化、そしてその技術を活用した新規ビジネスアイデアの創出を支援するシステムです。

本アプリは、従来の「セッション中心」な Web アプリ設計から脱却し、**レポート（ドキュメント）を主役に据えた設計**を採用しています。ユーザーは「レポートファイル」を作成・保存・読み込むことで、いつでも作業を再開でき、分岐・共有・バックアップが容易に行えます。

---

## 📖 目次

1. [設計思想](#設計思想)
2. [主な機能](#主な機能)
3. [デモ](#デモ--スクリーンショット)
4. [アーキテクチャ](#アーキテクチャ)
5. [技術スタック](#技術スタック)
6. [環境構築・起動方法](#環境構築起動方法)
7. [ディレクトリ構造](#ディレクトリ構造)
8. [開発の経緯](#開発の経緯)

---

## 設計思想

### 🎯 レポート指向アーキテクチャ

> **ユーザーがファイルを管理し、アプリはそれを開くための高性能なエディタ / ビューワーである**

本アプリの設計思想は、**Jupyter Notebook** に近いものです。

| 観点     | 従来の Web アプリ          | **Patent Survey App**            |
| -------- | -------------------------- | -------------------------------- |
| **主役** | システム（セッション管理） | **ユーザー（レポートファイル）** |
| **状態** | DB / localStorage に分散   | **1 つのレポート JSON**          |
| **復元** | 自動復元（不安定）         | **「レポートを開く」だけ**       |
| **分岐** | 困難                       | **容易（別名保存）**             |
| **共有** | 複雑な権限管理             | **ファイル共有で完結**           |

#### なぜレポート指向なのか？

1. **状態管理の複雑さを構造で解消**

    - すべての状態（特許テキスト、解析結果、チャット履歴）が 1 つの JSON に集約
    - `report.json` を開けば、その時点の作業状態が完全に再現される

2. **Jupyter Notebook 的な使い心地**

    - `.ipynb` ファイルがコードと実行結果を保持するように、レポート JSON も入力と生成結果を保持
    - ブラウザを閉じても、リロードしても、レポートを開けば元に戻る

3. **分析作業の分岐が容易**

    - 同じ特許で「食品業界向け」と「自動車業界向け」の 2 つのアイデア出しをする場合
    - 1 つのレポートを開き、対話で方向性を変え、「別名保存」すれば無限に派生可能

4. **データの所有権がユーザーにある**
    - レポート JSON はユーザーの手元に存在し、バックアップ・共有・削除が自由
    - システムが勝手に状態を管理する「ブラックボックス」ではない

---

### 🔍 透明性と誠実性：AI の認識論的謙虚さ

生成 AI の課題である**ハルシネーション（もっともらしい嘘）**を防ぐため、本アプリは以下の原則を徹底しています。

#### 情報の 3 層構造

すべての情報を明確に分類し、ユーザーが検証可能にします。

```
【第1層: 検証可能な事実】
└─ 特許文書に明記された情報
   例: [段落: 0023] に基づく記述

【第2層: 論理的推論】
└─ 第1層の事実から導かれる推論
   例: X により、Y が実現されると考えられる [段落: 0023], [段落: 0045] に基づく推論

【第3層: 創造的応用】
└─ 事実を新しい文脈に適用
   例: X は、Z に応用できる可能性がある [推測]
```

#### 出典の明示

AI の回答には、以下の形式で出典が付与されます：

```markdown
この技術は、温度センサーを用いた自動制御を実現しています。[段落: 0023]
図 2 に示される構造により、省スペース化が可能です。[図: 2]
一般的に、この手法は食品業界でも応用可能と考えられます。[推測]
```

ユーザーは `[段落: 0023]` をクリックすることで、右サイドバーに原文の該当箇所が表示され、即座に検証できます。

---

## 主な機能

### 1. 特許応用アイデア生成（✅ 実装完了）

特許公報 PDF を起点として該当特許の分析や応用アイデアを生成する機能です。
生成されたテキストと原文（テキスト及び図）を行き来しながら読む UX を提供します。

#### ワークフロー

```
1. レポート作成 → 2. 特許アップロード → 3. テキスト確認 → 4. AI解析 → 5. アイデア生成 → 6. 対話モード
```

各ステップは独立したページ（URL ルーティング）として実装され、ブラウザの「戻る・進む」が自然に機能します。

#### 主な特徴

-   **PDF 解析・構造化**

    -   J-PlatPat 形式の PDF からテキスト・図面を自動抽出
    -   「【要約】」「【技術分野】」「【請求項】」などのセクションに構造化

-   **LLM による多層的な解析**

    -   **事実の抽出**: 原文に基づく正確な情報抽出（構成要素、機能、定量データ）
    -   **アイデア生成**: 技術を応用した新規ビジネスアイデアの提案

-   **対話機能**

    -   基になった特許や生成されたアイデアに対し、LLM との対話を通じてサポート
    -   会話履歴はすべてレポートに保存され、再開可能

-   **原文参照 UI**
    -   AI の回答中の `[段落: xxxx]` をクリック → 原文の該当箇所にジャンプ・ハイライト
    -   `[図: x]` をクリック → 特許図面のモーダル表示

### 2. 特許検索（📋 未着手）

特許公報 PDF およびビジネスアイデアを基に、LLM の Web ブラウジング機能を用いて Google Patents から関連特許を網羅的に取得し、検索レポートを生成する機能。

### 3. 知財マッチング（📋 未着手）

特許を応用したビジネスアイデアを基に、協業できる企業を調査し、適正度を判定するマッチングレポートを生成する機能。gBizINFO や企業 DB を活用予定。

---

## デモ / スクリーンショット

<img width="1919" height="985" alt="特許応用アイデア生成デモ画面" src="https://github.com/user-attachments/assets/186f0a95-a78a-47b9-8ea9-f43858f3b944" />
---

## アーキテクチャ

### 📦 レポート構造

すべての状態は、**1 つのレポート JSON**として管理されます。

```typescript
ReportDocument<T> {
  metadata: {
    report_id: string;          // レポートID（UUID）
    title: string;              // レポート名
    report_type: string;        // 種類（idea | search | matching）
    created_at: string;         // 作成日時
    updated_at: string;         // 更新日時
  },
  content: T  // 機能ごとに異なる内容（型安全）
}
```

#### IdeaReportContent の例

```typescript
IdeaReportContent {
  patent_info?: {
    filename: string;
    patent_id: string;
    has_patent: boolean;
    image_count: number;
  };

  generated?: {
    artifacts?: {
      patent_summary?: {        // 解析結果
        type: "single_shot";
        prompt_type: "analysis";
        input: ["特許原文"];
        output: string;
        meta: { model, temperature, last_run_at };
      };
      idea_generation?: {       // アイデア生成結果
        type: "single_shot";
        prompt_type: "idea";
        input: ["特許原文", "解析結果"];
        output: string;
        meta: { ... };
      };
    };
    conversation?: {             // 対話履歴
      type: "multi_turn";
      messages: { role, content }[];
      meta: { ... };
    };
  };
}
```

**設計の利点：**

1. **1 つの JSON に完結** - ファイル 1 つで状態が完全に復元可能
2. **型安全** - ジェネリクス `ReportDocument<IdeaReportContent>` により、各機能の型が保証される
3. **拡張性** - 新機能（search, matching）も同じ構造を踏襲可能
4. **検証可能** - JSON をテキストエディタで開けば、中身が一目瞭然

---

### 🔄 データフロー

```
【新規作成】
1. トップページで「アイデア生成レポート」を選択
   → API: POST /reports { title, report_type: "idea" }
   → レポートID発行、storage/reports/idea/{id}/report.json 作成

2. 特許PDFアップロード
   → API: POST /reports/idea/{id}/patent
   → Doclingで解析、テキスト・画像を抽出
   → report.json の content.patent_info に保存

3. AI解析実行
   → API: POST /generate/single-shot { promptType: "analysis", context: {...} }
   → ストリーミングでフロントエンドに返却
   → 完了後、content.generated.artifacts.patent_summary に保存

4. アイデア生成実行
   → API: POST /generate/single-shot { promptType: "idea", context: {...} }
   → content.generated.artifacts.idea_generation に保存

5. 対話モード
   → API: POST /generate/multi-turn { messages: [...], context: {...} }
   → content.generated.conversation に会話履歴を保存

【再開】
1. トップページでJSONファイルをアップロード（将来実装予定）
   → バックエンドでバリデーション
   → 該当URLへ遷移
   → すべての状態が復元される
```

---

### 🧩 責務分離

#### フロントエンドの責務

-   プロンプトタイプの指定
-   context に渡すテキストの収集（特許原文、解析結果など）
-   UI 表示（ストリーミング描画）
-   レポートの読み込み・表示

**重要な原則：**

> フロントエンドは「状態を作らない・持たない・壊さない」

すべての状態は `currentReport` に集約され、各ページは `content` の一部を参照・表示するだけです。

#### バックエンドの責務

-   プロンプト構築（PromptManager）
-   LLM 実行（Gemini API）
-   `generated` フィールドへの保存
-   レポート更新の一元管理

---

## 技術スタック

| **領域**           | **技術・ライブラリ**        | **役割**                                     |
| ------------------ | --------------------------- | -------------------------------------------- |
| **フロントエンド** | **Next.js 15 (App Router)** | UI 構築、ファイルベースルーティング          |
|                    | TypeScript                  | 型安全な開発                                 |
|                    | Tailwind CSS 4              | スタイリング                                 |
|                    | React Markdown              | AI 回答のレンダリング                        |
|                    | Lucide React                | アイコン表示                                 |
|                    | openapi-typescript          | バックエンド型定義の自動生成                 |
| **バックエンド**   | **FastAPI**                 | API サーバー                                 |
|                    | **Pydantic**                | スキーマ定義・バリデーション                 |
|                    | Google GenAI SDK            | Gemini API との通信                          |
|                    | **Docling**                 | PDF 解析・テキスト抽出（高精度）             |
|                    | Pillow (PIL)                | 画像処理                                     |
| **インフラ**       | **Docker / Docker Compose** | 環境構築（フロント・バックエンドの一括起動） |

### 型安全性の仕組み

```bash
# バックエンドのスキーマからTypeScript型を自動生成
npm run api:gen
# → types/schema.ts が生成される

# フロントエンドでの使用例
import type { components } from "@/types/schema";
type PatentContent = components["schemas"]["PatentContent"];
```

これにより、フロントエンド・バックエンド間の型の不一致によるバグを防止できます。

---

## 環境構築・起動方法

開発環境のセットアップ手順については、以下のドキュメントを参照してください。

**[環境構築ガイド (SETUP.md)](./SETUP.md)**

### クイックスタート

```bash
# リポジトリのクローン
git clone -b Hirano <リポジトリURL>
cd Patent_Survey_APP

# 環境変数の設定
# backend/.env に GEMINI_API_KEY を設定

# Dockerコンテナの起動
docker compose up --build

# ブラウザでアクセス
# フロントエンド: http://localhost:3000
# API ドキュメント: http://localhost:8000/docs
```

---

## ディレクトリ構造

### フロントエンド（App Router による構造）

```
frontend/app/
├── page.tsx                      # リダイレクト（/workspace へ）
├── workspace/
│   ├── layout.tsx                # ReportProvider（状態管理）
│   ├── MainLayout.tsx            # Header + Sidebar + メインエリア
│   ├── page.tsx                  # ダッシュボード（新規作成 / 読み込み）
│   └── idea/[reportId]/          # アイデア生成機能
│       ├── layout.tsx            # IdeaReportProvider（機能固有の状態）
│       ├── page.tsx              # ダッシュボード
│       ├── upload/page.tsx       # 特許アップロード
│       ├── viewer/page.tsx       # テキスト確認
│       ├── analysis/page.tsx     # AI解析
│       ├── ideas/page.tsx        # アイデア生成
│       ├── chat/page.tsx         # 対話モード
│       └── source-sidebar/       # 原文参照UI
```

**設計の特徴：**

-   **URL がステップを表現** - `/workspace/idea/{id}/analysis` のように、URL を見れば今どの工程かわかる
-   **ページごとに責務分離** - 各 `page.tsx` は独立したコンポーネントとして実装
-   **Context による状態共有** - `useReport<IdeaReportContent>()` で型安全に状態取得

### バックエンド

```
backend/
├── main.py                       # FastAPI アプリケーション
├── src/
│   ├── core/
│   │   ├── client.py             # Gemini API クライアント
│   │   └── config.py             # 環境変数・設定
│   ├── prompt/
│   │   ├── manager.py            # プロンプト構築の一元管理
│   │   └── templates/
│   │       ├── system/           # システムプロンプト
│   │       └── task/             # タスクプロンプト（analysis, idea, chat）
│   └── services/
│       ├── report/               # レポート管理（CRUD）
│       │   ├── report_api.py
│       │   ├── schemas.py
│       │   └── store.py
│       ├── patent/               # 特許PDF処理
│       │   ├── patent_api.py
│       │   ├── functions.py
│       │   └── supports/
│       │       ├── patent_parser.py   # Docling統合
│       │       └── patent_text.py     # テキスト正規化
│       └── gemini/               # LLM生成処理
│           ├── generate_api.py   # ストリーミングAPI
│           ├── functions.py
│           └── schemas.py
```

**設計の特徴：**

-   **責務の明確化** - report / patent / gemini が独立したサービスとして分離
-   **プロンプト管理の一元化** - `PromptManager` がすべてのプロンプト構築を担当
-   **ストレージの単純化** - RDB 不要、ファイルシステムで完結

---

## 開発の経緯

### プロトタイプから本格実装へ

本アプリは、当初 Jupyter Notebook で検証していた特許解析フローを Web アプリ化するプロトタイプとして開発を開始しました。

しかし、プロトタイプの段階で「リロード保持機能」を実装しようとした際、**状態管理の複雑化**という壁に直面しました。

```typescript
// 旧アーキテクチャの問題点
localStorage + SessionStore + PatentStore + useState × 15個
→ 「どこに何があるか」が不透明
→ 復元ロジックが複雑化
→ 機能追加のたびに技術的負債が増大
```

### 設計思想の転換点

現在のアーキテクチャ設計は、**ある「気づき」**が転換点となりました:

> **「Jupyter Notebook の構造と非常に似ている」**

この気づきから、**「セッション管理」から「ドキュメント（レポート）管理」へ**という発想の転換が生まれました。
これにより、複雑さに苦しんでいた開発を、明快で拡張性の高い設計を実現することができました。

```
従来のアプローチ:
「Webアプリ = セッション管理システム」
→ システムが裏で状態を必死に維持

新しいアプローチ:
「Webアプリ = 高性能なエディタ / ビューワー」
→ ユーザーがファイル（レポート）を管理
→ システムはそれを開くだけ
```

### リファクタリングの決断

この設計思想の転換を実現するため、新しいブランチを切り、アプリを一から再構築しました。

**再利用できた資産：**

-   バックエンド API（ほぼそのまま）
-   UI コンポーネント（MarkdownRenderer, SourceSidebar など）
-   ドメインロジック（プロンプト構築、PDF 解析）

**削除したもの：**

-   複雑な状態復元ロジック
-   localStorage による断片的な保存
-   巨大な `GeneratingScreen` コンポーネント

**結果：**

-   コードの行数: 約 30%削減
-   状態管理の複雑度: 劇的に改善
-   機能追加の容易性: 向上
-   保守性・テスト可能性: 向上

---

## 今後の展開

### 実装予定の機能

1. **JSON ファイルのインポート/エクスポート**

    - 「レポートをダウンロード」「レポートを開く」機能の実装
    - レポートの共有・バックアップが容易に

2. **特許検索レポート**

    - LLM Web ブラウジングを活用した類似特許の自動調査

3. **知財マッチングレポート**
    - ビジネスアイデアから協業候補企業を探索

### 拡張性への備え

新機能は、すべて同じパターンで実装できます：

```typescript
// 新しいレポートタイプを追加する場合
export interface SearchReportContent {
    search_query?: string;
    generated?: {
        artifacts?: {
            search_results?: GeneratedArtifact;
        };
    };
}

// 既存の ReportDocument をそのまま利用
const { currentReport } = useReport<SearchReportContent>();
```

**共通のインフラ（レポート管理、LLM 生成、UI 設計）を使い回せる**ため、実装コストが最小化されます。
