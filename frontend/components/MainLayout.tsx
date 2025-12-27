"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, Shield, House, Settings,
  Menu, User, ChevronRight, Lightbulb, Building2, X
} from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navigation = [
    { id: 'home', name: 'ホーム', icon: <House size={20} />, href: '/home' },
    { id: 'search', name: '特許検索', icon: <Search size={20} />, href: '/home/search' },
    { id: 'idea', name: 'アイデア生成', icon: <Lightbulb size={20} />, href: '/home/idea' },
    { id: 'watchlist', name: '知財マッチング', icon: <Building2 size={20} />, href: '/watchlist' },
  ];

  // 現在のページ名を取得
  const currentPageName = navigation.find(n => n.href === pathname)?.name || 'Home';

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">

      {/* モバイル端末時のサイドバーオーバーレイ */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-400/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 h-full
          bg-slate-900 text-slate-300 shadow-xl
          flex flex-col transition-all duration-300 ease-in-out
          md:relative
          ${isSidebarOpen
            ? 'translate-x-0 w-64'
            : '-translate-x-full md:translate-x-0 md:w-20'
          }
        `}
      >
        {/* ロゴ */}
        <div onClick={toggleSidebar} className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className={`flex items-center gap-1 font-bold text-white text-xl ${!isSidebarOpen && 'md:justify-center md:w-full'}`}>
            <Shield className="text-blue-400 shrink-0" size={24} />
            <span className={`tracking-wide whitespace-nowrap ${!isSidebarOpen && 'md:hidden'}`}>
              Patent Survey App
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-slate-400 hover:text-white md:hidden"
          >
            <X size={24} />
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors duration-200 group
                  ${isActive
                    ? 'bg-blue-600 text-white border-r-4 border-blue-300'
                    : 'hover:bg-slate-800 hover:text-white'
                  }
                  ${!isSidebarOpen && 'md:justify-center'}
                `}
              >
                <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} shrink-0`}>
                  {item.icon}
                </div>
                <span className={`font-medium text-sm whitespace-nowrap ${!isSidebarOpen && 'md:hidden'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* 設定 */}
        <div className="p-4 border-t border-slate-800">
          <button className={`flex items-center gap-3 w-full px-2 py-2 text-slate-400 hover:text-white transition-colors ${!isSidebarOpen && 'md:justify-center'}`}>
            <Settings size={20} className="shrink-0" />
            <span className={`text-sm whitespace-nowrap ${!isSidebarOpen && 'md:hidden'}`}>設定</span>
          </button>
        </div>
      </aside>

      {/* コンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">

        {/* ヘッダー */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none"
            >
              <Menu size={20} />
            </button>

            <div className="hidden md:flex items-center text-sm text-slate-500">
              <ChevronRight size={14} className="mr-2" />
              <span className='font-semibold text-slate-700'>{currentPageName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pl-1">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-700">特許 太郎</div>
              <div className="text-xs text-slate-500">知財部 マネージャー</div>
            </div>
            <button className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
              <User size={18} />
            </button>
          </div>

        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}