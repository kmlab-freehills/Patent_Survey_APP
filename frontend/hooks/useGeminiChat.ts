// frontend/hooks/useGeminiChat.ts

import { useCallback, useRef, useState } from "react";

// 表示する型定義
export interface UIMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

// パラメーターの型定義
interface GenerateParams {
    promptType: string; // "analysis" | "idea" | "chat"
    context: Record<string, string>; // 辞書型コンテキスト
    userMessage?: string; // チャット時のユーザー入力（解析時は空でも可）
    saveContext?: boolean; // 履歴を保存するか
    sessionId?: string; // 明示的に指定する場合
}

export const useGeminiChat = () => {
    const [messages, setMessages] = useState<UIMessage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const sessionIdRef = useRef<string | null>(null);

    // ==========================================
    // 送信処理
    // ==========================================
    const sendMessage = useCallback(async (params: GenerateParams) => {
        setIsGenerating(true);
        setError(null);

        // UI表示用のメッセージ処理
        // 解析・アイデア生成モードの場合は、システム的なメッセージは表示しない、
        // またはユーザー入力がある場合（チャット）のみ表示する等の制御が必要
        if (params.userMessage) {
            const userMsg: UIMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content: params.userMessage,
            };
            setMessages((prev) => [...prev, userMsg]);
        }

        // アシスタントの空メッセージ枠を追加（ストリーミング用）
        const assistantMsg: UIMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
        };
        setMessages((prev) => [...prev, assistantMsg]);

        try {
            const response = await fetch("http://localhost:8000/generate/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // バックエンドの GenerateRequest スキーマに合わせる
                    prompt_type: params.promptType,
                    context: params.context,
                    user_message: params.userMessage || null,
                    session_id: params.sessionId || sessionIdRef.current,
                    save_context: params.saveContext ?? true,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            // ストリーミング受信ループ
            const reader = response.body?.getReader();
            if (!reader) throw new Error("Response body is empty");

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // 不完全な行は持ち越し

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;

                    try {
                        const event = JSON.parse(line.slice(6));

                        // イベントハンドリング
                        switch (event.type) {
                            case "session_init":
                                setSessionId(event.data.session_id);
                                sessionIdRef.current = event.data.session_id;
                                break;
                            case "content_delta":
                                setMessages((prev) => {
                                    // 配列の浅いコピーを作成
                                    const updated = [...prev];

                                    // 最後のメッセージのインデックスを取得
                                    const lastIndex = updated.length - 1;

                                    // オブジェクト自体もコピーして新しい参照を作る
                                    const lastMsg = { ...updated[lastIndex] };

                                    if (lastMsg.role === "assistant") {
                                        // コピーしたオブジェクトに対して追記
                                        lastMsg.content += event.data.chunk;
                                        // 配列の該当箇所を新しいオブジェクトで置き換え
                                        updated[lastIndex] = lastMsg;
                                    }
                                    return updated;
                                });
                                break;

                            case "error":
                                throw new Error(event.data.message);
                        }
                    } catch (e) {
                        console.error("JSON Parse Error:", e);
                    }
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "不明なエラー";
            setError(errorMessage);
            console.error("Generation error:", err);
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const clearSession = useCallback(() => {
        setMessages([]);
        setSessionId(null);
        sessionIdRef.current = null;
        setError(null);
    }, []);

    return {
        messages,
        isGenerating,
        sessionId,
        error,
        sendMessage,
        clearSession,
    };
};
