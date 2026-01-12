// Patent_Survey_APP/frontend/hooks/useReport.tsx

"use client";

import type { components } from "@/types/schema";
import { useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useState } from "react";

// ------------------------------------------------------------
// 型定義の統合
// ------------------------------------------------------------

// 自動生成された型を利用
type ApiReportDocument = components["schemas"]["ReportDocument"];
type ApiReportMetadata = components["schemas"]["ReportMetadata"];

// フロントエンドで扱いやすくするためのジェネリクス付き型エイリアス
export type ReportDocument<T = Record<string, unknown>> = Omit<ApiReportDocument, "content"> & {
    content: T; // T は各機能（Idea, Search...）ごとのコンテンツ型
};

// ============================================================
// Contextの型定義
// ============================================================

type ReportContextType = {
    // 状態（各ページで useReport<IdeaContent>() のように型を指定して使う想定）
    currentReport: ReportDocument<any> | null; // 読み込まれているレポート（種類指定）
    isLoading: boolean; // ローディングフラグ
    error: string | null; // エラー用

    // アクション
    createReport: (title: string, type: string) => Promise<void>; // 作成
    loadReportFromApi: (reportId: string, type: string) => Promise<void>; // 読み込み
    importReportFromJson: (jsonText: string) => Promise<void>; // インポート
    saveReportToBackend: (report: ReportDocument<any>) => Promise<void>; // セーブ
    downloadReportJson: () => void; // ダウンロード（エクスポート）
    updateReportContent: (newContent: any) => void; // 更新
    clearReport: () => void; // クリア
};

const ReportContext = createContext<ReportContextType | undefined>(undefined);

// ============================================================
// Providerコンポーネント
// ============================================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const ReportProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [currentReport, setCurrentReport] = useState<ReportDocument<any> | null>(null); // 読み込まれているレポート（種類指定）
    const [isLoading, setIsLoading] = useState(false); // ローディングフラグ
    const [error, setError] = useState<string | null>(null); // エラー用

    // ------------------------------------------------------------
    // 1. 新規レポート作成 (POST /reports)
    // ------------------------------------------------------------
    const createReport = useCallback(
        async (title: string, type: string) => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/reports/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, report_type: type }),
                });

                if (!res.ok) throw new Error("レポート作成に失敗しました");

                const newReport = await res.json();
                setCurrentReport(newReport);

                // 作成されたらワークスペースへ遷移（例: /workspace/idea/uuid-1234）
                router.push(`/workspace/${type}/${newReport.metadata.report_id}`);
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsLoading(false); // ロード解除
            }
        },
        [router]
    );

    // ------------------------------------------------------------
    // 2. APIから読み込み (GET /reports/{type}/{id})
    // ------------------------------------------------------------
    const loadReportFromApi = useCallback(async (reportId: string, type: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/reports/${type}/${reportId}`);

            if (res.status === 404) throw new Error("レポートが見つかりません");
            if (!res.ok) throw new Error("レポートの読み込みに失敗しました");

            const report = await res.json();
            setCurrentReport(report);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Unknown error");
            // 必要に応じてエラー時の処理を追記
        } finally {
            setIsLoading(false); // ロード解除
        }
    }, []);

    // ------------------------------------------------------------
    // 3. JSONファイルからインポート (Client Side)
    // ------------------------------------------------------------
    const importReportFromJson = useCallback(
        async (jsonText: string) => {
            setIsLoading(true);
            setError(null);
            try {
                const parsed = JSON.parse(jsonText);

                // 最低限のバリデーション (型ガード的にチェック)
                if (
                    !parsed.metadata ||
                    !parsed.metadata.report_id ||
                    !parsed.metadata.report_type
                ) {
                    throw new Error("不正なレポートフォーマットです");
                }

                // インポートしたレポートをセット
                setCurrentReport(parsed);

                // バックエンドと同期（画像アップロード先などが確保される）
                await saveReportToBackend(parsed);

                // 該当ページへ遷移
                router.push(
                    `/workspace/${parsed.metadata.report_type}/${parsed.metadata.report_id}`
                );
            } catch (err) {
                console.error(err);
                setError("ファイルの読み込みに失敗しました");
            } finally {
                setIsLoading(false); // ロード解除
            }
        },
        [router]
    );

    // ------------------------------------------------------------
    // 4. バックエンドへの保存 (PUT /reports/{type}/{id})
    // ------------------------------------------------------------
    const saveReportToBackend = useCallback(async (report: ReportDocument<any>) => {
        // ローディング表示は出さない（バックグラウンド保存を想定）
        try {
            const { report_type, report_id } = report.metadata;
            const res = await fetch(`${API_BASE}/reports/${report_type}/${report_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(report),
            });

            if (!res.ok) throw new Error("自動保存に失敗しました");

            // レスポンスで更新されたメタデータ(updated_atなど)が返ってくる場合は反映する
            const updatedReport = await res.json();
            setCurrentReport(updatedReport); // 画面上のデータを最新に更新
            console.log("[Report] Saved successfully");
        } catch (err) {
            console.error("[Report] Save failed:", err);
            // 自動保存失敗はユーザーに通知しなくても良いが、ログには残す
        }
    }, []);

    // ------------------------------------------------------------
    // 5. ローカルへのダウンロード (Export)
    // ------------------------------------------------------------
    const downloadReportJson = useCallback(() => {
        if (!currentReport) return;

        const jsonStr = JSON.stringify(currentReport, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        // ファイル名; title_id.json（または日付）
        a.download = `${currentReport.metadata.title || "report"}_${
            currentReport.metadata.report_id
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [currentReport]);

    // ------------------------------------------------------------
    // 6. メモリ上のコンテンツ更新ヘルパー
    // ------------------------------------------------------------
    const updateReportContent = useCallback((newContentPartial: any) => {
        setCurrentReport((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                content: { ...prev.content, ...newContentPartial },
            };
        });
    }, []);

    // レポートのクリア
    const clearReport = useCallback(() => {
        setCurrentReport(null);
        setError(null);
    }, []);

    return (
        <ReportContext.Provider
            value={{
                currentReport,
                isLoading,
                error,
                createReport,
                loadReportFromApi,
                importReportFromJson,
                saveReportToBackend,
                downloadReportJson,
                updateReportContent,
                clearReport,
            }}>
            {children}
        </ReportContext.Provider>
    );
};

// ============================================================
// カスタムフック
// ============================================================
// ジェネリクスを受け取れるようにして、利用側で型安全性を確保
export const useReport = <T = Record<string, unknown>,>() => {
    const ctx = useContext(ReportContext);
    if (!ctx) throw new Error("useReport must be used within ReportProvider");

    // コンテキストの型をキャストして返す
    return {
        ...ctx,
        currentReport: ctx.currentReport as ReportDocument<T> | null,
    };
};
