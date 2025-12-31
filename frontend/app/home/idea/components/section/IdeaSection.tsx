// Patent_Survey_APP/frontend/app/home/idea/components/section/IdeaSection.tsx

"use client";

import { Lightbulb, Loader2, MessageSquare } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import { ActionButton } from "../util/ActionButton";
import { CopyButton } from "../util/CopyButton";
import { MarkdownRenderer } from "../util/MarkdownRenderer";

// ============================================================
// Step2. アイデアセクション
// ============================================================

interface IdeaSectionProps {
    text: string;
    isGenerating: boolean;
    error: string | null;
    onNext: () => void;
    hasNextGenerated: boolean; // 次のステップが開始済みか
    setActiveParagraphId: (id: string) => void;
    setIsSourceOpen: Dispatch<SetStateAction<boolean>>;
}

export const IdeaSection = ({
    text,
    isGenerating,
    error,
    onNext,
    hasNextGenerated,
    setActiveParagraphId,
    setIsSourceOpen,
}: IdeaSectionProps) => {
    // ボタンの表示条件
    const showActionButton = !isGenerating && text && !error;
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 pt-2 pb-4 border-b border-slate-500">
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <Lightbulb size={18} />
                    <span>応用アイデア</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* コピーボタン */}
                    {!isGenerating && text && <CopyButton text={text} />}
                    {/* 上部アクションボタン */}
                    {showActionButton && (
                        <ActionButton
                            onClick={onNext}
                            isReRun={hasNextGenerated}
                            size="small"
                            labelText={hasNextGenerated ? "対話画面に移動" : "対話画面に移動"}
                            icon={MessageSquare}
                            colorTheme="purple"
                        />
                    )}
                </div>
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

            {/* 下部アクションボタン */}
            {showActionButton && (
                <div className="flex justify-end pt-4 pb-12 border-t border-dashed border-slate-200">
                    <ActionButton
                        onClick={onNext}
                        isReRun={hasNextGenerated}
                        size="normal"
                        labelText={hasNextGenerated ? "対話画面に移動" : "対話画面に移動"}
                        icon={MessageSquare}
                        colorTheme="purple" // 次のステップ(Chat)に合わせてPurpleに変更
                    />
                </div>
            )}
        </div>
    );
};
