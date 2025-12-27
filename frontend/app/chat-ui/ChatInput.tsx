"use Client"

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import send_icon from "@/images/send_icon.svg"; // 仮のパス
import "@/styles/chat_input_style.css"

// プロンプト入力欄
interface ChatInputProps {
  onSubmit: (message: string) => void;
}
const ChatInput: React.FC<ChatInputProps> = ({ onSubmit }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [message]);
  
  const handleSubmit = () => {
    if (!message.trim()) return;
    onSubmit(message);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="relative flex items-center">
            <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力..."
                rows={1}
                style={{ minHeight: '52px' }}
                className="chat w-full pl-4 pr-12 py-3 resize-none bg-white border-[#c4c7c5] border-2 rounded-2xl shadow-[0px_2px_8px_rgba(0,0,0,0.1)]
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSubmit} disabled={!message.trim()}
                    className="absolute right-6 p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 transition-colors">
                <Image src={send_icon} alt="送信" width={20} height={20} />
            </button>
        </div>
    </div>


  );
};
export default ChatInput