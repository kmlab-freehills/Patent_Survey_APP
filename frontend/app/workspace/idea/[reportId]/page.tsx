// Patent_Survey_APP/frontend/app/workspace/idea/[reportId]/page.tsx

"use client";

import { useReport } from "@/hooks/useReport";
import { ArrowRight, Bot, FileText, Lightbulb, MessageSquare } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function IdeaReportDashboard() {
    const { currentReport } = useReport();

    if (!currentReport) return null;

    // TODO: バックエンドと接続後に正規の判定ロジックに置き換え
    const hasPatent = false;
    const hasAnalysis = false;
    const hasIdeas = false;

    // ベースパス
    const basePath = `/workspace/idea/${currentReport.metadata.report_id}`;

    return (
        <div className="p-8 lg:p-12 max-w-6xl mx-auto space-y-12">
            {/* ヘッダーセクション */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-1 bg-blue-600 rounded-full" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            アイデア生成レポート
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            特許技術を解析し、ビジネスアイデアを創出・検討します。
                        </p>
                    </div>
                </div>
            </div>

            {/* ステップ進行状況カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Step 1: 特許登録 */}
                <StatusCard
                    step="01"
                    title="特許登録"
                    icon={FileText}
                    status={hasPatent ? "completed" : "active"}
                    description="解析対象の特許PDFを登録・テキスト化します。"
                    actionLink={`${basePath}/upload`}
                    actionLabel={hasPatent ? "ファイルを確認" : "PDFを登録"}
                />

                {/* Step 2: AI解析 */}
                <StatusCard
                    step="02"
                    title="構造化解析"
                    icon={Bot}
                    status={hasAnalysis ? "completed" : hasPatent ? "ready" : "locked"}
                    description="AIが文書を読み込み、技術要素（課題・解決手段など）を抽出します。"
                    actionLink={`${basePath}/analysis`}
                    actionLabel={hasAnalysis ? "解析結果を見る" : "解析を開始"}
                />

                {/* Step 3: アイデア */}
                <StatusCard
                    step="03"
                    title="アイデア生成"
                    icon={Lightbulb}
                    status={hasIdeas ? "completed" : hasAnalysis ? "ready" : "locked"}
                    description="抽出された技術を応用し、具体的なビジネスアイデアを創出します。"
                    actionLink={`${basePath}/ideas`}
                    actionLabel={hasIdeas ? "アイデアを見る" : "アイデア生成"}
                />

                {/* Step 4: 対話 */}
                <StatusCard
                    step="04"
                    title="対話モード"
                    icon={MessageSquare}
                    status={hasIdeas ? "ready" : "locked"}
                    description="AIアシスタントとの対話を通じて、技術やアイデアを深掘りします。"
                    actionLink={`${basePath}/chat`}
                    actionLabel="対話ルームへ"
                />
            </div>

            {/* メインアクションエリア（Next Action） */}
            <section className="bg-liner-to-br from-white to-slate-50 border border-slate-200/60 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            NEXT ACTION
                        </span>
                        <h2 className="text-xl font-bold text-slate-800">
                            {!hasPatent && "まずは特許PDFを登録しましょう"}
                            {hasPatent && !hasAnalysis && "AIによる構造化解析を実行できます"}
                            {hasAnalysis && !hasIdeas && "技術を活用したアイデアを出してみましょう"}
                            {hasIdeas && "分析は完了しています。対話でさらに深めましょう"}
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                            {!hasPatent &&
                                "J-PlatPatからダウンロードした特許公報PDFに対応しています。ドラッグ＆ドロップで簡単に取り込めます。"}
                            {hasPatent && !hasAnalysis &&
                                "特許文書特有のノイズを除去し、課題・解決手段・技術構成などを明確に構造化します。"}
                            {hasAnalysis && !hasIdeas &&
                                "ターゲット市場や解決すべき課題を設定し、AIにブレインストーミングさせることができます。"}
                            {hasIdeas &&
                                "生成されたアイデアについて、「実現可能性は？」「競合は？」など、気になる点をAIに質問してみましょう。"}
                        </p>
                    </div>

                    {/* アクションボタン */}
                    <div className="shrink-0">
                        {!hasPatent && (
                            <PrimaryLink href={`${basePath}/upload`}>
                                特許PDFを登録する
                            </PrimaryLink>
                        )}
                        {hasPatent && !hasAnalysis && (
                            <PrimaryLink href={`${basePath}/analysis`}>
                                解析を開始する
                            </PrimaryLink>
                        )}
                        {hasAnalysis && !hasIdeas && (
                            <PrimaryLink href={`${basePath}/ideas`}>
                                アイデアを生成する
                            </PrimaryLink>
                        )}
                        {hasIdeas && (
                            <PrimaryLink href={`${basePath}/chat`}>
                                対話モードを開く
                            </PrimaryLink>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

// ------------------------------------------------------------
// サブコンポーネント
// ------------------------------------------------------------

type Status = "locked" | "active" | "ready" | "completed";

const StatusCard = ({
    step,
    title,
    icon: Icon,
    status,
    description,
    actionLink,
    actionLabel,
}: {
    step: string;
    title: string;
    icon: React.ElementType;
    status: Status;
    description: string;
    actionLink: string;
    actionLabel: string;
}) => {
    const isLocked = status === "locked";
    const isCompleted = status === "completed";
    const isActive = status === "active"; // 現在進行中（次にやるべきこと）

    // スタイル定義
    const baseStyle = "relative p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full";
    
    let containerStyle = "bg-white border-slate-100 shadow-sm hover:shadow-md";
    let iconStyle = "text-slate-400 bg-slate-50";
    let titleStyle = "text-slate-500";
    let stepStyle = "text-slate-300";

    if (isActive || status === "ready") {
        containerStyle = "bg-white border-blue-200 ring-4 ring-blue-50/50 shadow-md";
        iconStyle = "text-blue-600 bg-blue-50";
        titleStyle = "text-slate-800";
        stepStyle = "text-blue-300";
    } else if (isCompleted) {
        containerStyle = "bg-slate-50/50 border-slate-200";
        iconStyle = "text-emerald-600 bg-emerald-50";
        titleStyle = "text-slate-700";
        stepStyle = "text-emerald-300";
    }

    if (isLocked) {
        containerStyle = "bg-slate-50 border-slate-100 opacity-70";
    }

    return (
        <div className={`${baseStyle} ${containerStyle}`}>
            <div className="flex justify-between items-start mb-5">
                <div className={`p-3.5 rounded-xl ${iconStyle}`}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                <span className={`text-xs font-bold tracking-wider ${stepStyle}`}>STEP {step}</span>
            </div>

            <h3 className={`font-bold text-lg mb-3 ${titleStyle}`}>{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                {description}
            </p>

            {isLocked ? (
                <div className="mt-auto w-full py-2.5 text-xs text-slate-400 font-medium bg-slate-100 rounded-lg text-center select-none">
                    未到達
                </div>
            ) : (
                <Link
                    href={actionLink}
                    className={`
                        mt-auto w-full py-2.5 px-4 rounded-lg text-sm font-bold text-center transition-colors flex items-center justify-center gap-2
                        ${
                            isCompleted
                                ? "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
                        }
                    `}
                >
                    {actionLabel}
                    {!isCompleted && <ArrowRight size={14} />}
                </Link>
            )}
        </div>
    );
};

const PrimaryLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
        href={href}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
        {children}
        <ArrowRight size={18} />
    </Link>
);