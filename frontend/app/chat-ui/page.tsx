"use client";

import { useState } from 'react'
import MessageList from './MessageList';
import ChatInput from './ChatInput';

export type Message = {
  role: "user" | "llm";
  content: string;
};

// =========== メインページコンポーネント ===========
export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isThinking, setIsThinking] = useState(false);

  // 新しいメッセージをリストに追加する処理
    const handleNewMessage = async (userMessage: string) => {
        if (!userMessage.trim()) return;
        setIsThinking(true); // スピナー表示フラグ

        // 実際には userMessage と selectedDocs のIDリストを送信する
        console.log("送信するメッセージ:", userMessage);
        
        // UI上での表示を更新
        // ユーザーメッセージを先に表示
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setMessages(prev => [...prev, { role: "llm", content: "" }]);
        // 処理例
        const res = await fetch("http://localhost:8000/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userMessage }),
        });
        if (!res.body) {
            setIsThinking(false);
            return;
        }
        const reader = res.body.getReader();
        let llmText = ""; // 出力結果を保存する変数
        let done = false;
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
            const chunk = new TextDecoder().decode(value);
            llmText += chunk;
            // LLM応答を都度更新
            setMessages(prev => {
                // 最後のllmメッセージだけ更新
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "llm") {
                updated[lastIdx] = { ...updated[lastIdx], content: llmText };
                }
                return updated;
            });
            }
        }
        setIsThinking(false); // メッセージが現れたらスピナー解除
    };

  return (
    <div className='fixed bg-white inset-0 bg-opacity-50 overflow-y-auto'>
        <div className="flex flex-col">
        {/* ヘッダー */}
        <header className="absolute w-full bg-white border-b pt-20 p-4 text-center shadow-sm">
            <h1 className="text-xl font-bold">チャットUI</h1>
        </header>

        {/* メッセージリスト */}
        <div className='pb-45 pt-30'>
            <MessageList messages={messages} isThinking={isThinking} />
        </div>

        {/* プロンプト入力エリア */}
        <div className="fixed bottom-0 w-full pb-22 pt-4">
            <ChatInput
            onSubmit={handleNewMessage}
            />
        </div>
        </div>
    </div>
  );
}