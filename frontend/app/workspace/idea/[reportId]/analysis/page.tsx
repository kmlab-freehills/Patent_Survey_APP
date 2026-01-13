// Patent_Survey_APP/frontend/app/workspace/idea/[reportId]/analysis/page.tsx

"use client";

import { CopyButton } from "@/components/ui/CopyButton";
import { useGeminiSingleShot } from "@/hooks/useGeminiSingleShot";
import { useLayoutState } from "@/hooks/useLayoutState";
import { useIdeaReport } from "../IdeaReportContext";
import { useReport } from "@/hooks/useReport";
import {
    AlertCircle,
    Bot,
    CheckCircle2,
    Lightbulb,
    Loader2,
    Play,
    RefreshCw,
    Sparkles,
    Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IdeaReportContent } from "../ideaReportType";
import { MarkdownRenderer } from "../source-sidebar/IdeaMarkdownRenderer";

// 環境変数
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AnalysisPage() {
    const { currentReport, loadReportFromApi } = useReport<IdeaReportContent>();
    const { output, isGenerating, error, generate } = useGeminiSingleShot();

    // レポートから解析結果を取得
    const savedAnalysisContent =
        currentReport?.content.generated?.artifacts?.patent_summary?.output || null;

    // 特許テキストの取得状態
    const [patentText, setPatentText] = useState<string | null>(null);
    const [isLoadingPatent, setIsLoadingPatent] = useState(false);
    const [patentError, setPatentError] = useState<string | null>(null);

    // 表示用のコンテンツ（生成中はストリーミング、完了後は保存済み）
    const displayContent = isGenerating ? output : savedAnalysisContent;

    // 原文参照サイドバー関連
    const { setIsRightSidebarOpen } = useLayoutState();
    const { setActiveParagraphId } = useIdeaReport();

    const handleParagraphClick = (id: string) => {
        setActiveParagraphId(id);
        setIsRightSidebarOpen(true);
    };

    // ------------------------------------------------------------
    // 特許テキストの取得
    // ------------------------------------------------------------
    useEffect(() => {
        const fetchPatentText = async () => {
            if (!currentReport) return;

            setIsLoadingPatent(true);
            setPatentError(null);

            try {
                const { report_type, report_id } = currentReport.metadata;
                const res = await fetch(
                    `${API_BASE}/static/reports/${report_type}/${report_id}/patent/data.json`
                );

                if (!res.ok) throw new Error("特許データの取得に失敗しました");

                const patentData = await res.json();

                // 特許テキスト全文結合
                const fullText = Object.entries(patentData)
                    .map(([key, content]) => {
                        if (key === "others" && typeof content === "object") {
                            return Object.entries(content as Record<string, string>)
                                .map(([k, v]) => `【${k}】\n${v}`)
                                .join("\n\n");
                        }
                        if (typeof content === "string" && content) {
                            return `【${key}】\n${content}`;
                        }
                        return "";
                    })
                    .filter(Boolean)
                    .join("\n\n");

                setPatentText(fullText);
            } catch (err) {
                console.error("Patent fetch error:", err);
                setPatentError("特許テキストの読み込みに失敗しました");
            } finally {
                setIsLoadingPatent(false);
            }
        };

        fetchPatentText();
    }, [currentReport]);
    // ------------------------------------------------------------
    // 解析実行ハンドラ
    // ------------------------------------------------------------
    const handleStartAnalysis = async () => {
        if (!currentReport || !patentText) return;

        try {
            // LLM実行
            await generate({
                reportType: currentReport.metadata.report_type,
                reportId: currentReport.metadata.report_id,
                artifactName: "patent_summary",
                promptType: "analysis",
                systemPromptType: "patent",
                context: {
                    patent_text: patentText,
                },
            });

            // 完了後、レポートを再取得して最新状態に更新
            await loadReportFromApi(
                currentReport.metadata.report_id,
                currentReport.metadata.report_type
            );

            console.log("[Analysis] Completed and report reloaded");
        } catch (err) {
            console.error("[Analysis] Error:", err);
        }
    };

    // ------------------------------------------------------------
    // 再生成ハンドラ
    // ------------------------------------------------------------
    const handleRegenerate = async () => {
        if (!currentReport || !patentText) return;

        // 確認ダイアログ
        const confirmed = window.confirm(
            "解析を再実行すると、現在の結果が上書きされます。よろしいですか？"
        );
        if (!confirmed) return;

        await handleStartAnalysis();
    };

    // ------------------------------------------------------------
    // エラー / ローディング状態
    // ------------------------------------------------------------

    // 1. レポート読み込み中（必須）
    if (!currentReport) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="animate-spin" size={32} />
                    <span>レポートを読み込んでいます...</span>
                </div>
            </div>
        );
    }

    // 2. 特許テキスト取得中（必須）
    if (isLoadingPatent) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="animate-spin" size={32} />
                    <span>特許データを読み込んでいます...</span>
                </div>
            </div>
        );
    }

    // 3. 特許テキスト取得エラー（必須）
    if (patentError || !patentText) {
        return (
            <div className="flex h-full items-center justify-center bg-white p-8">
                <div className="text-center max-w-md">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        特許データの読み込みエラー
                    </h3>
                    <p className="text-slate-600 mb-6">
                        {patentError || "特許テキストが見つかりません"}
                    </p>

                    {/* 複数の対処方法を提示 */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors">
                            <RefreshCw size={20} />
                            ページを再読み込み
                        </button>

                        <Link
                            href={`/workspace/idea/${currentReport.metadata.report_id}/upload`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                            <Upload size={20} />
                            特許を再アップロード
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------
    // メインUI
    // ------------------------------------------------------------
    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* ツールバー */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                {/* 左側: タイトル */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                        <Bot size={20} strokeWidth={2.5} />
                        <span className="text-sm font-bold">AI構造化解析</span>
                    </div>
                    <span className="text-slate-400 text-xs font-medium">Step 2 / 4</span>
                </div>

                {/* 右側: アクションボタン */}
                <div className="flex items-center gap-3">
                    {/* 解析完了後に表示 */}
                    {savedAnalysisContent && !isGenerating && (
                        <>
                            {/* コピーボタン */}
                            <CopyButton text={savedAnalysisContent} label="結果をコピー" />

                            {/* 再生成ボタン */}
                            <button
                                onClick={handleRegenerate}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border
                                    bg-white text-slate-600 border-slate-200
                                    hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300
                                    transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                <RefreshCw size={16} />
                                <span>再生成</span>
                            </button>

                            {/* 次のステップへ */}
                            <Link
                                href={`/workspace/idea/${currentReport?.metadata.report_id}/ideas`}
                                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg 
                                    hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 
                                    transition-all shadow-sm">
                                <Lightbulb size={18} />
                                <span>アイデア生成へ</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* メインコンテンツエリア */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="max-w-5xl mx-auto">
                    {/* ========================================
                        Case 1: 未実行（Empty State）
                    ======================================== */}
                    {!displayContent && !isGenerating && (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-500">
                            {/* アイコン */}
                            <div className="relative mb-8">
                                <div className="w-24 h-24 bg-linear-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Bot size={48} className="text-indigo-600" strokeWidth={2} />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                            </div>

                            {/* タイトル */}
                            <h2 className="text-3xl font-bold text-slate-800 mb-4">
                                特許文書の構造化解析
                            </h2>

                            {/* 説明 */}
                            <p className="text-slate-600 max-w-xl leading-relaxed mb-3">
                                AIが特許テキストを読み込み、技術要素を体系的に整理します。
                            </p>
                            <ul className="text-sm text-slate-500 space-y-1 mb-10">
                                <li>✓ 技術的構成（部材・材料・構造）</li>
                                <li>✓ 機能的構成（要素技術・動作フロー）</li>
                                <li>✓ 定量データ・仕様情報</li>
                            </ul>

                            {/* 実行ボタン */}
                            <button
                                onClick={handleStartAnalysis}
                                disabled={isGenerating || !patentText}
                                className="group relative flex items-center gap-3 px-10 py-4 
                                    bg-linear-to-r from-indigo-600 to-indigo-700 
                                    text-white text-lg font-bold rounded-xl 
                                    shadow-lg hover:shadow-xl 
                                    hover:-translate-y-1 
                                    active:translate-y-0
                                    transition-all duration-200
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                                <Play size={24} className="fill-white/20" />
                                <span>解析を開始する</span>
                                <Sparkles
                                    size={20}
                                    className="opacity-60 group-hover:opacity-100 transition-opacity"
                                />
                            </button>

                            {/* 補足情報 */}
                            <p className="text-xs text-slate-400 mt-6">
                                解析には 30秒〜1分程度かかります
                            </p>
                        </div>
                    )}

                    {/* ========================================
                        Case 2: 生成中 または 結果表示
                    ======================================== */}
                    {(displayContent || isGenerating) && (
                        <div className="space-y-6">
                            {/* ステータスバー（生成中のみ） */}
                            {isGenerating && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <Loader2
                                        className="animate-spin text-indigo-600 shrink-0"
                                        size={24}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-indigo-900">
                                            AIが特許文書を解析しています...
                                        </p>
                                        <p className="text-xs text-indigo-600 mt-1">
                                            リアルタイムで結果が表示されます
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 完了通知（生成完了直後のみ） */}
                            {!isGenerating && savedAnalysisContent && output && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-emerald-900">
                                            解析が完了しました
                                        </p>
                                        <p className="text-xs text-emerald-600 mt-1">
                                            結果は自動保存されています
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* エラー通知 */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
                                    <AlertCircle className="text-red-600 shrink-0" size={24} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-red-900">
                                            エラーが発生しました
                                        </p>
                                        <p className="text-xs text-red-600 mt-1">{error}</p>
                                    </div>
                                    <button
                                        onClick={handleRegenerate}
                                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors">
                                        再試行
                                    </button>
                                </div>
                            )}

                            {/* 結果表示エリア */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-8 lg:p-12">
                                    <div className="prose prose-slate prose-lg max-w-none">
                                        <MarkdownRenderer
                                            content={displayContent || ""}
                                            onClickParagraph={handleParagraphClick}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
