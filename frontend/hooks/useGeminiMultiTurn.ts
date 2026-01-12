// frontend/hooks/useGeminiMultiTurn.ts

import { UIMessage } from "@/types/gemini";
import { useCallback, useState } from "react";
import { readSSE } from "./internal/readSSE";

interface MultiTurnParams {
    reportType: string;
    reportId: string;
    systemPromptType: string;
    context: Record<string, string>;
}

export const useGeminiMultiTurn = () => {
    const [messages, setMessages] = useState<UIMessage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(
        async (userContent: string, params: MultiTurnParams) => {
            setIsGenerating(true);
            setError(null);

            const userMsg: UIMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content: userContent,
            };

            const assistantMsg: UIMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "",
            };

            setMessages((prev) => [...prev, userMsg, assistantMsg]);

            try {
                const response = await fetch("/generate/multi-turn", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        report_type: params.reportType,
                        report_id: params.reportId,
                        system_prompt_type: params.systemPromptType,
                        context: params.context,
                        messages: [...messages, userMsg].map((m) => ({
                            role: m.role,
                            content: m.content,
                        })),
                    }),
                });

                await readSSE(response, (event) => {
                    if (event.type === "content_delta") {
                        setMessages((prev) => {
                            const updated = [...prev];
                            updated[updated.length - 1] = {
                                ...updated[updated.length - 1],
                                content: updated[updated.length - 1].content + event.data.chunk,
                            };
                            return updated;
                        });
                    }

                    if (event.type === "error") {
                        throw new Error(event.data.message);
                    }
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : "Unknown error");
            } finally {
                setIsGenerating(false);
            }
        },
        [messages]
    );

    return {
        messages,
        isGenerating,
        error,
        sendMessage,
        setMessages, // report から復元する用
    };
};
