// Patent_Survey_APP/frontend/app/workspace/idea/[reportId]/chat/page.tsx

"use client";

import { CopyButton } from "@/components/ui/CopyButton";
import { MarkdownRenderer } from "../source-sidebar/IdeaMarkdownRenderer";
import { useLayoutState } from "@/hooks/useLayoutState";
import { useGeminiMultiTurn } from "@/hooks/useGeminiMultiTurn";
import { useIdeaReport } from "../IdeaReportContext";
import { useReport } from "@/hooks/useReport";
import { UIMessage } from "@/types/gemini";
import {
    AlertCircle,
    Bot,
    Loader2,
    MessageSquare,
    RefreshCw,
    Send,
    Sparkles,
    User,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { IdeaReportContent } from "../ideaReportType";

// 環境変数
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatPage() {
    const { currentReport, loadReportFromApi } = useReport<IdeaReportContent>();
    const { messages, isGenerating, error, sendMessage, setMessages } = useGeminiMultiTurn();

    // コンテキスト（特許原文・解析結果・アイデア）
    const [context, setContext] = useState<Record<string, string> | null>(null);
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [contextError, setContextError] = useState<string | null>(null);

    // 入力フォーム
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ------------------------------------------------------------
    // コンテキスト取得（特許原文・解析結果・アイデア）
    // ------------------------------------------------------------
    useEffect(() => {
        const fetchContext = async () => {
            if (!currentReport) return;

            setIsLoadingContext(true);
            setContextError(null);

            try {
                const { report_type, report_id } = currentReport.metadata;

                // 1. 特許テキストを取得
                const patentRes = await fetch(
                    `${API_BASE}/static/reports/${report_type}/${report_id}/patent/data.json`
                );

                if (!patentRes.ok) throw new Error("特許データの取得に失敗しました");

                const patentData = await patentRes.json();

                // 全文結合
                const fullPatentText = Object.entries(patentData)
                    .map(([key, content]) => {
                        if (key === "others" && typeof content === "object") {
                            return Object.entries(content as Record<string, string>)
                                .map(([k, v]) => `【${k}】\n${v}`)
                                .join("\n\n");
                        }
                        if (typeof content === "string" && content) {
                            return `【${key}】\n${content}`;
                        }
                        return "";
                    })
                    .filter(Boolean)
                    .join("\n\n");

                // 2. 解析結果をレポートから取得
                const analysis =
                    currentReport.content.generated?.artifacts?.patent_summary?.output || null;

                if (!analysis) {
                    throw new Error("解析結果が見つかりません");
                }

                // 3. アイデアをレポートから取得
                const ideas =
                    currentReport.content.generated?.artifacts?.idea_generation?.output || null;

                if (!ideas) {
                    throw new Error("アイデアが見つかりません");
                }

                setContext({
                    patent_text: fullPatentText,
                    analysis_text: analysis,
                    idea_text: ideas,
                });
            } catch (err) {
                console.error("Context fetch error:", err);
                setContextError(
                    err instanceof Error ? err.message : "データの読み込みに失敗しました"
                );
            } finally {
                setIsLoadingContext(false);
            }
        };

        fetchContext();
    }, [currentReport]);

    // ------------------------------------------------------------
    // 会話履歴の復元
    // ------------------------------------------------------------
    useEffect(() => {
        const savedConversation = currentReport?.content.generated?.conversation;

        if (savedConversation?.messages) {
            setMessages(savedConversation.messages as UIMessage[]);
        }
    }, [currentReport, setMessages]);

    // ------------------------------------------------------------
    // 自動スクロール（新しいメッセージが追加されたら最下部へ）
    // ------------------------------------------------------------
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ------------------------------------------------------------
    // 送信ハンドラ
    // ------------------------------------------------------------
    const handleSend = async () => {
        if (!input.trim() || !context || !currentReport || isGenerating) return;

        const userInput = input.trim();
        setInput(""); // 入力欄をクリア

        try {
            // メッセージ送信
            await sendMessage(userInput, {
                reportType: currentReport.metadata.report_type,
                reportId: currentReport.metadata.report_id,
                systemPromptType: "patent_chat",
                context: context,
            });

            // 完了後、レポートを再取得して最新状態に同期
            await loadReportFromApi(
                currentReport.metadata.report_id,
                currentReport.metadata.report_type
            );

            console.log("[Chat] Message sent and report reloaded");
        } catch (err) {
            console.error("[Chat] Send error:", err);
        }
    };

    // ------------------------------------------------------------
    // Enterキーで送信（Shift+Enterで改行）
    // ------------------------------------------------------------
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ------------------------------------------------------------
    // 再送信ハンドラ（エラー時）
    // ------------------------------------------------------------
    const handleRetry = () => {
        if (messages.length > 0) {
            const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
            if (lastUserMessage) {
                setInput(lastUserMessage.content);
            }
        }
    };

    // ------------------------------------------------------------
    // エラー / ローディング状態
    // ------------------------------------------------------------

    // 1. レポート読み込み中
    if (!currentReport) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="animate-spin" size={32} />
                    <span>レポートを読み込んでいます...</span>
                </div>
            </div>
        );
    }

    // 2. コンテキスト取得中
    if (isLoadingContext) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="animate-spin" size={32} />
                    <span>対話環境を準備しています...</span>
                </div>
            </div>
        );
    }

    // 3. コンテキスト取得エラー
    if (contextError || !context) {
        return (
            <div className="flex h-full items-center justify-center bg-white p-8">
                <div className="text-center max-w-md">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        データの読み込みエラー
                    </h3>
                    <p className="text-slate-600 mb-6">
                        {contextError || "必要なデータが見つかりません"}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors">
                            <RefreshCw size={20} />
                            ページを再読み込み
                        </button>

                        {contextError?.includes("アイデア") && (
                            <Link
                                href={`/workspace/idea/${currentReport.metadata.report_id}/ideas`}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors">
                                <Zap size={20} />
                                アイデアを生成する
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------
    // メインUI
    // ------------------------------------------------------------
    return (
        <div className="h-full flex flex-col">
            {/* ツールバー */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                {/* 左側: タイトル */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                        <MessageSquare size={20} strokeWidth={2.5} />
                        <span className="text-sm font-bold">対話モード</span>
                    </div>
                    <span className="text-slate-400 text-xs font-medium">Step 4 / 4</span>
                </div>

                {/* 右側: 会話数表示 */}
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <span className="font-medium">会話数:</span>
                    <span className="font-bold text-blue-600">
                        {messages.filter((m) => m.role === "user").length}
                    </span>
                </div>
            </div>

            {/* メッセージ履歴エリア */}
            <div className="flex-1 overflow-y-auto p-6 pb-40 lg:p-10 lg:pb-40">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Empty State（会話がまだない場合） */}
                    {messages.length === 0 && !isGenerating && (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="relative mb-8">
                                <div className="w-24 h-24 bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center shadow-lg">
                                    <MessageSquare
                                        size={48}
                                        className="text-blue-600"
                                        strokeWidth={2}
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                            </div>

                            <h2 className="text-3xl font-bold text-slate-800 mb-4">
                                AIとの対話を開始
                            </h2>

                            <p className="text-slate-600 max-w-xl leading-relaxed mb-3">
                                特許技術やアイデアについて、AIに自由に質問できます。
                            </p>
                            <ul className="text-sm text-slate-500 space-y-1 mb-8">
                                <li>✓ 技術の詳細について深掘り</li>
                                <li>✓ アイデアの実現可能性を検討</li>
                                <li>✓ 競合技術との比較を相談</li>
                            </ul>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md">
                                <p className="text-sm text-blue-800">
                                    💡
                                    <strong className="ml-1">ヒント:</strong>
                                    <br />
                                    「この技術の強みは？」「実現可能性は？」など、具体的な質問をすると効果的です。
                                </p>
                            </div>
                        </div>
                    )}

                    {/* メッセージリスト */}
                    {messages.map((message, index) => (
                        <MessageBubble key={message.id || index} message={message} />
                    ))}

                    {/* エラー通知 */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
                            <AlertCircle className="text-red-600 shrink-0" size={24} />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-red-900">
                                    メッセージの送信に失敗しました
                                </p>
                                <p className="text-xs text-red-600 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors">
                                再送信
                            </button>
                        </div>
                    )}

                    {/* スクロール用のアンカー */}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* 入力フォーム（固定・下部） */}
            <div className=" p-4 lg:p-6 absolute w-full bottom-0 shadow-lg">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
                        {/* テキストエリア */}
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="メッセージを入力... (Shift+Enterで改行)"
                                disabled={isGenerating}
                                className="w-full px-4 py-3 pr-12 bg-white border border-slate-200 rounded-xl 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                    resize-none overflow-y-auto
                                    disabled:bg-slate-50 disabled:text-slate-400
                                    transition-all"
                                rows={3}
                                style={{ maxHeight: "200px" }}
                            />

                            {/* 文字数カウンター（オプション） */}
                            <div className="absolute bottom-2 right-2 text-xs text-slate-400">
                                {input.length} / 2000
                            </div>
                        </div>

                        {/* 送信ボタン */}
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isGenerating}
                            className="shrink-0 w-14 h-14 flex items-center justify-center
                                bg-blue-600 text-white rounded-xl mt-5
                                hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5
                                active:translate-y-0
                                disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:translate-y-0
                                transition-all duration-200">
                            {isGenerating ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <Send size={24} />
                            )}
                        </button>
                    </div>

                    {/* 補足情報 */}
                    <p className="text-xs text-slate-400 mt-2 text-center">
                        重要な情報は確認するようにしてください。
                    </p>
                </div>
            </div>
        </div>
    );
}

// ------------------------------------------------------------
// メッセージバブル（サブコンポーネント）
// ------------------------------------------------------------
const MessageBubble = ({ message }: { message: UIMessage }) => {
    // 原文参照サイドバー関連
    const { setIsRightSidebarOpen } = useLayoutState();
    const { setActiveParagraphId } = useIdeaReport();

    const handleParagraphClick = (id: string) => {
        setActiveParagraphId(id);
        setIsRightSidebarOpen(true);
    };

    const isUser = message.role === "user";

    return (
        <div
            className={`flex gap-4 ${
                isUser ? "justify-end" : "justify-start"
            } animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {/* アイコン（アシスタント側のみ） */}
            {!isUser && (
                <div className="shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Bot size={20} />
                </div>
            )}

            {/* メッセージ本体 */}
            <div
                className={`flex-1 max-w-3xl ${
                    isUser
                        ? "bg-blue-100/80 border border-slate-300"
                        : "bg-white border border-slate-200"
                } rounded-xl p-5 pt-3 shadow-2xs group relative`}>
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {isUser ? (
                            <>
                                <User size={16} className="opacity-80" />
                                <span className="text-sm font-bold opacity-90">あなた</span>
                            </>
                        ) : (
                            <>
                                <Bot size={16} className="text-blue-600" />
                                <span className="text-sm font-bold text-slate-800">
                                    AI アシスタント
                                </span>
                            </>
                        )}
                    </div>

                    {/* コピーボタン（ホバー時に表示） */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyButton text={message.content} className={`${isUser ? "" : ""}`} />
                    </div>
                </div>

                {/* コンテンツ */}
                <div className={`${isUser ? "text-slate-700" : "text-slate-700"}`}>
                    {isUser ? (
                        // ユーザーメッセージ（プレーンテキスト・改行保持）
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    ) : (
                        // アシスタントメッセージ（Markdown）
                        <div className="prose prose-slate prose-sm max-w-none">
                            <MarkdownRenderer
                                content={message.content || ""}
                                onClickParagraph={handleParagraphClick}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* アイコン（ユーザー側のみ） */}
            {isUser && (
                <div className="shrink-0 w-10 h-10 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center">
                    <User size={20} />
                </div>
            )}
        </div>
    );
};
