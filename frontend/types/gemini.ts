// frontend/types/gemini.ts

export interface UIMessage {
    id: string;
    role: "user" | "model";
    content: string;
}

export interface StreamEvent {
    type: "content_delta" | "done" | "error";
    data: any;
}