// Patent_Survey_APP/frontend/app/chat-ui/KnowledgeTypes.ts

export type Message = {
    role: "user" | "llm";
    content: string;
};

export type DocumentFormat = "markdown" | "text";
