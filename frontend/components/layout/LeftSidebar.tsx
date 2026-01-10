// Patent_Survey_APP/frontend/components/layout/LeftSidebar.tsx

"use client";

import { useMenu } from "@/hooks/appState";
import { Building2, House, Lightbulb, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ナビゲーション定義
export const navigation = [
    { id: "home", name: "ホーム", icon: <House size={20} />, href: "/home" },
    {
        id: "search",
        name: "特許検索",
        icon: <Search size={20} />,
        href: "/home/search",
    },
    {
        id: "idea",
        name: "アイデア生成",
        icon: <Lightbulb size={20} />,
        href: "/home/idea",
    },
    {
        id: "watchlist",
        name: "知財マッチング",
        icon: <Building2 size={20} />,
        href: "/watchlist",
    },
];

export default function LeftSidebar() {
    const { isLeftSidebarOpen, setIsLeftSidebarOpen } = useMenu();
    const pathname = usePathname();

    // サイドバーのスタイル定義
    // ヘッダーの下に配置されるため、h-full で親要素(flex-1)の高さを埋めます
    const sidebarClasses = `
    z-30 h-full
    bg-slate-900 text-slate-300 shadow-xl
    flex flex-col transition-all duration-300 ease-in-out
    shrink-0
    ${isLeftSidebarOpen ? "w-64" : "w-20"}
    ${
        /* モバイル対応: 画面が小さい時は絶対配置にするなどの調整が必要ですが、今回はデスクトップレイアウト優先で記述 */ ""
    }
  `;

    return (
        <>
            {/* モバイル端末時のサイドバーオーバーレイ (必要に応じて有効化) */}
            {isLeftSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-400/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsLeftSidebarOpen(false)}
                />
            )}

            <aside className={sidebarClasses}>
                {/* ナビゲーションリスト */}
                <nav className="flex-1 py-6 space-y-2 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors duration-200 group
                  ${
                      isActive
                          ? "bg-blue-600 text-white border-r-4 border-blue-300"
                          : "hover:bg-slate-800 hover:text-white"
                  }
                  ${!isLeftSidebarOpen && "justify-center"}`} // 閉じたときは中央揃え
                                title={!isLeftSidebarOpen ? item.name : undefined}>
                                <div
                                    className={`${
                                        isActive
                                            ? "text-white"
                                            : "text-slate-400 group-hover:text-white"
                                    } shrink-0`}>
                                    {item.icon}
                                </div>
                                {/* 開いている時だけテキスト表示 */}
                                {isLeftSidebarOpen && (
                                    <span className="font-medium text-sm whitespace-nowrap">
                                        {item.name}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* 設定エリア */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        className={`flex items-center gap-3 w-full px-2 py-2 text-slate-400 hover:text-white transition-colors ${
                            !isLeftSidebarOpen && "justify-center"
                        }`}>
                        <Settings size={20} className="shrink-0" />
                        {isLeftSidebarOpen && (
                            <span className="text-sm whitespace-nowrap">設定</span>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
