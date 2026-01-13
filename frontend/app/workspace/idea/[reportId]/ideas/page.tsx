// Patent_Survey_APP/frontend/app/workspace/idea/[reportId]/ideas/page.tsx

"use client";

import { CopyButton } from "@/components/ui/CopyButton";
import MarkdownViewer from "@/components/ui/MarkdownViewer";
import { useGeminiSingleShot } from "@/hooks/useGeminiSingleShot";
import { useIdeaReportStatus } from "@/hooks/useIdeaReportStatus";
import { useReport } from "@/hooks/useReport";
import {
    AlertCircle,
    CheckCircle2,
    Lightbulb,
    Loader2,
    MessageSquare,
    RefreshCw,
    Sparkles,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IdeaReportContent } from "../ideaReportType";

// 環境変数
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function IdeasPage() {
    const { currentReport, loadReportFromApi } = useReport<IdeaReportContent>();
    const status = useIdeaReportStatus();
    const { output, isGenerating, error, generate } = useGeminiSingleShot();

    // レポートから保存済みのアイデアを取得
    const savedIdeasContent =
        currentReport?.content.generated?.artifacts?.idea_generation?.output || null;

    // 特許テキストと解析結果の取得状態
    const [patentText, setPatentText] = useState<string | null>(null);
    const [analysisText, setAnalysisText] = useState<string | null>(null);
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [contextError, setContextError] = useState<string | null>(null);

    // 表示用のコンテンツ（生成中はストリーミング、完了後は保存済み）
    const displayContent = isGenerating ? output : savedIdeasContent;

    // ------------------------------------------------------------
    // 特許テキスト + 解析結果の取得
    // ------------------------------------------------------------
    useEffect(() => {
        const fetchContext = async () => {
            if (!currentReport) return;

            setIsLoadingContext(true);
            setContextError(null);

            try {
                const { report_type, report_id } = currentReport.metadata;

                // 1. 特許テキストを取得
                const patentRes = await fetch(
                    `${API_BASE}/static/reports/${report_type}/${report_id}/patent/data.json`
                );

                if (!patentRes.ok) throw new Error("特許データの取得に失敗しました");

                const patentData = await patentRes.json();

                // 全文結合
                const fullPatentText = Object.entries(patentData)
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

                setPatentText(fullPatentText);

                // 2. 解析結果をレポートから取得
                const analysis =
                    currentReport.content.generated?.artifacts?.patent_summary?.output || null;

                if (!analysis) {
                    throw new Error("解析結果が見つかりません。先に解析を実行してください。");
                }

                setAnalysisText(analysis);
            } catch (err) {
                console.error("Context fetch error:", err);
                setContextError(
                    err instanceof Error ? err.message : "データの読み込みに失敗しました"
                );
            } finally {
                setIsLoadingContext(false);
            }
        };

        fetchContext();
    }, [currentReport]);

    // ------------------------------------------------------------
    // アイデア生成実行ハンドラ
    // ------------------------------------------------------------
    const handleStartGeneration = async () => {
        if (!currentReport || !patentText || !analysisText) return;

        try {
            // LLM実行
            await generate({
                reportType: currentReport.metadata.report_type,
                reportId: currentReport.metadata.report_id,
                artifactName: "idea_generation",
                promptType: "idea",
                systemPromptType: "patent",
                context: {
                    patent_text: patentText,
                    analysis_text: analysisText,
                },
            });

            // 完了後、レポートを再取得して最新状態に更新
            await loadReportFromApi(
                currentReport.metadata.report_id,
                currentReport.metadata.report_type
            );

            console.log("[Ideas] Completed and report reloaded");
        } catch (err) {
            console.error("[Ideas] Error:", err);
        }
    };

    // ------------------------------------------------------------
    // 再生成ハンドラ
    // ------------------------------------------------------------
    const handleRegenerate = async () => {
        if (!currentReport || !patentText || !analysisText) return;

        const confirmed = window.confirm(
            "アイデアを再生成すると、現在の結果が上書きされます。よろしいですか？"
        );
        if (!confirmed) return;

        await handleStartGeneration();
    };

    // ------------------------------------------------------------
    // エラー / ローディング状態
    // ------------------------------------------------------------

    // 1. レポート読み込み中
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

    // 2. コンテキスト取得中
    if (isLoadingContext) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="animate-spin" size={32} />
                    <span>データを読み込んでいます...</span>
                </div>
            </div>
        );
    }

    // 3. コンテキスト取得エラー
    if (contextError || !patentText || !analysisText) {
        return (
            <div className="flex h-full items-center justify-center bg-white p-8">
                <div className="text-center max-w-md">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        データの読み込みエラー
                    </h3>
                    <p className="text-slate-600 mb-6">
                        {contextError || "必要なデータが見つかりません"}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors">
                            <RefreshCw size={20} />
                            ページを再読み込み
                        </button>

                        {!analysisText && (
                            <Link
                                href={`/workspace/idea/${currentReport.metadata.report_id}/analysis`}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                                <Zap size={20} />
                                解析を実行する
                            </Link>
                        )}
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
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                        <Lightbulb size={20} strokeWidth={2.5} />
                        <span className="text-sm font-bold">アイデア生成</span>
                    </div>
                    <span className="text-slate-400 text-xs font-medium">Step 3 / 4</span>
                </div>

                {/* 右側: アクションボタン */}
                <div className="flex items-center gap-3">
                    {/* 生成完了後に表示 */}
                    {savedIdeasContent && !isGenerating && (
                        <>
                            {/* コピーボタン */}
                            <CopyButton text={savedIdeasContent} label="アイデアをコピー" />

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
                                href={`/workspace/idea/${currentReport.metadata.report_id}/chat`}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg 
                                    hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 
                                    transition-all shadow-sm">
                                <MessageSquare size={18} />
                                <span>対話モードへ</span>
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
                                <div className="w-24 h-24 bg-linear-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Lightbulb
                                        size={48}
                                        className="text-emerald-600"
                                        strokeWidth={2}
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-md">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                            </div>

                            {/* タイトル */}
                            <h2 className="text-3xl font-bold text-slate-800 mb-4">
                                ビジネスアイデアの生成
                            </h2>

                            {/* 説明 */}
                            <p className="text-slate-600 max-w-xl leading-relaxed mb-3">
                                解析された特許技術を基に、具体的なビジネスアイデアをAIが創出します。
                            </p>
                            <ul className="text-sm text-slate-500 space-y-1 mb-10">
                                <li>✓ ターゲット市場の特定</li>
                                <li>✓ 解決できる課題の提示</li>
                                <li>✓ 実装上の検討事項</li>
                            </ul>

                            {/* 実行ボタン */}
                            <button
                                onClick={handleStartGeneration}
                                disabled={isGenerating || !patentText || !analysisText}
                                className="group relative flex items-center gap-3 px-10 py-4 
                                    bg-linear-to-r from-emerald-600 to-emerald-700 
                                    text-white text-lg font-bold rounded-xl 
                                    shadow-lg hover:shadow-xl 
                                    hover:-translate-y-1 
                                    active:translate-y-0
                                    transition-all duration-200
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                                <Lightbulb size={24} className="fill-white/20" />
                                <span>アイデアを生成する</span>
                                <Sparkles
                                    size={20}
                                    className="opacity-60 group-hover:opacity-100 transition-opacity"
                                />
                            </button>

                            {/* 補足情報 */}
                            <p className="text-xs text-slate-400 mt-6">
                                生成には 1〜2分程度かかります
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
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <Loader2
                                        className="animate-spin text-emerald-600 shrink-0"
                                        size={24}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-emerald-900">
                                            AIがアイデアを生成しています...
                                        </p>
                                        <p className="text-xs text-emerald-600 mt-1">
                                            リアルタイムで結果が表示されます
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 完了通知（生成完了直後のみ） */}
                            {!isGenerating && savedIdeasContent && output && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-emerald-900">
                                            アイデア生成が完了しました
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
                                        <MarkdownViewer
                                            content={displayContent || ""}
                                            className="leading-relaxed"
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
