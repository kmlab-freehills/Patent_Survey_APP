# イメージ
FROM node:20-alpine

# 作業
WORKDIR /app

# package.json と lock ファイルを先にコピー
COPY package*.json ./

# 依存関係をインストール（package-lock.jsonがあればそちらを参照）
RUN npm install

# ソースコードをコピー
COPY . .

# Next.js 開発サーバーのポート
EXPOSE 3000

# 開発モード起動
CMD ["npm", "run", "dev"]
