"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

// テキストをクリップボードにコピーするボタンコンポーネント
export const CopyButton = ({
    text,
    className = "",
}: {
    text: string;
    className?: string;
}) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            // 2秒後にアイコンを元に戻す
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            disabled={!text || isCopied}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-all 
                ${
                    isCopied
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                } ${className}`}
            title="クリップボードにコピー">
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
            <span>{isCopied ? "コピー完了" : "コピー"}</span>
        </button>
    );
};
