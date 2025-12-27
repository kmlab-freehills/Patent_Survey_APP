'use client';

import React, { useState, useRef } from 'react';
import { Send, Bot, Loader2, FileText, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import "@/styles/markdown_style.css"; // Markdown用のCSS

// Props定義
// バックエンドと通信するために patentId が必須になるため追加しています
interface GeneratingScreenProps {
  fileName: string;
  abstract: string;
  patentId: string; // アップロード時に発行されたID
}

export const GeneratingScreen = ({ fileName, abstract, patentId }: GeneratingScreenProps) => {
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // 生成が一度でも始まったかどうか
  const [error, setError] = useState<string | null>(null);

  // ストリーミング処理
  const handleGenerate = async () => {
    setIsGenerating(true);
    setHasStarted(true);
    setGeneratedText('');
    setError(null);

    try {
      // APIエンドポイント
      const response = await fetch('http://localhost:8000/generate/patent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patent_id: patentId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('API request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // チャンクをデコードしてテキストに追加
        const chunk = decoder.decode(value, { stream: true });
        setGeneratedText((prev) => prev + chunk);
      }

    } catch (err) {
      console.error(err);
      setError('生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* --- スクリーンヘッダー (既存部分) --- */}
        <div>
          <h2 className="text-lg font-medium text-slate-800 mb-1 flex items-center gap-2">
            <FileText className="text-blue-600" size={24} />
            抽出されたテキスト
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            アップロードされた特許PDFからテキストを抽出しました。<br />
            ファイル名：<span className="font-medium text-slate-700">{fileName}</span>
          </p>



          <div className='bg-white p-4 rounded-lg shadow-sm border border-slate-200 whitespace-break-spaces break-word'>
            {abstract}
          </div>

        </div>

        {/* --- 特許解析実行エリア --- */}
        {!hasStarted && (
          <div className="flex justify-center py-8">
            <button
              onClick={handleGenerate}
              className="
                group relative flex items-center justify-center gap-3
                px-8 py-4 bg-liner-to-r from-blue-600 to-indigo-600
                text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5
                transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-4 focus:ring-blue-300
              "
            >
              <Sparkles size={20} className="animate-pulse" />
              <span>特許解析を実行</span>
              <Send size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* --- AI生成結果表示エリア (Markdown) --- */}
        {hasStarted && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <Bot size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                AIによる説明
              </h3>
              {isGenerating && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                  <Loader2 size={14} className="animate-spin" />
                  生成中...
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-50">
              {error ? (
                <div className="text-red-500 bg-red-50 p-4 rounded-lg flex items-center gap-2">
                  <span className="font-bold">Error:</span> {error}
                </div>
              ) : (
                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-4 prose-p:leading-relaxed prose-li:marker:text-indigo-500">
                  {/* Markdownレンダリング */}
                  <div className="markdown break-word">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {generatedText}
                    </ReactMarkdown>
                  </div>
                  {/* 生成中のカーソル点滅エフェクト */}
                  {isGenerating && (
                    <span className="inline-block w-2 h-5 ml-1 align-middle bg-indigo-500 animate-pulse" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};