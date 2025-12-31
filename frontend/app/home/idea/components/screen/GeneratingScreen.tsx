// Patent_Survey_APP/frontend/app/home/idea/components/screen/GeneratingScreen.tsx

"use client";

import "@/styles/markdown_style.css";
import { Bot, FileText, Lightbulb, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
// 関数コンポーネント
import { formatPatentToString, parseSourceText } from "../sidebar/sourcePatentTextProcess";
// UIコンポーネント
import { AnalysisSection } from "../section/AnalysisSection";
import { ChatSection } from "../section/ChatSection";
import { IdeaSection } from "../section/IdeaSection";
import { PreviewSection } from "../section/PreviewSection";
import { SourceSidebar } from "../sidebar/SourceSidebar"; // 原文確認サイドバー
import { HeaderInfo, StepTabs } from "../section/HeaderSection";

// ============================================================
// Screen 2. 生成画面
// ============================================================

// ------------------------------------------------------------
// 型定義
// ------------------------------------------------------------

// 特許の型
import type { components } from "@/types/schema";
type PatentContent = components["schemas"]["PatentContent"];
type PatentImage = components["schemas"]["PatentImage"];

// チャットメッセージの型
export type ChatMessageType = {
    role: "user" | "assistant";
    content: string;
};

// ステップ定義
export const STEPS = [
    { id: 0, label: "テキスト抽出結果", icon: FileText },
    { id: 1, label: "AI解析結果", icon: Bot },
    { id: 2, label: "応用アイデア", icon: Lightbulb },
    { id: 3, label: "対話モード", icon: MessageSquare },
] as const;

// Propsの型
interface GeneratingScreenProps {
    fileName: string;
    patentId: string;
    patentData: PatentContent;
    patentImages: PatentImage[];
}

// ------------------------------------------------------------
// メインコンポーネント
// ------------------------------------------------------------

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
    const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
    const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
    // チャット機能
    const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
    const [isGeneratingChat, setIsGeneratingChat] = useState(false);

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
    // API呼び出しハンドラー（特許解析＆アイデア生成）
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

    const handleStartChat = () => {
        // ステップを移動
        setCurrentStep(3);
        setMaxReachedStep((prev) => Math.max(prev, 3));
    };

    // ------------------------------------------------------------
    // API呼び出しハンドラー（チャット機能）
    // ------------------------------------------------------------

    // 3. チャット送信
    const handleChatSubmit = async (userMessage: string) => {
        if (!userMessage.trim()) return;

        // ユーザーメッセージを即座に表示
        setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);

        // アシスタント応答の初期化
        setChatHistory((prev) => [...prev, { role: "assistant", content: "" }]);

        setIsGeneratingChat(true);
        setError(null);

        try {
            const response = await fetch("http://localhost:8000/generate/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patent_id: patentId,
                    user_message: userMessage,
                    analysis_text: generatedAnalysisText,
                    idea_text: generatedIdeaText,
                }),
            });

            if (!response.ok) {
                throw new Error(`エラーが発生しました (${response.status})`);
            }

            if (!response.body) {
                throw new Error("レスポンスが空です");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let assistantText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantText += chunk;

                // 最後のアシスタントメッセージを更新
                setChatHistory((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (updated[lastIdx]?.role === "assistant") {
                        updated[lastIdx] = {
                            ...updated[lastIdx],
                            content: assistantText,
                        };
                    }
                    return updated;
                });
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "不明なエラー");
        } finally {
            setIsGeneratingChat(false);
        }
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
                            // ▼既にアイデア結果があるか判定
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
                            onNext={handleStartChat}
                            hasNextGenerated={maxReachedStep >= 3}
                            setActiveParagraphId={setActiveParagraphId}
                            setIsSourceOpen={setIsSourceOpen}
                        />
                    )}
                    {/* STEP 3: チャット機能 */}
                    {currentStep === 3 && (
                        <ChatSection
                            chatHistory={chatHistory}
                            isGenerating={isGeneratingChat}
                            error={error}
                            onSubmit={handleChatSubmit}
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
