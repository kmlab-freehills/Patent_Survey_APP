# Patent Survey App

日本の特許庁（J-PlatPat）から取得した特許公報（PDF）を読み込み、生成 AI（Google Gemini）を用いて内容の要約・構造化、そしてその技術を活用した新規ビジネスアイデアの創出を支援するシステムです。

---

## 主な機能

### 1. 特許応用アイデア生成（実装中）

特許公報 PDF を起点として該当特許の分析や応用アイデアを生成する機能です。
生成されたテキストと原文（テキスト及び図）を行き来しながら読む UX を提供します。

-   **PDF アップロード & 解析**: J-PlatPat 形式の PDF からテキスト・図面を自動抽出・構造化
-   **LLM による多層的な解析**:
    -   **事実の抽出**: 原文に基づく正確な情報抽出（Text/Image to Text）
    -   **アイデア生成**: 技術を応用した新規ビジネスアイデアの提案
-   **特許原文と照合できる UI（根拠確認用）**:
    -   AI の回答（例: `[段落: 0001]`）をクリックすると、原文の該当箇所へジャンプ
    -   抽出された図面の参照機能

### 2. 特許検索（※未着手）

特許公報 PDF およびビジネスアイデアを基に、LLM の Web ブラウジング機能を用いて Google Patents から関連特許を網羅的に取得し、レポートを提供する機能。

### 3. 知財マッチング（※未着手）

特許を応用したビジネスアイデアを基に、協業できる企業を調査し、適正度を判定する機能。gBizINFO や企業 DB を活用予定。

---

## デモ / スクリーンショット

<img width="1919" height="989" alt="特許応用アイデア生成デモ画面" src="https://github.com/user-attachments/assets/1e12d57d-1b27-4d4b-9ea1-684b36d3c8e5" />

---

## 環境構築・起動方法

開発環境のセットアップ手順については、以下のドキュメントを参照してください。

**[環境構築ガイド (SETUP.md)](./SETUP.md)**

## 技術スタック

| **領域**           | **技術・ライブラリ**        | **役割**                                     |
| ------------------ | --------------------------- | -------------------------------------------- |
| **フロントエンド** | **Next.js (App Router)**    | UI 構築、React フレームワーク                |
|                    | TypeScript                  | 型安全な開発                                 |
|                    | Tailwind CSS                | スタイリング                                 |
|                    | React Markdown              | AI 回答のレンダリング                        |
|                    | Lucide React                | アイコン表示                                 |
| **バックエンド**   | **Python (FastAPI)**        | API サーバー                                 |
|                    | Google GenAI SDK            | Gemini API との通信                          |
|                    | PyPDF                       | PDF 解析・テキスト抽出                       |
|                    | Pillow (PIL)                | 画像処理                                     |
| **インフラ**       | **Docker / Docker Compose** | 環境構築（フロント・バックエンドの一括起動） |

※ 現時点でデータベースは使用せず、オンメモリ/一時ファイルで処理しています。

---

## 特許応用アイデア分析機能

難解な特許文書を AI が読み解き、単なる要約だけでなく、「この技術をどうビジネスに活かせるか？」というアイデア生成までをサポートします。
また、AI のハルシネーション（嘘）を防ぐため、**「原文のどこに基づいているか」を常に確認できる UI**を備えています。

### データの流れ

1. **アップロード:** フロントエンドから PDF を送信 → バックエンドで `pypdf` で解析 → テキストと画像を抽出。
2. **一時保存:** 解析結果を一時的なメモリ内ストア (`patent_store.py`) に保存し、特許 ID を発行。
3. **生成:** フロントエンドから特許 ID を指定して生成リクエスト → バックエンドがプロンプトを構築し Gemini に送信。
4. **表示:** Gemini からの応答をストリーミング（逐次表示）でフロントエンドに返し、ユーザーを待たせない体験を提供。

### 特徴 1: 特許 PDF の解析・構造化

複雑な特許文書を「事実」「推論」に分けて構造化

-   **PDF アップロード:** ユーザーが J-PlatPat 形式の特許 PDF をドラッグ＆ドロップでアップロードします。
-   **テキスト処理 (`backend/src/func/patent_pdf.py`):**
    -   PDF からテキストを抽出する際、特許特有のノイズ（行番号、区切り線、ヘッダー情報）を正規表現で除去・整形します。
    -   「【要約】」「【特許請求の範囲】」「【技術分野】」などのセクションごとにテキストを構造化して格納します。
-   **画像抽出 (`backend/src/func/patent_images.py`):**
    -   PDF 内の図面ページから画像を切り出し、「図 1」「図 2」といったラベル付きで保存・表示します。

### 特徴 2: 新規事業アイデアの生成

-   **アイデア創出 (`backend/src/prompt/idea_prompt.py`):**
    -   解析した技術情報を元に、「どのような企業・消費者がターゲットか」「どのような課題を解決できるか」「実装のハードルは何か」といった観点で、具体的な活用アイデアを生成します。
    -   ここでも、推測を含む場合は `[推測]` と明記させる制御が入っています。

### 特徴 3: 検証可能な UI

AI の回答の根拠となる原文箇所をハイライト表示

-   **原文参照機能 (`frontend/app/home/idea/components/SourceSidebar.tsx`):**
    -   AI が生成した解説文の中にある `[段落: xxxx]` というリンクをクリックすると、**画面右側に原文の該当箇所が表示・ハイライト**されます。
    -   `[図: x]` をクリックすると、該当する特許図面のモーダルウィンドウが開きます。
    -   これにより、ユーザーは AI の回答が正しいかを即座に一次情報で確認できます。

---

## 開発背景と設計思想

### 開発背景

これまで Jupyter Notebook 形式で検証・運用してきた特許解析フローや LLM ワークフローを、より実用的な Web アプリケーションとして実装・検証するために開発しています。

### 設計思想：透明性と追跡可能性

生成 AI の課題であるハルシネーション（もっともらしい嘘）を防ぐため、**「AI の回答が原文のどこに基づいているか」を常に確認できること**を最優先に設計しています。

---

## ディレクトリ構造（2025/12/31 時点）
```
Patent_Survey_APP
├─ backend
│  ├─ config.py
│  ├─ Dockerfile
│  ├─ main.py
│  ├─ requirements.txt
│  └─ src
│     ├─ func
│     │  ├─ gemini_client.py
│     │  ├─ generate_func.py
│     │  ├─ patent_images.py
│     │  └─ patent_pdf.py
│     ├─ prompt
│     │  ├─ idea_prompt.py
│     │  └─ system_prompt.py
│     ├─ routers
│     │  ├─ generate_api.py
│     │  └─ patent_process_api.py
│     ├─ schemas
│     │  └─ patent_schemas.py
│     └─ storage
│        └─ patent_store.py
├─ docker-compose.yml
├─ frontend
│  ├─ app
│  │  ├─ chat-ui-test
│  │  │  ├─ ChatInput.tsx
│  │  │  ├─ MessageList.tsx
│  │  │  └─ page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ home
│  │  │  ├─ idea
│  │  │  │  ├─ components
│  │  │  │  │  ├─ FigureList.tsx
│  │  │  │  │  ├─ PatentImageModal.tsx
│  │  │  │  │  └─ SourceSidebar.tsx
│  │  │  │  ├─ GeneratingScreen.tsx
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ PatentUploadUI.tsx
│  │  │  │  └─ util
│  │  │  │     ├─ CopyButton.tsx
│  │  │  │     ├─ MarkdownRenderer.tsx
│  │  │  │     ├─ parseSourceText.ts
│  │  │  │     ├─ patentFormatter.ts
│  │  │  │     └─ ReferenceText.tsx
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ MainLayout.tsx
│  │  └─ page.tsx
│  ├─ Dockerfile
│  ├─ eslint.config.mjs
│  ├─ images
│  │  ├─ arrow_back.svg
│  │  ├─ check_icon.svg
│  │  ├─ edit_document_icon.svg
│  │  ├─ file.svg
│  │  ├─ info_icon.svg
│  │  ├─ logout_icon.svg
│  │  ├─ menu_icon.svg
│  │  ├─ science.svg
│  │  ├─ send_icon.svg
│  │  └─ setting_icon.svg
│  ├─ next.config.ts
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.mjs
│  ├─ README.md
│  ├─ styles
│  │  ├─ chat_input_style.css
│  │  └─ markdown_style.css
│  ├─ tsconfig.json
│  └─ types
│     └─ schema.ts
├─ README.md
├─ repomix-output.xml
└─ SETUP.md

```