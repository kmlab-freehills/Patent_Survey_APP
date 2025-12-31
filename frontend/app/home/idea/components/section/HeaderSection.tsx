// Patent_Survey_APP/frontend/app/home/idea/components/section/HeaderSection.tsx

"use client";

import { CheckCircle2, Lock, PanelRight } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import { STEPS } from "../screen/GeneratingScreen";

// ============================================================
// 生成画面のヘッダー部分で使用するコンポーネント
// → ヘッダー情報＆タブナビゲーション
// ============================================================

// ------------------------------------------------------------
// 1. ページヘッダー
// ------------------------------------------------------------

interface HeaderInfoProps {
    fileName: string;
    setIsSourceOpen: Dispatch<SetStateAction<boolean>>;
}

export const HeaderInfo = ({ fileName, setIsSourceOpen }: HeaderInfoProps) => (
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
            onClick={() => setIsSourceOpen((prev) => !prev)}
            className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-all">
            <PanelRight size={16} />
            <span>原文を隣に表示</span>
        </button>
    </div>
);

// ------------------------------------------------------------
// 2. ステップタブナビゲーション
// ------------------------------------------------------------

interface StepTabsProps {
    currentStep: number;
    maxReachedStep: number; // 最大到達ステップ（未到達には特定のアクションを実行するまでロック）
    onTabClick: (step: number) => void;
}

export const StepTabs = ({ currentStep, maxReachedStep, onTabClick }: StepTabsProps) => {
    return (
        // w-full を追加して全幅に
        <div className="flex w-full border-b border-slate-200 mb-2 shrink-0">
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
                        // flex-1 justify-center を追加して均等配置
                        className={`relative flex-1 justify-center flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all
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
