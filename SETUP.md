# Patent Survey App 環境構築手順

Hirano ブランチで開発を進めていきます。（2025/12/25 記載）

Dockerを利用して環境構築が可能です。
普段の開発ではDockerコンテナ内ではなくホスト側でコーディングしています。
→Dockerは環境の再現のみという位置づけ

## 私が別PCで実行した手順
```
git clone -b <ブランチ名> <URL>
(backendの `.env` とfrontendの `.env.local` に必要な環境変数を入力しておく)
cd frontend
npm install
cd ../
docker compose down -v (明示的に)
docker compose up --build
```

---

以下詳細説明

## 1. 事前準備

以下のツールがインストールされている必要があります。

-   **Git**
-   **Docker Desktop** (Mac/Windows) または **Docker Engine + Docker Compose** (Linux)
-   **Google Gemini API Key** (Google AI Studio で取得可能)

## 2. リポジトリのクローン

ターミナル（コマンドプロンプト/PowerShell）を開き、任意のディレクトリで以下を実行します。

```bash
git clone -b Hirano <リポジトリのURL>
cd Patent_Survey_APP
```

## 3. 環境変数の設定

バックエンド用に環境変数を設定します。
機密情報（API キー）を含むため、このファイルは Git に含まれていません。手動で作成してください。

1. `backend` ディレクトリへ移動、またはエディタで開きます。
2. `.env.example` ファイルをコピーして、`.env` という名前に変更します。
3. `.env` ファイルを開き、コメントアウトに沿って書き換えます。

## 4. アプリケーションの起動 (Docker)

プロジェクトのルートディレクトリ（`docker-compose.yml`がある場所）で、以下のコマンドを実行します。

```bash
docker compose up --build
```

## 5. ブラウザでのアクセス

起動が完了したら、ブラウザで以下にアクセスしてください。

-   **アプリ画面:** [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)
-   **API ドキュメント:** [http://localhost:8000/docs](https://www.google.com/search?q=http://localhost:8000/docs) (Backend の動作確認用)

## 6. 開発を終了する場合

ターミナルで `Ctrl + C` を押して停止します。
コンテナを完全に削除し、一時ファイルをクリアしたい場合は以下を実行してください。

```bash
# -v オプションをつけることで、作成されたボリュームも削除され、クリーンな状態に戻ります
docker compose down -v
```

---

### トラブルシューティング（共有用メモ）

もし `Error: Cannot find module ... lightningcss ...` というエラーが出た場合：
ホスト側の `node_modules` やキャッシュが悪さをしている可能性があります。以下の手順でリセットしてください。

1. `docker compose down -v` を実行（ボリュームを完全削除）
2. `frontend/.next` フォルダを削除
3. 再度 `docker compose up --build` を実行

---

## その他共有事項

### レスポンス型定義ファイルの自動生成（必要に応じて）

```
# FastAPIサーバーを起動した状態で実行してください。
npm run api:gen
```

### LLM向けコードレポート生成

```
npx repomix
```

→生成されたXMLファイルのテキスト全文をLLMのプロンプトにコピー＆ペースト