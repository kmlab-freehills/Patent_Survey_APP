// frontend/hooks/useGeminiChat.ts

import { useCallback, useRef, useState } from "react";

// 型定義を追加
export interface UIMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface GenerateParams {
    prompt: string;
    systemInstruction?: string;
    saveContext?: boolean;
    patentId?: string;
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

        // ユーザーメッセージと空のアシスタントメッセージを追加
        const userMsg: UIMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: params.prompt,
        };
        const assistantMsg: UIMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
        };
        setMessages((prev) => [...prev, userMsg, assistantMsg]);

        try {
            const response = await fetch("http://localhost:8000/generate/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: params.prompt,
                    session_id: sessionIdRef.current,
                    save_context: params.saveContext ?? true,
                    system_instruction: params.systemInstruction,
                    patent_id: params.patentId,
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
                                    const updated = [...prev];
                                    const lastMsg = updated[updated.length - 1];
                                    if (lastMsg.role === "assistant") {
                                        lastMsg.content += event.data.chunk;
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
