// Patent_Survey_APP/frontend/app/workspace/MainLayout.tsx

"use client";

import Header from "@/components/layout/Header";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { LayoutProvider } from "@/hooks/useLayoutState";
import React from "react";

// Contextを利用するための内部コンポーネント
const LayoutContent = ({ children }: { children: React.ReactNode }) => {
    return (
        // 画面全体: 縦方向のFlex
        <div className="flex flex-col h-screen bg-slate-50 text-slate-800 overflow-hidden">
            {/* 1行目: ヘッダー (全幅) */}
            <Header />

            {/* 2行目: ボディエリア (左サイドバー + コンテンツ + 右サイドバー) */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* 左サイドバー */}
                <LeftSidebar />

                {/* メインコンテンツ (スクロールエリア) */}
                <main className="flex-1 overflow-auto bg-slate-50 relative min-w-0">
                    {children}
                </main>

                {/* 右サイドバー (リサイズ可能・Portalの受け皿) */}
                <RightSidebar />
            </div>
        </div>
    );
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <LayoutProvider>
            <LayoutContent>{children}</LayoutContent>
        </LayoutProvider>
    );
}
