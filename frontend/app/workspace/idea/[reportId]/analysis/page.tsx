// Patent_Survey_APP/frontend/app/workspace/idea/[reportId]/analysis/page.tsx

"use client";

import { CopyButton } from "@/components/ui/CopyButton";
import MarkdownViewer from "@/components/ui/MarkdownViewer";
import { useReport } from "@/hooks/useReport";
import { Bot, Lightbulb, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { IdeaReportContent } from "../ideaReportType";

export default function AnalysisPage() {
    const { currentReport } = useReport<IdeaReportContent>();

    // 将来的にはレポートのcontentから解析結果を取得する
    // const analysisContent = currentReport?.content.analysis?.result || null;
    const analysisContent = null; // 仮: まだデータがない状態

    // ローカルState（生成中の制御用）
    const [isGenerating, setIsGenerating] = useState(false);

    // 解析開始ハンドラ（モック）
    const handleStartAnalysis = () => {
        setIsGenerating(true);
        console.log("Start analysis...");
        // ここに将来、ストリーミング開始処理が入る
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            {/* ツールバー */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold">
                        <Bot size={18} />
                        <span>AI構造化解析</span>
                    </div>
                    <span className="text-slate-400 text-sm">Step 2 / 4</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* 解析済みの場合のみ表示するアクション */}
                    {analysisContent && !isGenerating && (
                        <>
                            <CopyButton text={analysisContent} />
                            <Link
                                href={`/workspace/idea/${currentReport?.metadata.report_id}/ideas`}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                                <Lightbulb size={18} />
                                <span>アイデア生成へ</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* メインコンテンツ */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Case 1: データがない場合 (Empty State) */}
                    {!analysisContent && !isGenerating && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <Bot size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">
                                特許文書の構造化解析
                            </h2>
                            <p className="text-slate-500 max-w-lg leading-relaxed mb-10">
                                AIが特許テキストを読み込み、「技術的構成」「機能」「課題」などの
                                要素に分解して整理します。
                                <br />
                                長い特許文書を要約し、アイデア出しの土台を作ります。
                            </p>

                            <button
                                onClick={handleStartAnalysis}
                                className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white text-lg font-bold rounded-xl shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
                                <Play size={24} className="fill-white/20" />
                                <span>解析を開始する</span>
                                <Sparkles
                                    size={20}
                                    className="opacity-50 group-hover:opacity-100 transition-opacity"
                                />
                            </button>
                        </div>
                    )}

                    {/* Case 2: 生成中 または データがある場合 */}
                    {(analysisContent || isGenerating) && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[60vh] p-8 md:p-12">
                            {isGenerating && !analysisContent && (
                                <div className="flex items-center gap-3 text-indigo-600 font-medium animate-pulse mb-8">
                                    <Bot size={24} />
                                    <span>AIが特許文書を解析しています...</span>
                                </div>
                            )}

                            {/* Markdown表示エリア */}
                            <div className="prose prose-slate max-w-none">
                                <MarkdownViewer
                                    content={analysisContent || ""} // 生成中はストリーミングテキストが入る予定
                                    className="leading-relaxed"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
