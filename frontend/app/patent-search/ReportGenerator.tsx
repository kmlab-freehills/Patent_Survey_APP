'use client';


import { z } from 'zod';
import { experimental_useObject as useObject } from '@ai-sdk/react';

// フロントエンド側でもスキーマ（型）を定義しておくと便利です
const reportSchema = z.object({
  summary: z.string(),
  patents: z.array(z.object({
    patent_number: z.string(),
    title: z.string(),
    relevance: z.string(),
    summary: z.string(),
  })),
});

export default function ReportGenerator() {
  const { object, submit, isLoading } = useObject({
    api: 'http://localhost:8000/api/generate', // FastAPIのURL
    schema: reportSchema,
  });

  return (
    <div>
      <button 
        onClick={() => submit({ prompt: "5G対応のノイズ抑制シート..." })}
        disabled={isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {isLoading ? '生成中...' : 'レポート作成'}
      </button>

      {/* ストリームに合わせてリアルタイム表示 */}
      <div className="mt-4">
        <h2 className="font-bold text-xl">概要</h2>
        <div className="whitespace-pre-wrap text-gray-700">
          {object?.summary}
        </div>

        <h2 className="font-bold text-xl mt-6">特許リスト</h2>
        <div className="space-y-4">
          {object?.patents?.map((patent, index) => (
            <div key={index} className="border p-4 rounded shadow">
              <div className="flex justify-between">
                <h3 className="font-bold text-lg">{patent?.title}</h3>
                <span className="font-bold text-blue-600">{patent?.relevance}</span>
              </div>
              <p className="text-sm text-gray-500">{patent?.patent_number}</p>
              <p className="mt-2">{patent?.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}