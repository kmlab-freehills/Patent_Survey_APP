// Patent_Survey_APP/frontend/app/home/idea/page.tsx

"use client";

import { useState, useEffect } from "react";
import { GeneratingScreen } from "./components/screen/GeneratingScreen";
import { UploadScreen } from "./components/screen/PatentUploadScreen";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";

import type { components } from "@/types/schema"; // 自動生成型定義
type PatentContent = components["schemas"]["PatentContent"];
type PatentImage = components["schemas"]["PatentImage"];
type PatentResponse = components["schemas"]["PatentUploadResponse"];

// ============================================================
// 特許解析～アイデア生成機能
// ============================================================

// ローカルストレージのキー定数
const STORAGE_KEY_PATENT_CONTEXT = "app_patent_context";

// 画面状態の型定義
type ScreenState = "upload" | "generating";

export default function IdeaPage() {
    const [screen, setScreen] = useState<ScreenState>("upload");

    // 特許PDF情報 & 解析データ
    const [patentId, setPatentId] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [patentData, setPatentData] = useState<PatentContent | null>(null);
    const [patentImages, setPatentImages] = useState<PatentImage[]>([]);

    // ローディング状態（復元中かどうか）
    const [isRestoring, setIsRestoring] = useState(true);

    // セッション管理（新規追加）
    const [sessionId, setSessionId] = useState<string | null>(null);
    const { createSession, loadSession } = useSessionPersistence();

    // ============================================================
    // 1. 初期化時の復元ロジック (リロード対策)
    // ============================================================
    useEffect(() => {
        const restoreState = async () => {
            setIsRestoring(true);
            try {
                // localStorageから前回の作業コンテキストを取得
                const storedContext = localStorage.getItem(STORAGE_KEY_PATENT_CONTEXT);

                if (!storedContext) {
                    setIsRestoring(false);
                    return;
                }

                const { patentId: storedId, fileName: storedName } = JSON.parse(storedContext);

                if (storedId) {
                    // A. バックエンドから特許データ(JSON)を再取得
                    const res = await fetch(`http://localhost:8000/patent/${storedId}`);
                    if (res.ok) {
                        const data: PatentResponse = await res.json();

                        setPatentId(data.patent_id);
                        setFileName(storedName || data.filename); // 保存しておいたファイル名を優先
                        setPatentData(data.patent_data);
                        setPatentImages(data.images);

                        // B. セッションIDの復元 (既存ロジックの再利用)
                        const sessionKey = `session_for_patent_${storedId}`;
                        const storedSessionId = localStorage.getItem(sessionKey);
                        if (storedSessionId) {
                            setSessionId(storedSessionId);
                        } else {
                            // セッションがなければ新規作成
                            const newSessionId = await createSession();
                            setSessionId(newSessionId);
                            localStorage.setItem(sessionKey, newSessionId);
                        }

                        // 画面を遷移
                        setScreen("generating");
                    } else {
                        // データが見つからない場合（サーバー再起動で消えた等）はクリア
                        console.warn("Patent data not found on server.");
                        localStorage.removeItem(STORAGE_KEY_PATENT_CONTEXT);
                    }
                }
            } catch (e) {
                console.error("Failed to restore state:", e);
                localStorage.removeItem(STORAGE_KEY_PATENT_CONTEXT);
            } finally {
                setIsRestoring(false);
            }
        };

        restoreState();
    }, []); // 初回のみ実行

    // ============================================================
    // 2. アップロード成功時の保存ロジック
    // ============================================================
    // UploadScreenに渡すセットアップ関数をラップして、ストレージ保存を追加
    const handleUploadSuccess = (
        pId: string,
        fName: string,
        pData: PatentContent,
        pImages: PatentImage[]
    ) => {
        setPatentId(pId);
        setFileName(fName);
        setPatentData(pData);
        setPatentImages(pImages);

        // localStorageに保存
        localStorage.setItem(
            STORAGE_KEY_PATENT_CONTEXT,
            JSON.stringify({
                patentId: pId,
                fileName: fName,
            })
        );

        setScreen("generating");
    };

    // ============================================================
    // 3. リセット処理
    // ============================================================
    const handleResetSession = () => {
        setScreen("upload");
        setPatentId("");
        setSessionId(null);
        setPatentData(null);
        setPatentImages([]);

        // ストレージもクリア
        localStorage.removeItem(STORAGE_KEY_PATENT_CONTEXT);
    };

    if (isRestoring) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-500">
                データを復元中...
            </div>
        );
    }

    return (
        <>
            {/* アップロード画面 */}
            {screen === "upload" && (
                <UploadScreen
                    setScreen={setScreen}
                    setPatentId={setPatentId}
                    setFileName={setFileName}
                    setPatentData={setPatentData}
                    setPatentImages={setPatentImages}
                />
            )}

            {/* 生成・解析画面 (データが存在する場合のみ表示) */}
            {screen === "generating" && patentData && (
                <GeneratingScreen
                    fileName={fileName}
                    patentId={patentId}
                    patentData={patentData}
                    patentImages={patentImages}
                    sessionId={sessionId || ""}
                    onReset={handleResetSession}
                />
            )}
        </>
    );
}
