// frontend/types/gemini.ts

export interface UIMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export interface StreamEvent {
    type: "content_delta" | "done" | "error";
    data: any;
}