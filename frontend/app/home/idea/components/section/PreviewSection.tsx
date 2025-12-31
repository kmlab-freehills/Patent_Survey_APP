// Patent_Survey_APP/frontend/app/home/idea/components/section/PreviewSection.tsx

"use Client";

import { FileText, Sparkles } from "lucide-react";
import { ActionButton } from "../util/ActionButton";
import { CopyButton } from "../util/CopyButton";

// ============================================================
// Step0. テキスト抽出結果セクション
// ============================================================

interface PreviewSectionProps {
    text: string;
    onStart: () => void;
    hasGenerated: boolean; // 生成済みフラグ
}

export const PreviewSection = ({ text, onStart, hasGenerated }: PreviewSectionProps) => {
    return (
        <div className="space-y-6">
            {/* ツールバー */}
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 pt-2 py-4 border-b border-slate-500">
                {/* 左側：ラベル */}
                <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <FileText size={18} />
                    <span>テキスト抽出結果</span>
                </div>

                {/* 右側：アクション (コピー & 小ボタン) */}
                <div className="flex items-center gap-3">
                    <CopyButton text={text} />
                    {/* 上部アクションボタンを表示 */}
                    <ActionButton
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
                <ActionButton
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
