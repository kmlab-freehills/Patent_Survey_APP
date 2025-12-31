// Patent_Survey_APP/frontend/app/home/idea/components/util/ActionButton.tsx

"use client";

import { ArrowRight, RotateCw, type LucideIcon } from "lucide-react"; // アイコンの型もインポート

// ============================================================
// 総合アクションボタン
// ============================================================

interface ActionButtonProps {
    onClick: () => void;
    isReRun: boolean; // 再生成かどうか
    size?: "small" | "normal"; // 上部: small, 下部: normal
    labelText: string; // ボタンに表示するテキスト
    icon: LucideIcon; // コンポーネントそのものを渡す
    colorTheme: "blue" | "emerald" | "purple"; // 必要に応じて追加
}

export const ActionButton = ({
    onClick,
    isReRun,
    size = "normal",
    labelText,
    icon: Icon, // JSXとして使うため大文字にリネーム
    colorTheme,
}: ActionButtonProps) => {
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
        purple: {
            initial: "bg-purple-600 hover:bg-purple-700 text-white",
            retry: "bg-white text-purple-600 border border-purple-200 hover:bg-purple-50",
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
