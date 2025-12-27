import config
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from src.routers import generate_api, patent_process_api

# ============================================================
# アプリケーションのセットアップ
# ============================================================

app = FastAPI()
FRONTEND_URL = config.FRONTEND_URL or ""


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