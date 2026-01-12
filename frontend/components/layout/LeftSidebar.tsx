// Patent_Survey_APP/frontend/components/layout/LeftSidebar.tsx

"use client";

import { useLayoutState } from "@/hooks/useLayoutState";
import { House, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// デフォルトのナビゲーション（トップページ等で使用）
export const defaultNavigation = [
    { id: "home", name: "ホーム", icon: <House size={20} />, href: "/" }, // hrefをルートに変更
    // ※ 将来的にダッシュボードから遷移するため、ここには「アプリ全体のメニュー」を置く
    // 例: 設定、アカウント、ヘルプなど
];

export default function LeftSidebar() {
    const { isLeftSidebarOpen, setIsLeftSidebarOpen, leftSidebarContent } = useLayoutState();
    const pathname = usePathname();

    // 幅は固定 (開いている時は w-64, 閉じている時は w-16 or hidden)
    // コンテンツ出し分けに対応するため、構造をシンプルに
    const sidebarClasses = `
    z-30 h-full
    bg-slate-900 text-slate-300 shadow-xl
    flex flex-col duration-300 ease-in-out
    shrink-0 overflow-hidden
    ${isLeftSidebarOpen ? "w-64" : "w-0 overflow-hidden md:w-16"} 
  `;
    // ※ w-0 md:w-16 とすることで、モバイルでは完全非表示、PCではアイコンのみ表示のような挙動も可能
    // ここではシンプルに既存の挙動（w-20）に合わせつつ、閉じた時の幅を少しスリムに(w-16)調整

    return (
        <>
            {/* モバイル用オーバーレイ */}
            {isLeftSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-[1px] transition-opacity"
                    onClick={() => setIsLeftSidebarOpen(false)}
                />
            )}

            <aside className={sidebarClasses}>
                {/* コンテンツエリア：Contextから注入されたものがあればそれを表示 */}
                {leftSidebarContent ? (
                    <div
                        className={`flex-1 flex flex-col min-w-0 ${
                            !isLeftSidebarOpen && "items-center"
                        }`}>
                        {/* 注意: leftSidebarContentを渡す側は、
                サイドバーが閉じている状態(アイコンのみ)の表示も考慮するか、
                あるいは閉じている時は表示しない設計にする必要がある。
                今回はシンプルに「開いているときはそのまま表示」する。
             */}
                        <div className={!isLeftSidebarOpen ? "hidden" : "block h-full w-64"}>
                            {leftSidebarContent}
                        </div>
                        {/* 閉じている時の代替表示が必要ならここに記述 */}
                    </div>
                ) : (
                    /* デフォルトナビゲーション（注入がない場合） */
                    <>
                        <nav className="flex-1 py-6 space-y-2 overflow-y-auto w-64">
                            {defaultNavigation.map((item) => {
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
                      ${!isLeftSidebarOpen && "justify-center px-0"}
                    `}
                                        title={!isLeftSidebarOpen ? item.name : undefined}>
                                        <div
                                            className={`${
                                                isActive
                                                    ? "text-white"
                                                    : "text-slate-400 group-hover:text-white"
                                            } shrink-0`}>
                                            {item.icon}
                                        </div>
                                        {isLeftSidebarOpen && (
                                            <span className="font-medium text-sm whitespace-nowrap">
                                                {item.name}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* デフォルトの下部エリア */}
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
                    </>
                )}
            </aside>
        </>
    );
}
