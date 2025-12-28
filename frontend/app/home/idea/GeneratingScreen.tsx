// GeneratingScreen.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Bot, Loader2, FileText, Sparkles, Lightbulb, ArrowRight, PanelRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import "@/styles/markdown_style.css";
import { MarkdownRenderer } from './util/MarkdownRenderer';
import { SourceSidebar } from './SourceSidebar';
import { parseSourceText } from './util/parseSourceText';
import { formatPatentToString } from './util/patentFormatter';
import type { components } from '@/types/schema';

type PatentContent = components['schemas']['PatentContent'];

interface GeneratingScreenProps {
  fileName: string;
  patentId: string;
  patentData: PatentContent;
}

export const GeneratingScreen = ({ fileName, patentId, patentData }: GeneratingScreenProps) => {
  // 原文参照サイドバーの開閉
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);


  // ステータス管理（共通）
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 生成テキスト
  const [generatedText, setGeneratedText] = useState('');
  const [ideaText, setIdeaText] = useState('');

  // アイデア生成UI状態
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
  const [showIdeaSection, setShowIdeaSection] = useState(false);

  // 全文取得（一度だけ実行）
  const fullText = useMemo(() => {
    return formatPatentToString(patentData);
  }, [patentData]);

  const sourceBlocks = useMemo(
    () => parseSourceText(fullText),
    [fullText]
  );

  /**
   * 共通ストリーミング処理ヘルパー
   * @param url APIエンドポイント
   * @param body POSTするボディ
   * @param onUpdate チャンク受信時のコールバック
   * @param onStart 開始時の状態更新コールバック
   * @param onComplete 完了時の状態更新コールバック
   */

  const streamResponse = async (
    url: string,
    body: object,
    onUpdate: (chunk: string) => void,
    onStart: () => void,
    onComplete: () => void
  ) => {
    onStart();
    setError(null);

    try {
      // リクエスト
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // レスポンス判定
      if (!response.ok || !response.body) {
        throw new Error('API request failed');
      }
      // ストリーム処理準備
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      // ストリーム処理
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onUpdate(decoder.decode(value, { stream: true }));
      }
      // エラーハンドリング
    } catch (err) {
      console.error(err);
      setError('生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      onComplete();
    }
  };

  // 特許解析ハンドラー
  const handleGenerate = () => {
    setGeneratedText('');
    setHasStarted(true);

    streamResponse(
      'http://localhost:8000/generate/patent',
      { patent_id: patentId },
      (chunk) => setGeneratedText((prev) => prev + chunk),
      () => setIsGenerating(true),
      () => setIsGenerating(false)
    );
  };

  // アイデア生成ハンドラー
  const handleGenerateIdea = () => {
    setIdeaText('');
    setShowIdeaSection(true);

    streamResponse(
      'http://localhost:8000/generate/idea',
      { patent_id: patentId, explanation_text: generatedText },
      (chunk) => setIdeaText((prev) => prev + chunk),
      () => setIsGeneratingIdea(true),
      () => setIsGeneratingIdea(false)
    );
  };

  return (
    <div className="flex overflow-hidden p-8">
      <div className="max-w-4xl mx-auto space-y-8 w-full">
        {/* --- スクリーンヘッダー --- */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-medium text-slate-800 mb-1 flex items-center gap-2">
                <FileText className="text-blue-600" size={24} />
                抽出されたテキスト
              </h2>
              <p className="text-slate-500 text-sm">
                ファイル名：<span className="font-medium text-slate-700">{fileName}</span>
              </p>
            </div>
            {/* 原文参照サイドバー開閉ボタン */}
            <SourceSidebarButton setIsSourceOpen={setIsSourceOpen} />
          </div>

          <div className='bg-white p-4 rounded-lg shadow-sm border border-slate-200 whitespace-break-spaces break-word max-h-60 overflow-y-auto'>
            {patentData.abstract}
          </div>
        </div>

        {/* --- 解析開始ボタン --- */}
        {!hasStarted && (
          <div className="flex justify-center py-8">
            <button
              onClick={handleGenerate}
              className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Sparkles size={20} />
              <span>特許解析を実行</span>
            </button>
          </div>
        )}

        {/* --- AI生成結果 (解析) --- */}
        {hasStarted && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <Bot size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">AIによる解析</h3>

              {isGenerating && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                  <Loader2 size={14} className="animate-spin" />
                  生成中...
                </div>
              )}
              <SourceSidebarButton setIsSourceOpen={setIsSourceOpen} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[200px]">
              {error ? (
                <div className="text-red-500 bg-red-50 p-4 rounded-lg flex items-center gap-2">
                  <span className="font-bold">Error:</span> {error}
                </div>
              ) : (
                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-4 prose-p:leading-relaxed prose-li:marker:text-indigo-500">
                  <div className="markdown break-word">
                    <MarkdownRenderer
                      content={generatedText}
                      onClickParagraph={(id) => {
                        setActiveParagraphId(id);
                        setIsSourceOpen(true);
                      }}
                    />
                  </div>
                  {/* カーソル点滅 */}
                  {isGenerating && (
                    <span className="inline-block w-2 h-5 ml-1 align-middle bg-indigo-500 animate-pulse" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- アイデア生成ボタン --- */}
        {hasStarted && !isGenerating && !showIdeaSection && !error && (
          <div className="flex justify-end animate-in fade-in duration-500">
            <button
              onClick={handleGenerateIdea}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-all"
            >
              <Lightbulb size={20} />
              <span>この解析結果を元にアイデアを生成する</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* --- アイデア生成結果 --- */}
        {showIdeaSection && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 border-t-2 border-dashed border-slate-200 pt-8 mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <Lightbulb size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">応用アイデア</h3>
              {isGeneratingIdea && (
                <span className="text-sm text-emerald-600 animate-pulse">思考中...</span>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-8 ring-1 ring-emerald-50">
              <div className="prose prose-emerald max-w-none">
                <div className='markdown break-word'>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {ideaText}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isSourceOpen && (
        <SourceSidebar
          isOpen={isSourceOpen}
          onClose={() => setIsSourceOpen(false)}
          fileName={fileName}
          sourceBlocks={sourceBlocks}
          activeParagraphId={activeParagraphId}
        />

      )}
    </div>
  );
};

// 原文表示サイドバーボタンのコンポーネント
const SourceSidebarButton = ({ setIsSourceOpen }: { setIsSourceOpen: (value: boolean | ((prev: boolean) => boolean)) => void }) => {
  return (

    <button
      onClick={() => setIsSourceOpen((prev) => !prev)}
      className="ml-auto flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
    >
      <PanelRight size={16} />
      <span>原文を表示</span>
    </button>
  )
}