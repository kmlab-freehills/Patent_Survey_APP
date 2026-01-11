// Patent_Survey_APP/frontend/app/home/idea/components/screen/GeneratingScreen.tsx

"use client";

import "@/styles/markdown_style.css";
import { Bot, FileText, Lightbulb, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
// 関数コンポーネント
import { formatPatentToString, parseSourceText } from "../sidebar/sourcePatentTextProcess";
// UIコンポーネント
import { AnalysisSection } from "../section/AnalysisSection";
import { ChatSection } from "../section/ChatSection";
import { HeaderInfo, StepTabs } from "../section/HeaderSection";
import { IdeaSection } from "../section/IdeaSection";
import { PreviewSection } from "../section/PreviewSection";
import { SourceSidebar } from "../sidebar/SourceSidebar";
// カスタムフック
import { useMenu } from "@/hooks/appState";
import { useGeminiChat } from "@/hooks/useGeminiChat";
import { useSessionPersistence, type SessionData } from "@/hooks/useSessionPersistence";

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
    sessionId: string; // セッションID
    onReset?: () => void; // 「別の特許を解析」用
}

// ------------------------------------------------------------
// メインコンポーネント
// ------------------------------------------------------------

export const GeneratingScreen = ({
    fileName,
    patentId,
    patentData,
    patentImages,
    sessionId,
    onReset,
}: GeneratingScreenProps) => {
    // ------------------------------------------------------------
    // State定義
    // ------------------------------------------------------------

    // グローバルステート取得
    const { setRightSidebarContent, setIsRightSidebarOpen } = useMenu();

    // 解析用フック
    const {
        messages: analysisMessages,
        isGenerating: isGeneratingAnalysis,
        error: analysisError,
        sendMessage: sendAnalysisMessage,
        clearSession: clearAnalysisSession,
    } = useGeminiChat();

    // アイデア生成用フック
    const {
        messages: ideaMessages,
        isGenerating: isGeneratingIdea,
        error: ideaError,
        sendMessage: sendIdeaMessage,
        clearSession: clearIdeaSession,
    } = useGeminiChat();

    // チャット用フック
    const {
        messages: chatMessages,
        isGenerating: isGeneratingChat,
        error: chatError,
        sendMessage: sendChatMessage,
        clearSession: clearChatSession,
        setSessionId: setGeminiChatSessionId,
        sessionId: currentGeminiSessionId,
        setMessages: setChatMessages,
    } = useGeminiChat();

    // ステップ関連
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [maxReachedStep, setMaxReachedStep] = useState<number>(0);
    // 右サイドバー関連
    const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<PatentImage | null>(null);

    // 生成テキストの管理
    const [generatedAnalysisText, setGeneratedAnalysisText] = useState(""); // 解析
    const [generatedIdeaText, setGeneratedIdeaText] = useState(""); // アイデア生成
    const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]); // チャット
    // エラー用
    const [error, setError] = useState<string | null>(null);

    // ============================================================
    // セッション管理（新規追加）
    // ============================================================
    const { createSession, loadSession, saveArtifact, updateSession } = useSessionPersistence();

    // ============================================================
    // 初期化: セッションからStateを復元
    // ============================================================
    useEffect(() => {
        const restoreSession = async () => {
            if (!sessionId) return;

            const session = await loadSession(sessionId);
            if (!session) return;

            // 復元されたデータに基づいて、最新のステップを特定する変数
            let restoredMaxStep = 0;

            // 1. 解析結果の復元
            if (session.artifacts.patent_summary?.output) {
                setGeneratedAnalysisText(session.artifacts.patent_summary.output.text);
                restoredMaxStep = 1; // 解析まで完了
            }

            // 2. アイデアの復元
            if (session.artifacts.idea_generation?.output) {
                setGeneratedIdeaText(session.artifacts.idea_generation.output.text);
                restoredMaxStep = 2; // アイデアまで完了
            }

            // チャットの復元
            if (session.conversation?.messages) {
                // 型変換 (ConversationMessage -> UIMessage)
                const restoredMessages = session.conversation.messages.map((msg) => ({
                    id: msg.id,
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                }));

                // 1. 画面表示用Stateを更新
                setChatHistory(restoredMessages);

                // 2. フック内部のStateも更新
                setChatMessages(restoredMessages);

                // ステップ更新
                setMaxReachedStep((prev) => Math.max(prev, 3));
            }

            // GeminiのセッションIDも復元
            if (session.gemini_session_id) {
                console.log("[Session] Restoring Gemini ID:", session.gemini_session_id);
                setGeminiChatSessionId(session.gemini_session_id);
            }

            // 状態を一括更新
            setMaxReachedStep((prev) => Math.max(prev, restoredMaxStep));

            // 復元した最新のステップへ画面を切り替える
            if (restoredMaxStep > 0) {
                setCurrentStep(restoredMaxStep);
            }
        };

        restoreSession();
    }, [sessionId]);

    // ============================================================
    // Stateの復元
    // ============================================================
    const restoreStateFromSession = (session: SessionData) => {
        // Artifact: patent_summary
        if (session.artifacts.patent_summary?.output) {
            setGeneratedAnalysisText(session.artifacts.patent_summary.output.text);
            setMaxReachedStep((prev) => Math.max(prev, 1));
        }

        // Artifact: idea_generation
        if (session.artifacts.idea_generation?.output) {
            setGeneratedIdeaText(session.artifacts.idea_generation.output.text);
            setMaxReachedStep((prev) => Math.max(prev, 2));
        }

        // Conversation
        if (session.conversation?.messages) {
            const messages = session.conversation.messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));
            setChatHistory(messages);
            setMaxReachedStep((prev) => Math.max(prev, 3));
        }
    };

    // ============================================================
    // 自動保存: 解析結果
    // ============================================================
    useEffect(() => {
        if (!sessionId || !generatedAnalysisText) return;

        const timer = setTimeout(() => {
            saveArtifact(sessionId, "patent_summary", {
                step: 1,
                type: "single_shot",
                prompt_type: "analysis",
                input: {
                    patent_id: patentId,
                    patent_text: fullText,
                },
                output: {
                    text: generatedAnalysisText,
                    generated_at: new Date().toISOString(),
                },
            });
        }, 1000); // 1秒後に保存（debounce）

        return () => clearTimeout(timer);
    }, [sessionId, generatedAnalysisText]);

    // ============================================================
    // 自動保存: アイデア生成結果
    // ============================================================
    useEffect(() => {
        if (!sessionId || !generatedIdeaText) return;

        const timer = setTimeout(() => {
            saveArtifact(sessionId, "idea_generation", {
                step: 2,
                type: "single_shot",
                prompt_type: "idea",
                input: {
                    patent_id: patentId,
                    patent_text: fullText,
                    analysis_text: generatedAnalysisText,
                },
                output: {
                    text: generatedIdeaText,
                    generated_at: new Date().toISOString(),
                },
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [sessionId, generatedIdeaText]);

    // ============================================================
    // 自動保存: チャット履歴
    // ============================================================
    useEffect(() => {
        if (!sessionId || chatHistory.length === 0) return;

        const timer = setTimeout(() => {
            updateSession(sessionId, {
                conversation: {
                    step: 3,
                    type: "multi_turn",
                    context_refs: ["patent_summary", "idea_generation"],
                    messages: chatHistory.map((msg, idx) => ({
                        id: `msg_${idx}`,
                        role: msg.role,
                        content: msg.content,
                        timestamp: new Date().toISOString(),
                    })),
                },
                gemini_session_id: currentGeminiSessionId || undefined,
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [sessionId, chatHistory]);

    // ------------------------------------------------------------
    // データ処理
    // ------------------------------------------------------------

    // 全文取得（一度だけ実行）
    const fullText = useMemo(() => formatPatentToString(patentData), [patentData]);
    const sourceBlocks = useMemo(() => parseSourceText(fullText), [fullText]);

    // ------------------------------------------------------------
    // 右サイドバーに関する処理
    // ------------------------------------------------------------

    // 右サイドバーコンテンツを動的に設定
    useEffect(() => {
        setRightSidebarContent(
            <SourceSidebar
                onClose={() => setIsRightSidebarOpen(false)}
                fileName={fileName}
                sourceBlocks={sourceBlocks}
                activeParagraphId={activeParagraphId}
                patentImages={patentImages}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
            />
        );

        // このページを離れる際にコンテンツをクリア
        return () => {
            setRightSidebarContent(null);
        };
    }, [
        fileName,
        sourceBlocks,
        activeParagraphId,
        patentImages,
        selectedImage,
        setRightSidebarContent,
        setIsRightSidebarOpen,
    ]);

    // activeParagraphId がセットされたら自動でサイドバーを開く
    const handleParagraphClick = (id: string) => {
        setActiveParagraphId(id);
        setIsRightSidebarOpen(true); // グローバルステートを変更
    };

    // ------------------------------------------------------------
    // 解析結果の自動反映（analysisMessagesの最後のメッセージを監視）
    // ------------------------------------------------------------
    useEffect(() => {
        const lastMessage = analysisMessages[analysisMessages.length - 1];
        if (lastMessage?.role === "assistant") {
            setGeneratedAnalysisText(lastMessage.content);
        }
    }, [analysisMessages]);

    // ------------------------------------------------------------
    // アイデア生成結果の自動反映
    // ------------------------------------------------------------
    useEffect(() => {
        const lastMessage = ideaMessages[ideaMessages.length - 1];
        if (lastMessage?.role === "assistant") {
            setGeneratedIdeaText(lastMessage.content);
        }
    }, [ideaMessages]);

    // ------------------------------------------------------------
    // チャットメッセージの自動反映
    // ------------------------------------------------------------

    useEffect(() => {
        setChatHistory(
            chatMessages.map((msg) => ({
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.content,
            }))
        );
    }, [chatMessages]);

    // ------------------------------------------------------------
    // エラーハンドリング（統合）
    // ------------------------------------------------------------
    useEffect(() => {
        if (analysisError || ideaError || chatError) {
            setError(analysisError || ideaError || chatError);
        }
    }, [analysisError, ideaError, chatError]);

    // ------------------------------------------------------------
    // 特許解析ハンドラー（Manager対応）
    // ------------------------------------------------------------
    const handleStartAnalysis = async () => {
        setCurrentStep(1);
        setMaxReachedStep((prev) => Math.max(prev, 1));

        clearAnalysisSession();
        setGeneratedAnalysisText("");
        setError(null);

        // contextを構築して送信
        await sendAnalysisMessage({
            promptType: "analysis",
            context: {
                patent_text: fullText, // 特許テキスト
            },
            saveContext: false, // 解析は履歴不要
        });
    };

    // ------------------------------------------------------------
    // アイデア生成ハンドラー（Manager対応）
    // ------------------------------------------------------------
    const handleStartIdea = async () => {
        setCurrentStep(2);
        setMaxReachedStep((prev) => Math.max(prev, 2));

        clearIdeaSession();
        setGeneratedIdeaText("");
        setError(null);

        // 前段の成果物を含めて送信
        await sendIdeaMessage({
            promptType: "idea",
            context: {
                patent_text: fullText, // 特許テキスト
                analysis_text: generatedAnalysisText, // 解析結果
            },
            saveContext: false,
        });
    };

    // チャット開始ハンドラー
    const handleStartChat = () => {
        setCurrentStep(3);
        setMaxReachedStep((prev) => Math.max(prev, 3));
        setError(null);
    };

    // ------------------------------------------------------------
    // チャット送信ハンドラー（Manager対応）
    // ------------------------------------------------------------
    const handleChatSubmit = async (userMessage: string) => {
        if (!userMessage.trim()) return;

        await sendChatMessage({
            promptType: "chat",
            userMessage: userMessage,
            context: {
                patent_text: fullText, // 特許テキスト
                analysis_text: generatedAnalysisText, // 解析結果
                idea_text: generatedIdeaText, // アイデアリスト
            },
            saveContext: true, // チャットは履歴保持
        });
    };

    return (
        <div className="flex overflow-hidden p-8 h-screen-minus-header">
            <div className="max-w-5xl mx-auto w-full flex flex-col h-full">
                {/* ヘッダー情報 */}
                <HeaderInfo fileName={fileName} setIsSourceOpen={setIsRightSidebarOpen} />
                <button
                    onClick={onReset}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
                    別の特許を解析
                </button>
                {/* タブナビゲーション */}
                <StepTabs
                    currentStep={currentStep}
                    maxReachedStep={maxReachedStep}
                    onTabClick={setCurrentStep}
                />

                {/* コンテンツエリア */}
                <div className="flex-1 overflow-y-auto min-h-0 py-6 px-1">
                    {/* STEP 0: テキスト抽出結果 */}
                    {currentStep === 0 && (
                        <PreviewSection
                            text={fullText}
                            onStart={handleStartAnalysis}
                            hasGenerated={generatedAnalysisText.length > 0} // 既に解析結果があるか判定
                        />
                    )}

                    {/* STEP 1: AI解析（構成要素分解） */}
                    {currentStep === 1 && (
                        <AnalysisSection
                            text={generatedAnalysisText}
                            isGenerating={isGeneratingAnalysis}
                            error={error}
                            onNext={handleStartIdea}
                            hasNextGenerated={generatedIdeaText.length > 0} //既にアイデア生成結果があるか判定
                            setIsSourceOpen={setIsRightSidebarOpen}
                            setActiveParagraphId={handleParagraphClick}
                        />
                    )}

                    {/* STEP 2: アイデア生成 */}
                    {currentStep === 2 && (
                        <IdeaSection
                            text={generatedIdeaText}
                            isGenerating={isGeneratingIdea}
                            error={error}
                            onNext={handleStartChat}
                            hasNextGenerated={maxReachedStep >= 3} // チャット画面に到達しているか判定
                            setIsSourceOpen={setIsRightSidebarOpen}
                            setActiveParagraphId={handleParagraphClick}
                        />
                    )}

                    {/* STEP 3: チャット機能 */}
                    {currentStep === 3 && (
                        <ChatSection
                            chatHistory={chatHistory}
                            isGenerating={isGeneratingChat}
                            error={error}
                            onSubmit={handleChatSubmit}
                            setIsSourceOpen={setIsRightSidebarOpen}
                            setActiveParagraphId={handleParagraphClick}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
