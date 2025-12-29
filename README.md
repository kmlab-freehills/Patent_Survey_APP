# Patent_Survey_APP

Hirano ブランチで開発を進めていきます。（2025/12/25 記載）

## Docker ビルド＆起動

```
docker compose up --build
```

## レスポンス型定義ファイルの自動生成

```
# FastAPIサーバーを起動した状態で実行してください
npm run api:gen
```

## ディレクトリ構造（2025/12/29時点）
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
│  │  ├─ chat-ui
│  │  │  ├─ ChatInput.tsx
│  │  │  ├─ KnowledgeTypes.ts
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
│  │  │  │     ├─ FigureReference.tsx
│  │  │  │     ├─ MarkdownRenderer.tsx
│  │  │  │     ├─ parseSourceText.ts
│  │  │  │     ├─ patentFormatter.ts
│  │  │  │     └─ ReferenceText.tsx
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ MainLayout.tsx
│  │  ├─ page.tsx
│  │  └─ test
│  │     └─ page.tsx
│  ├─ Dockerfile
│  ├─ eslint.config.mjs
│  ├─ images
│  ├─ next.config.ts
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.mjs
│  ├─ public
│  │  ├─ file.svg
│  │  ├─ globe.svg
│  │  ├─ next.svg
│  │  ├─ vercel.svg
│  │  └─ window.svg
│  ├─ README.md
│  ├─ styles
│  │  ├─ chat_input_style.css
│  │  └─ markdown_style.css
│  ├─ tsconfig.json
│  └─ types
│     └─ schema.ts
└─ README.md
```