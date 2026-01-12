// Patent_Survey_APP/frontend/app/workspace/page.tsx

"use client";

import { useReport } from "@/hooks/useReport";
import { ArrowRight, Building2, FileJson, Lightbulb, Loader2, Search, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

// ============================================================
// ワークスペース・トップ（ダッシュボード）
// ============================================================

export default function DashboardPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // ReportContextから機能を取得
    // ※ WorkspaceLayout配下のため利用可能
    const { createReport, importReportFromJson, isLoading, error } = useReport();

    // ----------------------------------------------------------------
    // ハンドラ：新規レポート作成
    // ----------------------------------------------------------------
    const handleCreateNew = async (type: "idea" | "search" | "matching") => {
        if (type === "idea") {
            // タイトルはデフォルト値を設定（後で変更可能にする想定）
            // createReport内でAPIコール -> Contextセット -> 画面遷移 まで行われます
            await createReport("新規アイデア生成レポート", type);
        } else {
            alert("この機能は現在開発中です。");
        }
    };

    // ----------------------------------------------------------------
    // ハンドラ：レポート読み込み (JSON Upload)
    // ----------------------------------------------------------------
    const handleFileUpload = async (file: File) => {
        if (file.type !== "application/json" && !file.name.endsWith(".json")) {
            alert("JSONファイルを選択してください。");
            return;
        }

        try {
            const text = await file.text();
            // インポート実行（バリデーション -> Contextセット -> バックエンド同期 -> 画面遷移）
            await importReportFromJson(text);
        } catch (err) {
            console.error("File Read Error:", err);
            // useReport内でsetErrorされるが、念のためここでも通知
            alert("ファイルの読み込みに失敗しました。");
        }
    };

    // --- ドラッグ＆ドロップ関連 ---
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!isLoading) setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isLoading && e.dataTransfer.files?.[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };
    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
        }
        e.target.value = ""; // リセット
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            {/* ローディングオーバーレイ */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center backdrop-blur-sm transition-all">
                    <div className="flex flex-col items-center gap-3 text-blue-600 bg-white p-6 rounded-xl shadow-lg border border-blue-100">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="font-semibold text-sm tracking-wide">処理中...</span>
                    </div>
                </div>
            )}

            <main className="flex-1 max-w-5xl w-full mx-auto p-8 flex flex-col gap-12">
                {/* エラー表示エリア */}
                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                        エラー: {error}
                    </div>
                )}

                {/* セクション1: 新規作成 */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-700">
                        <span className="bg-blue-600 w-1 h-6 rounded-full"></span>
                        <h2 className="text-xl font-bold">新しいレポートを作成</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1: アイデア生成 */}
                        <FeatureCard
                            icon={Lightbulb}
                            title="アイデア生成レポート"
                            description="特許PDFを解析し、技術の応用アイデアや新規事業の種を創出します。"
                            colorClass="text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-300"
                            onClick={() => handleCreateNew("idea")}
                            disabled={isLoading}
                        />

                        {/* Card 2: 特許検索 (未実装) */}
                        <FeatureCard
                            icon={Search}
                            title="特許検索レポート"
                            description="キーワードや課題から関連特許を網羅的に検索し、動向を調査します。"
                            colorClass="text-blue-600 bg-blue-50 border-blue-100 hover:border-blue-300"
                            onClick={() => handleCreateNew("search")}
                            disabled={true} // 準備中
                        />

                        {/* Card 3: 知財マッチング (未実装) */}
                        <FeatureCard
                            icon={Building2}
                            title="知財マッチング"
                            description="アイデアを実現するための最適な協業パートナー企業を探索します。"
                            colorClass="text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-300"
                            onClick={() => handleCreateNew("matching")}
                            disabled={true} // 準備中
                        />
                    </div>
                </section>

                {/* セクション2: 読み込み */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-700">
                        <span className="bg-slate-400 w-1 h-6 rounded-full"></span>
                        <h2 className="text-xl font-bold">レポートを開く</h2>
                    </div>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isLoading && fileInputRef.current?.click()}
                        className={`
                            relative group cursor-pointer
                            border-2 border-dashed rounded-xl p-10
                            flex flex-col items-center justify-center gap-4
                            transition-all duration-200 ease-in-out
                            ${
                                isLoading
                                    ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-50"
                                    : isDragging
                                    ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                                    : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50 hover:shadow-sm"
                            }
                        `}>
                        <div
                            className={`p-4 rounded-full transition-colors ${
                                isDragging
                                    ? "bg-blue-100"
                                    : "bg-slate-100 group-hover:bg-white group-hover:shadow-md"
                            }`}>
                            {isDragging ? (
                                <Upload className="text-blue-600" size={32} />
                            ) : (
                                <FileJson className="text-slate-400" size={32} />
                            )}
                        </div>

                        <div className="text-center space-y-1">
                            <p className="text-lg font-medium text-slate-700">
                                JSONファイルをここにドロップ
                            </p>
                            <p className="text-sm text-slate-400">
                                またはクリックしてファイルを選択
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleFileInputChange}
                            disabled={isLoading}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}

// ----------------------------------------------------------------
// サブコンポーネント: 機能カード
// ----------------------------------------------------------------
type FeatureCardProps = {
    icon: React.ElementType;
    title: string;
    description: string;
    colorClass: string;
    onClick: () => void;
    disabled?: boolean;
};

const FeatureCard = ({
    icon: Icon,
    title,
    description,
    colorClass,
    onClick,
    disabled,
}: FeatureCardProps) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        flex flex-col items-start text-left p-6 rounded-xl border transition-all duration-200
        ${
            disabled
                ? "opacity-60 cursor-not-allowed bg-slate-50 border-slate-200 grayscale"
                : `${colorClass} shadow-sm hover:shadow-md hover:-translate-y-0.5`
        }
      `}>
            <div className="mb-4 p-3 rounded-lg bg-white shadow-sm ring-1 ring-black/5">
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">{description}</p>

            {!disabled && (
                <div className="flex items-center gap-1 text-sm font-bold mt-auto opacity-80 group-hover:opacity-100">
                    <span>作成する</span>
                    <ArrowRight size={16} />
                </div>
            )}
            {disabled && (
                <div className="mt-auto text-xs font-medium px-2 py-1 bg-slate-200 text-slate-500 rounded">
                    準備中
                </div>
            )}
        </button>
    );
};
