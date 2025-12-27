"use client"

import { useEffect, useRef } from "react";
import { Message } from "./KnowledgeTypes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import aorun_normal from "@/images/aorun_normal.png"
import "@/styles/markdown_style.css"; // Markdown用のCSS

interface MessageListProps {
  messages: Message[];
  isThinking: boolean;
}

// メッセージリスト表示
const MessageList: React.FC<MessageListProps> = ({ messages, isThinking }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
          // 初期表示テキスト
          <div className="text-center text-gray-500-10">
            <p className="text-sm mt-2">下の入力欄から質問を開始してください。</p>
          </div>
        ) : (
          // 対話内容
          messages.map((msg, idx) => (
            // ユーザーは右寄せ : LLMは左寄せ
            <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'llm' &&
              // LLMのアイコン
              <div className="size-12.5 border-2 border-gray-400 rounded-full bg-white shrink-0 shadow-[0px_2px_8px_rgba(0,0,0,0.1)">
                <Image src={aorun_normal} alt="あおるん" width={50} height={50}/>
              </div>
              }
              <div className={`max-w-4xl px-4 py-3 rounded-2xl
              ${msg.role === 'user' ?
                // ユーザー側のスタイル
                'bg-blue-100/60 hover:bg-blue-100 shadow-sm ml-15'
                :
                // LLM側のスタイル
                'bg-white border border-gray-300 shadow-sm mr-15'
                }`}>
                {msg.role === "user" ? (
                // ユーザー側はプレーンテキストで表示
                <div className="whitespace-break-spaces break-word">
                  {msg.content}
                </div>
                ):(
              // LLM側で回答がまだの場合はスピナー
              msg.role === "llm" && msg.content === "" && isThinking ? (
                <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              ) : msg.role === "llm" ? (
                // LLM側はMarkdown形式で表示
                <div className="markdown break-word">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                ) : null
                )}
              </div>
            </div>
          ))
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};
export default MessageList