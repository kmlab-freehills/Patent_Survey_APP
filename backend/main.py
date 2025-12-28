import os
import config
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.routers import generate_api, patent_process_api
from src.storage.patent_store import STATIC_BASE_PATH, cleanup_temp_files

load_dotenv()

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
    if os.getenv("CREANUP_ON_EXIT") == "true":
        cleanup_temp_files() # 一時ファイル削除実行


# ============================================================
# アプリケーションのセットアップ
# ============================================================

app = FastAPI(
    title="Patent Survey App",
    description="フリーヒルズラボ",
    version="1.0.0",
    lifespan=lifespan  # ← lifespanを指定
)

FRONTEND_URL = config.FRONTEND_URL or ""

# 特許画像保存先
os.makedirs(STATIC_BASE_PATH, exist_ok=True) # マウント前に確実にディレクトリを作成
app.mount("/static/patents", StaticFiles(directory=STATIC_BASE_PATH), name="static")

# ============================================================
# CORS設定（フロントエンドとの通信を許可）
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # フロントエンド の URL を指定
    allow_credentials=True,
    allow_methods=["*"],  # HTTP メソッドを許可 (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # すべてのヘッダーを許可
)


# ============================================================
# ルーター登録
# ============================================================

app.include_router(generate_api.router)         # LLM生成API
app.include_router(patent_process_api.router)   # 特許PDF処理API


# ============================================================
# エンドポイント
# ===========================================================


# 動作確認用
@app.get("/")
def read_root():
    return {"message": "Hello from Docker!(update)"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# uvicorn main:app --host 0.0.0.0 --port 8000 --reload