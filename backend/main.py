# Patent_Survey_APP/backend/main.py

import os
from contextlib import asynccontextmanager  # ライフサイクルイベント

from fastapi import FastAPI, Request  # アプリ本体
from fastapi.staticfiles import StaticFiles  # 静的ファイルのマウント
from starlette.middleware.cors import CORSMiddleware  # ルーター登録用
from src.services.report import report_api  # レポート管理
from src.core.config import STATIC_BASE_PATH, FRONTEND_URL # 環境変数やパス等
from src.services.patent import patent_api # 特許解析
from src.services.gemini import generate_api # 生成AI処理

# ============================================================
# ライフサイクルイベント（起動・終了時の処理）
# ============================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    アプリケーションのライフサイクル管理
    - yield前: アプリ起動時の処理
    - yield後: アプリ終了時の処理
    """

    # --- 起動時の処理 ---
    print("アプリケーションを起動しています...")


    yield  # ← ここでアプリケーションが実行される

    # --- 終了時の処理 ---
    print("アプリケーションを終了しています...")



# ============================================================
# アプリケーションのセットアップ
# ============================================================

app = FastAPI(
    title="Patent Survey App",
    description="フリーヒルズラボ",
    version="1.0.0",
    lifespan=lifespan,  # ← lifespanを指定
)

# ============================================================
# マウント処理
# ============================================================

# ストレージのルートディレクトリを作成
os.makedirs(STATIC_BASE_PATH, exist_ok=True)
# マウント
app.mount("/static", StaticFiles(directory=STATIC_BASE_PATH), name="static")

# ============================================================
# CORS設定（フロントエンドとの通信を許可）
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # フロントエンド の URL を指定
    allow_credentials=True,
    allow_methods=["*"],  # メソッドの許可
    allow_headers=["Content-Type", "Authorization"],  # 必要なヘッダーのみ許可
)


# ============================================================
# ルーター登録
# ============================================================

app.include_router(report_api.router) # レポート管理
app.include_router(patent_api.router) # 特許解析
app.include_router(generate_api.router) # 生成AI処理


# ============================================================
# エンドポイント（テスト用）
# ===========================================================


# 動作確認
@app.get("/")
def read_root():
    return {"message": "Hello World"}

# デバッグログ
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[Request] {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"[Response] {response.status_code}")
    return response

# メモ
# 1. 304 Not Modified について
# これはブラウザのキャッシュ機能によるもので、正常な挙動。
# 「前回アクセスした時からファイル（data.json）に変更はないので、ブラウザが持っているキャッシュを使ってください」というサーバーからのレスポンス。

# 実行コマンド:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload
