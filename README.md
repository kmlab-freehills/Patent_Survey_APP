# Patent_Survey_APP

Hiranoブランチで開発を進めていきます。（2025/12/25記載）

## バックエンドのセットアップ (bash)

### 前提条件
* bash / git bashが使える
* uvがインストール済み

### 環境構築コマンド
```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

## フロントエンドのセットアップ（bash）

```bash
cd frontend
npm install
npm run dev
```