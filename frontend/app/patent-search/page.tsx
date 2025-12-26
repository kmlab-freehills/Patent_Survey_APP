"use client";

import { PatentCard } from "./PatentCard";



// レイアウトのイメージ
export default function ReportPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 overflow-y-auto hidden lg:block">
        <div className="p-6">
          <h1 className="font-bold text-xl text-slate-800 mb-6">Patent Scout</h1>
          <nav className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">Input Idea</p>
            <a href="#idea-summary" className="block px-3 py-2 text-sm text-slate-600 rounded-md hover:bg-slate-50">概要・背景</a>
            <a href="#elements" className="block px-3 py-2 text-sm text-slate-600 rounded-md hover:bg-slate-50">構成要素分解</a>
            
            <div className="my-4 border-t border-slate-100"></div>
            
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">Search Results</p>
            <a href="#result-1" className="flex items-center justify-between px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
              1. アイデア全体 <span className="text-xs bg-white px-1.5 rounded border border-blue-100">7件</span>
            </a>
            <a href="#result-2" className="block px-3 py-2 text-sm text-slate-600 rounded-md hover:bg-slate-50">2. 構成要素技術</a>
            <a href="#result-3" className="block px-3 py-2 text-sm text-slate-600 rounded-md hover:bg-slate-50">3. 熱管理・耐久性</a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto p-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">検索レポート結果</h2>
            <p className="text-slate-500">生成日時: 2024.05.21 14:00</p>
          </div>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition">
            PDFダウンロード
          </button>
        </div>

        {/* User Idea Section */}
        <section id="idea-summary" className="mb-12">
           {/* ここにアイデア概要を表示 */}
        </section>

        {/* Report Sections Loop */}
        <section id="result-1" className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              1. アイデア全体: 関連特許検索結果
            </h2>
          </div>

          {/* Summary Box */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h3 className="font-bold text-lg mb-4">本検索結果の要約</h3>
            {/* Markdown rendering here */}
            <div className="prose prose-sm max-w-none text-slate-600">
              <p>...要約テキスト...</p>
            </div>
          </div>

          {/* Patents List */}
          <div className="space-y-6">
             {/* PatentCard コンポーネントをループ表示 */}
             <PatentCard 
               patentNumber="WO2017221992A1"
               title="電波吸収シート"
               summary="ミリ波帯域以上の高周波電波を効率的に吸収し..."
               relevance="◎"
               techDistance="近い"
               practicalValue="高"
               risk="中"
               reason="本アイデアの主要ターゲットであるミリ波帯域..."
             />
             {/* ... 他のカード */}
          </div>
        </section>

      </main>
    </div>
  );
}