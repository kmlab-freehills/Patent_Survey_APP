## ベースイメージ ##
# Docker Hubから公式のPython 3.11イメージを取得（-slim --> 軽量版）
FROM python:3.11-slim

## 作業ディレクトリを設定 ##
# コンテナ内の作業ディレクトリを /app に設定（以降の COPY、RUN はこのディレクトリで実行される）
WORKDIR /app

## requirements.txtをコピー ##
# コンテナ内の /app/requirements.txt にコピー（. = 現在のディレクトリ（/app））
COPY requirements.txt .

## requirements.txtからパッケージをインストール ##
# コンテナ内で pip install を実行（--no-cache-dir = キャッシュを残さない --> イメージサイズを小さくする）
RUN pip install --no-cache-dir -r requirements.txt

## applicationコードをコピー ##
# ホストの backend/ ディレクトリの全ファイルを、コンテナ内の /app/ にコピー（main.pyなどがコピーされる）
COPY . .

## FastAPI 開発サーバーのポート（明示的） ##
EXPOSE 8000

## コンテナ起動時に実行するコマンド ##
# FastAPIサーバーを起動するコマンド
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]