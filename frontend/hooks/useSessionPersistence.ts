import { useCallback } from "react";

// ============================================================
// 型定義（backend/session_schemas.pyと対応）
// ============================================================

export interface ArtifactOutput {
    text: string;
    generated_at: string;
}

export interface ArtifactData {
    step: number;
    type: string;
    prompt_type: string;
    input: Record<string, string>;
    output?: ArtifactOutput;
}

export interface ConversationMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

export interface ConversationData {
    step: number;
    type: string;
    context_refs: string[];
    messages: ConversationMessage[];
}

export interface SessionData {
    session_id: string;
    created_at: string;
    updated_at: string;
    artifacts: Record<string, ArtifactData>;
    conversation?: ConversationData;
    gemini_session_id?: string;
}

// ============================================================
// フック本体
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const useSessionPersistence = () => {
    // --------------------------------------------------------
    // セッションの作成
    // --------------------------------------------------------
    const createSession = useCallback(async (): Promise<string> => {
        const response = await fetch(`${API_BASE}/session/`, {
            method: "POST",
        });

        if (!response.ok) {
            throw new Error("Failed to create session");
        }

        const session: SessionData = await response.json();
        return session.session_id;
    }, []);

    // --------------------------------------------------------
    // セッションの読み込み
    // --------------------------------------------------------
    const loadSession = useCallback(async (sessionId: string): Promise<SessionData | null> => {
        const response = await fetch(`${API_BASE}/session/${sessionId}`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error("Failed to load session");
        }

        return response.json();
    }, []);

    // --------------------------------------------------------
    // Artifactの保存
    // --------------------------------------------------------
    const saveArtifact = useCallback(
        async (sessionId: string, name: string, data: ArtifactData): Promise<void> => {
            try {
                const response = await fetch(`${API_BASE}/session/${sessionId}/artifact`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, data }),
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to save artifact: ${response.statusText}`);
                }
                
                console.log(`[Session] Artifact saved: ${name}`);
            } catch (error) {
                console.error(`[Session] Error saving artifact ${name}:`, error);
                // エラーをユーザーに通知する場合はここで処理
            }
        },
        []
    );

    // --------------------------------------------------------
    // セッション全体の更新
    // --------------------------------------------------------
    const updateSession = useCallback(
        async (
            sessionId: string,
            updates: {
                artifacts?: Record<string, ArtifactData>;
                conversation?: ConversationData;
                gemini_session_id?: string;
            }
        ): Promise<void> => {
            const response = await fetch(`${API_BASE}/session/${sessionId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error("Failed to update session");
            }
        },
        []
    );

    return {
        createSession,
        loadSession,
        saveArtifact,
        updateSession,
    };
};
