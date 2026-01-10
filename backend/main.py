# Patent_Survey_APP/backend/main.py

import os
from contextlib import asynccontextmanager  # ライフサイクルイベント

from fastapi import FastAPI  # アプリ本体
from fastapi.staticfiles import StaticFiles  # 静的ファイルのマウント
from starlette.middleware.cors import CORSMiddleware  # ルーター登録用

from src.core.config import STATIC_BASE_PATH, CLEANUP_ON_EXIT, FRONTEND_URL
from src.services.gemini import generate_api
from src.services.patent import patent_api
from src.services.patent.patent_store import cleanup_temp_files  # 一時ファイル処理用

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
    if not os.path.exists(STATIC_BASE_PATH):
        os.makedirs(STATIC_BASE_PATH, exist_ok=True)

    yield  # ← ここでアプリケーションが実行される

    # --- 終了時の処理 ---
    print("アプリケーションを終了しています...")
    if CLEANUP_ON_EXIT == "true":
        cleanup_temp_files()  # 一時ファイル削除実行


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
    allow_methods=["GET", "POST"],  # 必要なメソッドのみ許可
    allow_headers=["Content-Type", "Authorization"],  # 必要なヘッダーのみ許可
)


# ============================================================
# ルーター登録
# ============================================================

app.include_router(generate_api.router)  # LLM生成API
app.include_router(patent_api.router)  # 特許PDF処理API


# ============================================================
# エンドポイント（テスト用）
# ===========================================================


# 動作確認
@app.get("/")
def read_root():
    return {"message": "Hello World"}


# 実行コマンド:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload
