// Patent_Survey_APP/frontend/components/layout/Header.tsx

"use client";

import { useMenu } from "@/hooks/appState";
import { ChevronRight, Menu, PanelLeft, PanelRight, Shield, User } from "lucide-react";
import Link from "next/link";

type HeaderProps = {
    currentPageName: string;
};

export default function Header({ currentPageName }: HeaderProps) {
    // グローバルステート取得
    const { isLeftSidebarOpen, setIsLeftSidebarOpen, isRightSidebarOpen, setIsRightSidebarOpen } =
        useMenu();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-40 shrink-0">
            {/* 左側エリア：ロゴ + 左サイドバー開閉 + ページ名 */}
            <div className="flex items-center gap-4">
                {/* ロゴ (白背景用に色を調整) */}
                <Link href="/home" className="flex items-center gap-2 mr-4">
                    <Shield className="text-blue-600 shrink-0" size={28} />
                    <span className="font-bold text-slate-800 text-xl tracking-wide hidden sm:block">
                        Patent Survey App
                    </span>
                </Link>

                <div className="h-6 w-px bg-slate-300 mx-2 hidden md:block" />

                {/* 左サイドバー開閉ボタン */}
                <button
                    onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                    className="p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
                    title={isLeftSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}>
                    {/* Menuアイコン または PanelLeftアイコン お好みで */}
                    {isLeftSidebarOpen ? <PanelLeft size={20} /> : <Menu size={20} />}
                </button>

                {/* ページタイトル (パンくず風) */}
                <div className="hidden md:flex items-center text-sm text-slate-500 ml-2">
                    <ChevronRight size={14} className="mr-2" />
                    <span className="font-semibold text-slate-700">{currentPageName}</span>
                </div>
            </div>

            {/* 右側エリア：ユーザー情報 + 右サイドバー開閉 */}
            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block mr-2">
                    <div className="text-sm font-medium text-slate-700">特許 太郎</div>
                    <div className="text-xs text-slate-500">知財部 マネージャー</div>
                </div>
                <button className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 mr-2">
                    <User size={18} />
                </button>

                <div className="h-6 w-px bg-slate-300 mx-1 hidden md:block" />

                {/* 右サイドバー開閉ボタン */}
                <button
                    onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                    className={`p-2 rounded-md transition-colors ${
                        isRightSidebarOpen
                            ? "bg-blue-50 text-blue-600"
                            : "text-slate-500 hover:bg-slate-100"
                    }`}
                    title="詳細パネルを表示">
                    <PanelRight size={20} />
                </button>
            </div>
        </header>
    );
}
