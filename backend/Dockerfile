# Patent_Survey_APP/backend/Dockerfile

## ベースイメージ ##
# Docker Hubから公式のPython 3.11イメージを取得（-slim --> 軽量版）
FROM python:3.12-slim

## OpenCV/RapidOCRに必要なシステムライブラリをインストール ##
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

## uvをインストール ##
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

## uvのvenv作成場所を明示 ##
ENV UV_PROJECT_ENVIRONMENT=/app/.venv

## 依存関係定義のみ先にコピー ##
COPY pyproject.toml uv.lock ./

## 依存関係のインストール ##
# uv syncを実行（--frozen: lockファイル厳密使用, --no-dev: 本番用依存のみ）
RUN uv sync --frozen --no-dev

## applicationコードをコピー ##
# ホストの backend/ ディレクトリの全ファイルを、コンテナ内の /app/ にコピー（main.pyなどがコピーされる）
COPY . .

## FastAPI 開発サーバーのポート（明示的） ##
EXPOSE 8000

## コンテナ起動時に実行するコマンド ##
# FastAPIサーバーを起動するコマンド
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]