// Patent_Survey_APP/frontend/app/home/idea/GeneratingScreen.tsx

"use client";

import "@/styles/markdown_style.css";
import {
    ArrowRight,
    Bot,
    CheckCircle2,
    FileText,
    Lightbulb,
    Loader2,
    Lock,
    PanelRight,
    RotateCw, // 再生成
    Sparkles,
    type LucideIcon, // アイコンの型
} from "lucide-react";
import { useMemo, useState } from "react";
// 関数コンポーネント
import { parseSourceText } from "./util/parseSourceText";
import { formatPatentToString } from "./util/patentFormatter";
// UIコンポーネント
import { SourceSidebar } from "./components/SourceSidebar";
import { CopyButton } from "./util/CopyButton";
import { MarkdownRenderer } from "./util/MarkdownRenderer"; // 内部に`ReactMarkdown`と`remarkGfm`

// ============================================================
// 型定義
// ============================================================

// 特許の型
import type { components } from "@/types/schema";
type PatentContent = components["schemas"]["PatentContent"];
type PatentImage = components["schemas"]["PatentImage"];

// ステップ定義
const STEPS = [
    { id: 0, label: "テキスト抽出結果", icon: FileText },
    { id: 1, label: "AI解析結果", icon: Bot },
    { id: 2, label: "応用アイデア", icon: Lightbulb },
] as const;

// Propsの型
interface GeneratingScreenProps {
    fileName: string;
    patentId: string;
    patentData: PatentContent;
    patentImages: PatentImage[];
}

// ============================================================
// メインコンポーネント
// ============================================================

export const GeneratingScreen = ({
    fileName,
    patentId,
    patentData,
    patentImages,
}: GeneratingScreenProps) => {
    // ------------------------------------------------------------
    // State定義
    // ------------------------------------------------------------

    // ステップ管理
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [maxReachedStep, setMaxReachedStep] = useState<number>(0);
    // 原文参照サイドバー
    const [isSourceOpen, setIsSourceOpen] = useState(false);
    const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null); // 参照された段落ID
    const [selectedImage, setSelectedImage] = useState<PatentImage | null>(null); // 画像選択状態
    // 生成テキストデータ
    const [generatedAnalysisText, setGeneratedAnalysisText] = useState("");
    const [generatedIdeaText, setGeneratedIdeaText] = useState("");
    // 生成ステータス管理
    const [error, setError] = useState<string | null>(null);
    // アイデア生成UI状態
    const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
    const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

    // ------------------------------------------------------------
    // データ処理
    // ------------------------------------------------------------

    // 全文取得（一度だけ実行）
    const fullText = useMemo(() => formatPatentToString(patentData), [patentData]);
    const sourceBlocks = useMemo(() => parseSourceText(fullText), [fullText]);

    // ------------------------------------------------------------
    // API処理
    // ------------------------------------------------------------

    // 共通ストリーミング処理ヘルパー
    const streamResponse = async (
        url: string, // APIエンドポイント
        body: object, // POSTに必要なボディ
        onUpdate: (chunk: string) => void, // チャンク受診時のコールバック
        onStart: () => void, // 開始時の状態更新コールバック
        onComplete: () => void // 完了時の状態更新コールバック
    ) => {
        onStart();
        setError(null);
        try {
            // リクエスト
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            // レスポンス判定
            if (!response.ok) {
                // HTTPステータスコードに応じたエラー処理
                if (response.status === 404) {
                    throw new Error("特許データが見つかりませんでした");
                } else if (response.status >= 500) {
                    throw new Error("サーバーエラーが発生しました。時間をおいて再試行してください");
                } else {
                    throw new Error(`エラーが発生しました (${response.status})`);
                }
            }

            if (!response.body) {
                throw new Error("レスポンスが空です");
            }
            // ストリーム処理準備
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            // ストリーム処理
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                onUpdate(decoder.decode(value, { stream: true }));
            }
            // エラーハンドリング
        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("不明なエラーが発生しました");
            }
        } finally {
            onComplete();
        }
    };

    // ------------------------------------------------------------
    // API呼び出しハンドラー
    // ------------------------------------------------------------

    // 特許解析ハンドラー
    // 1. 解析開始
    const handleStartAnalysis = () => {
        // ステップを移動
        setCurrentStep(1);
        setMaxReachedStep((prev) => Math.max(prev, 1));
        setGeneratedAnalysisText("");

        streamResponse(
            "http://localhost:8000/generate/patent",
            { patent_id: patentId },
            (chunk) => setGeneratedAnalysisText((prev) => prev + chunk),
            () => setIsGeneratingAnalysis(true),
            () => setIsGeneratingAnalysis(false)
        );
    };

    // 2. アイデア生成開始
    const handleStartIdea = () => {
        // ステップを移動
        setCurrentStep(2);
        setMaxReachedStep((prev) => Math.max(prev, 2));
        setGeneratedIdeaText("");

        streamResponse(
            "http://localhost:8000/generate/idea",
            { patent_id: patentId, explanation_text: generatedAnalysisText },
            (chunk) => setGeneratedIdeaText((prev) => prev + chunk),
            () => setIsGeneratingIdea(true),
            () => setIsGeneratingIdea(false)
        );
    };

    return (
        <div className="flex overflow-hidden p-8 h-screen-minus-header">
            <div className="max-w-5xl mx-auto w-full flex flex-col h-full">
                {/* ヘッダー情報 */}
                <HeaderInfo fileName={fileName} setIsSourceOpen={setIsSourceOpen} />

                {/* タブナビゲーション */}
                <StepTabs
                    currentStep={currentStep}
                    maxReachedStep={maxReachedStep}
                    onTabClick={setCurrentStep}
                />

                {/* コンテンツエリア (スクロール可能領域) */}
                <div className="flex-1 overflow-y-auto min-h-0 py-6 px-1">
                    {/* STEP 0: テキスト抽出結果 */}
                    {currentStep === 0 && (
                        <PreviewSection
                            text={fullText}
                            onStart={handleStartAnalysis}
                            // ▼既に解析結果があるか判定
                            hasGenerated={generatedAnalysisText.length > 0}
                        />
                    )}

                    {/* STEP 1: AI解析 */}
                    {currentStep === 1 && (
                        <AnalysisSection
                            text={generatedAnalysisText}
                            isGenerating={isGeneratingAnalysis}
                            error={error}
                            onNext={handleStartIdea}
                            // ▼すでにアイデア結果があるか判定
                            hasNextGenerated={generatedIdeaText.length > 0}
                            setActiveParagraphId={setActiveParagraphId}
                            setIsSourceOpen={setIsSourceOpen}
                        />
                    )}

                    {/* STEP 2: アイデア */}
                    {currentStep === 2 && (
                        <IdeaSection
                            text={generatedIdeaText}
                            isGenerating={isGeneratingIdea}
                            error={error}
                            setActiveParagraphId={setActiveParagraphId}
                            setIsSourceOpen={setIsSourceOpen}
                        />
                    )}
                </div>
            </div>

            {/* 原文サイドバー (常にレンダリングしておき、表示状態を制御) */}
            {isSourceOpen && (
                <SourceSidebar
                    isOpen={isSourceOpen}
                    onClose={() => setIsSourceOpen(false)}
                    fileName={fileName}
                    sourceBlocks={sourceBlocks}
                    activeParagraphId={activeParagraphId}
                    patentImages={patentImages}
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                />
            )}
        </div>
    );
};

// ============================================================
// サブコンポーネント
// ============================================================

// ------------------------------------------------------------
// 1. ヘッダー情報
// ------------------------------------------------------------

interface HeaderInfoProps {
    fileName: string;
    setIsSourceOpen: (v: boolean) => void;
}

const HeaderInfo = ({ fileName, setIsSourceOpen }: HeaderInfoProps) => (
    <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="min-w-0 mr-4">
            <h2 className="text-xl font-bold text-slate-800 mb-1">特許解析・アイデア生成</h2>
            <div className="text-slate-500 text-sm flex items-center">
                <span className="shrink-0">対象ファイル：</span>
                <span className="font-medium text-slate-700 truncate max-w-md" title={fileName}>
                    {fileName}
                </span>
            </div>
        </div>
        {/* 原文表示サイドバー開閉ボタン */}
        <button
            onClick={() => setIsSourceOpen(true)}
            className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-all">
            <PanelRight size={16} />
            <span>原文を隣に表示</span>
        </button>
    </div>
);

// ----------------------------------------------------------------------
// 2. ステップタブナビゲーション
// ----------------------------------------------------------------------

interface StepTabsProps {
    currentStep: number;
    maxReachedStep: number; // 最大到達ステップ（未到達には特定のアクションを実行するまでロック）
    onTabClick: (step: number) => void;
}

const StepTabs = ({ currentStep, maxReachedStep, onTabClick }: StepTabsProps) => {
    return (
        <div className="flex border-b border-slate-200 mb-2 shrink-0">
            {STEPS.map((step) => {
                const isActive = currentStep === step.id;
                const isEnabled = step.id <= maxReachedStep;
                const isCompleted = step.id < maxReachedStep;

                // ロック中ならLock、それ以外は元のアイコン
                const Icon = !isEnabled ? Lock : step.icon;

                return (
                    <button
                        key={step.id}
                        onClick={() => isEnabled && onTabClick(step.id)}
                        disabled={!isEnabled}
                        className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all
                ${
                    isActive
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                        : isEnabled
                        ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        : "text-slate-300 cursor-not-allowed"
                }`}>
                        {/* アイコンコンテナ（バッジ配置用） */}
                        <div className="relative">
                            <Icon size={18} />

                            {/* 完了バッジ: 右上に絶対配置 */}
                            {isCompleted && (
                                <div className="absolute -top-1.5 -right-1.5 bg-blue-50/50 rounded-full p-px shadow-sm">
                                    <CheckCircle2
                                        size={12}
                                        className="text-green-500 fill-green-50"
                                    />
                                </div>
                            )}
                        </div>

                        <span>{step.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

// ----------------------------------------------------------------------
// 3. 統合アクションボタン
// ----------------------------------------------------------------------

interface StepActionButtonProps {
    onClick: () => void;
    isReRun: boolean; // 再生成かどうか
    size?: "small" | "normal"; // 上部: small, 下部: normal
    labelText: string; // ボタンに表示するテキスト
    icon: LucideIcon; // コンポーネントそのものを渡す
    colorTheme: "blue" | "emerald"; // 必要に応じて増やしていく
}

const StepActionButton = ({
    onClick,
    isReRun,
    size = "normal",
    labelText,
    icon: Icon, // JSXとして使うため大文字にリネーム
    colorTheme,
}: StepActionButtonProps) => {
    // Tailwindの動的クラス対策として、完全なクラス名を定義しておく
    const variants = {
        blue: {
            initial: "bg-blue-600 hover:bg-blue-700 text-white",
            retry: "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50",
        },
        emerald: {
            initial: "bg-emerald-600 hover:bg-emerald-700 text-white",
            retry: "bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50",
        },
    };

    // 指定されたテーマのスタイルセットを取得
    const themeStyles = variants[colorTheme];
    const currentStyle = isReRun ? themeStyles.retry : themeStyles.initial;

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 font-bold rounded-lg shadow-sm transition-all
            ${size === "small" ? "px-3 py-1.5 text-sm" : "px-6 py-3 text-base shadow-md"}
            ${currentStyle}`}>
            {isReRun ? (
                <RotateCw size={size === "small" ? 14 : 18} />
            ) : (
                <Icon size={size === "small" ? 14 : 18} />
            )}
            <span>{labelText}</span>
            {!isReRun && <ArrowRight size={size === "small" ? 14 : 18} />}
        </button>
    );
};

// ----------------------------------------------------------------------
// 4. テキスト抽出結果セクション
// ----------------------------------------------------------------------

interface PreviewSectionProps {
    text: string;
    onStart: () => void;
    hasGenerated: boolean; // 生成済みフラグ
}

const PreviewSection = ({ text, onStart, hasGenerated }: PreviewSectionProps) => {
    return (
        <div className="space-y-6">
            {/* ツールバー */}
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2 border-b border-transparent">
                {/* 左側：ラベル */}
                <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <FileText size={18} />
                    <span>テキスト抽出結果</span>
                </div>

                {/* 右側：アクション (コピー & 小ボタン) */}
                <div className="flex items-center gap-3">
                    <CopyButton text={text} />
                    {/* 上部アクションボタンを表示 */}
                    <StepActionButton
                        onClick={onStart}
                        isReRun={hasGenerated}
                        size="small"
                        labelText={hasGenerated ? "解析をやり直す" : "解析を開始する"}
                        icon={Sparkles}
                        colorTheme="blue"
                    />
                </div>
            </div>

            {/* コンテンツ */}
            <div className="bg-white px-8 py-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{text}</p>
            </div>

            {/* 下部アクションエリア */}
            <div className="flex justify-end pt-4 pb-12 border-t border-dashed border-slate-200">
                <StepActionButton
                    onClick={onStart}
                    isReRun={hasGenerated}
                    size="normal"
                    labelText={hasGenerated ? "解析をやり直す" : "解析を開始する"}
                    icon={Sparkles}
                    colorTheme="blue"
                />
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 5. 解析結果セクション
// ----------------------------------------------------------------------

interface AnalysisSectionProps {
    text: string;
    isGenerating: boolean;
    error: string | null;
    onNext: () => void;
    hasNextGenerated: boolean; // 次のステップ(アイデア)が生成済みか
    setActiveParagraphId: (id: string) => void;
    setIsSourceOpen: (v: boolean) => void;
}

const AnalysisSection = ({
    text,
    isGenerating,
    error,
    onNext,
    hasNextGenerated,
    setActiveParagraphId,
    setIsSourceOpen,
}: AnalysisSectionProps) => {
    // ボタンの表示条件
    const showActionButton = !isGenerating && text && !error;

    return (
        <div className="space-y-6">
            {/* ツールバー */}
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2 border-b border-transparent">
                <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <Bot size={18} />
                    <span>AI解析結果</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* コピーボタン */}
                    {!isGenerating && text && <CopyButton text={text} />}
                    {/* 上部アクションボタン */}
                    {showActionButton && (
                        <StepActionButton
                            onClick={onNext}
                            isReRun={hasNextGenerated}
                            size="small"
                            labelText={hasNextGenerated ? "アイデアを再生成" : "アイデアを生成"}
                            icon={Lightbulb}
                            colorTheme="emerald"
                        />
                    )}
                </div>
            </div>

            {/* コンテンツ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-8 min-h-75">
                {error && (
                    <div className="mb-4 text-red-600 bg-red-50 p-4 rounded-lg font-medium">
                        {error}
                    </div>
                )}

                <div className="prose prose-slate max-w-none">
                    <MarkdownRenderer
                        content={text}
                        onClickParagraph={(id) => {
                            setActiveParagraphId(id);
                            setIsSourceOpen(true);
                        }}
                    />
                    {isGenerating && (
                        <div className="flex items-center gap-2 mt-4 text-indigo-500 animate-pulse">
                            <Loader2 size={20} className="animate-spin" />
                            <span>解析中...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 下部アクションボタン */}
            {showActionButton && (
                <div className="flex justify-end pt-4 pb-12 border-t border-dashed border-slate-200">
                    <StepActionButton
                        onClick={onNext}
                        isReRun={hasNextGenerated}
                        size="normal"
                        labelText={hasNextGenerated ? "アイデアを再生成" : "アイデアを生成"}
                        icon={Lightbulb}
                        colorTheme="emerald"
                    />
                </div>
            )}
        </div>
    );
};

// 6. アイデアセクション

interface IdeaSectionProps {
    text: string;
    isGenerating: boolean;
    error: string | null;
    setActiveParagraphId: (id: string) => void;
    setIsSourceOpen: (v: boolean) => void;
}

const IdeaSection = ({
    text,
    isGenerating,
    error,
    setActiveParagraphId,
    setIsSourceOpen,
}: IdeaSectionProps) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2 border-b border-transparent">
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <Lightbulb size={18} />
                    <span>応用アイデア</span>
                </div>
                {!isGenerating && text && <CopyButton text={text} />}
            </div>

            <div className="bg-white rounded-xl shadow-md border border-emerald-100 px-8 ring-1 ring-emerald-50 min-h-75">
                {error && (
                    <div className="mb-4 text-red-600 bg-red-50 p-4 rounded-lg font-medium">
                        {error}
                    </div>
                )}

                <div className="prose prose-emerald max-w-none">
                    <MarkdownRenderer
                        content={text}
                        onClickParagraph={(id) => {
                            setActiveParagraphId(id);
                            setIsSourceOpen(true);
                        }}
                    />
                    {isGenerating && (
                        <div className="flex items-center gap-2 mt-4 text-emerald-500 animate-pulse">
                            <Loader2 size={20} className="animate-spin" />
                            <span>思考中...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 完了メッセージなど */}
            {!isGenerating && text && (
                <div className="text-center text-slate-400 text-sm py-8">
                    生成が完了しました。タブを切り替えて解析結果を確認できます。
                </div>
            )}
        </div>
    );
};
