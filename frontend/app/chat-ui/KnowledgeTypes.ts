// =========== 知識共有AI型定義 ===========
export type Message = {
  role: "user" | "llm";
  content: string;
};

export type DocumentFormat = 'markdown' | 'text';