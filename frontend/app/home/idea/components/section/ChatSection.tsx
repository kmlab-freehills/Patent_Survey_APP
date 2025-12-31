// Patent_Survey_APP/frontend/app/home/idea/components/section/ChatSection.tsx

"use client";

import { Loader2, MessageSquare, PanelRight, Send } from "lucide-react";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ChatMessageType } from "../screen/GeneratingScreen";
import { CopyButton } from "../util/CopyButton";
import { MarkdownRenderer } from "../util/MarkdownRenderer";

// ============================================================
// Step3. チャットセクション
// ============================================================

interface ChatSectionProps {
    chatHistory: ChatMessageType[];
    isGenerating: boolean;
    error: string | null;
    onSubmit: (message: string) => void;
    setActiveParagraphId: (id: string) => void;
    setIsSourceOpen: Dispatch<SetStateAction<boolean>>;
}

export const ChatSection = ({
    chatHistory,
    isGenerating,
    error,
    onSubmit,
    setActiveParagraphId,
    setIsSourceOpen,
}: ChatSectionProps) => {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 新しいメッセージが追加されたら自動スクロール
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, isGenerating]);

    const handleSubmit = () => {
        if (!inputValue.trim() || isGenerating) return;
        onSubmit(inputValue);
        setInputValue("");
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* ツールバー */}
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 pt-2 py-4 border-b border-slate-500">
                <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <MessageSquare size={18} />
                    <span>対話モード</span>
                </div>
            </div>

            {/* チャット履歴 */}
            <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-22">
                {chatHistory.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                        <p>特許技術について質問してください。</p>
                        <p className="text-xs mt-2">例: この技術の実現可能性は？</p>
                    </div>
                ) : (
                    chatHistory.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${
                                msg.role === "user" ? "justify-end" : "justify-start"
                            }`}>
                            {/* 吹き出しとボタンを縦に積むためのラッパー (flex-col) */}
                            <div className="flex flex-col max-w-3xl">
                                <div
                                    className={`px-4 py-3 rounded-lg ${
                                        msg.role === "user"
                                            ? "bg-blue-100 text-slate-800"
                                            : "bg-white border border-slate-200 shadow-sm"
                                    }`}>
                                    {msg.role === "user" ? (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    ) : (
                                        <div className="prose prose-slate max-w-none p-1">
                                            <MarkdownRenderer
                                                content={msg.content}
                                                onClickParagraph={(id) => {
                                                    setActiveParagraphId(id);
                                                    setIsSourceOpen(true);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* コピーボタン（アシスタントかつ内容がある場合） */}
                                {msg.role === "assistant" && msg.content && (
                                    <div className="flex justify-start mt-2">
                                        <CopyButton text={msg.content} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {isGenerating && (
                    <div className="flex items-center gap-2 text-purple-500 animate-pulse">
                        <Loader2 size={20} className="animate-spin" />
                        <span>考え中...</span>
                    </div>
                )}

                {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>}

                <div ref={messagesEndRef} />
            </div>

            {/* 入力エリア（サイドバーの幅考慮） */}
            <div className="fixed bottom-0 z-50" style={{ left: "var(--sidebar-width)", right: 0 }}>
                <div className="mx-auto max-w-5xl px-4">
                    {/* 原文表示ボタン */}
                    <button
                        onClick={() => setIsSourceOpen((prev) => !prev)}
                        className="m-3 flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg">
                        <PanelRight size={16} />
                        <span>原文を隣に表示</span>
                    </button>

                    <div className="flex gap-2 px-3 pb-3">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            rows={3}
                            placeholder="質問を入力..."
                            className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                            onClick={handleSubmit}
                            disabled={!inputValue.trim() || isGenerating}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300 transition-colors shrink-0 flex items-center justify-center">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
