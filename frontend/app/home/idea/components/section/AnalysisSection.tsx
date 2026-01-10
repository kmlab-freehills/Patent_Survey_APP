// Patent_Survey_APP/frontend/app/home/idea/components/section/AnalysisSection.tsx

"use Client";

import { Bot, Lightbulb, Loader2 } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import { ActionButton } from "../util/ActionButton";
import { CopyButton } from "../util/CopyButton";
import { MarkdownRenderer } from "../util/MarkdownRenderer";

// ============================================================
// Step1. 解析結果セクション
// ============================================================

interface AnalysisSectionProps {
    text: string;
    isGenerating: boolean;
    error: string | null;
    onNext: () => void;
    hasNextGenerated: boolean; // 次のステップ(アイデア)が生成済みか
    setActiveParagraphId: (id: string) => void;
    setIsSourceOpen: Dispatch<SetStateAction<boolean>>;
}

export const AnalysisSection = ({
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
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 pt-2 pb-4 border-b border-slate-500">
                <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <Bot size={18} />
                    <span>AI解析結果</span>
                </div>

                <div className="flex items-center gap-3">
                    {!isGenerating && text && <CopyButton text={text} />}
                    {/* 上部アクションボタン */}
                    {showActionButton && (
                        <ActionButton
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
                            setIsSourceOpen(true); // 🔧 直接booleanを渡す
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
                    <ActionButton
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
