// Patent_Survey_APP/frontend/app/MainLayout.tsx

"use client";

import Header from "@/components/layout/Header";
import LeftSidebar, { navigation } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { MenuProvider } from "@/hooks/appState";
import { usePathname } from "next/navigation";
import React from "react";

// Contextを利用するための内部コンポーネント
const LayoutContent = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const currentPageName = navigation.find((n) => n.href === pathname)?.name || "Home";

    return (
        // 画面全体: 縦方向のFlex
        <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
            {/* 1行目: ヘッダー (全幅) */}
            <Header currentPageName={currentPageName} />

            {/* 2行目: ボディエリア (左サイドバー + コンテンツ + 右サイドバー) */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* 左サイドバー */}
                <LeftSidebar />

                {/* メインコンテンツ (スクロールエリア) */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 min-w-0 bg-slate-50 relative">
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
        <MenuProvider>
            <LayoutContent>{children}</LayoutContent>
        </MenuProvider>
    );
}
