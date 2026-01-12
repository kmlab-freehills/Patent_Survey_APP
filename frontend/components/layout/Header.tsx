// Patent_Survey_APP/frontend/components/layout/Header.tsx

"use client";

import { useLayoutState } from "@/hooks/useLayoutState";
import { useReport } from "@/hooks/useReport"; // 追加
import { Download, Menu, PanelLeft, PanelRight, Save, Shield, User } from "lucide-react";
import Link from "next/link";

export default function Header() {
    const { isLeftSidebarOpen, setIsLeftSidebarOpen, isRightSidebarOpen, setIsRightSidebarOpen } =
        useLayoutState();

    // Workspace内であれば必ず取得可能
    const { currentReport, saveReportToBackend, downloadReportJson } = useReport();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-40 shrink-0">
            {/* --- 左エリア --- */}
            <div className="flex items-center gap-3 overflow-hidden flex-1">
                {/* 左サイドバー開閉 */}
                <button
                    onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                    className="p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                    title="サイドバーの切り替え">
                    {isLeftSidebarOpen ? <PanelLeft size={20} /> : <Menu size={20} />}
                </button>

                {/* ロゴ */}
                <Link href="/" className="flex items-center gap-2 shrink-0 group">
                    <Shield
                        className="text-blue-600 shrink-0 group-hover:text-blue-700 transition-colors"
                        size={24}
                    />
                    <span className="font-bold text-slate-800 text-lg tracking-tight hidden md:block whitespace-nowrap">
                        Patent Survey App
                    </span>
                </Link>

                {/* ファイル名表示 (レポートが開かれている場合) */}
                {currentReport && (
                    <>
                        <div className="h-6 w-px bg-slate-300 mx-2 hidden sm:block shrink-0" />
                        <div className="min-w-0 flex items-center gap-2">
                            <span
                                className="font-medium text-slate-700 truncate max-w-md"
                                title={currentReport.metadata.title}>
                                {currentReport.metadata.title}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap hidden lg:inline-block">
                                {currentReport.metadata.report_type}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* --- 右エリア --- */}
            <div className="flex items-center gap-3 shrink-0 ml-4">
                {/* アクションボタン群 (レポートが開かれている場合) */}
                {currentReport && (
                    <div className="flex items-center gap-2 mr-4 border-r border-slate-200 pr-4">
                        {/* 上書き保存 */}
                        <button
                            onClick={() => saveReportToBackend(currentReport)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="サーバーに上書き保存">
                            <Save size={18} />
                            <span className="hidden sm:inline">保存</span>
                        </button>

                        {/* JSONダウンロード */}
                        <button
                            onClick={downloadReportJson}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                            title="JSONとしてダウンロード">
                            <Download size={18} />
                        </button>
                    </div>
                )}

                {/* ユーザー情報 */}
                <div className="hidden sm:flex items-center gap-3 mr-2">
                    <div className="text-right">
                        <div className="text-sm font-medium text-slate-700">特許 太郎</div>
                        <div className="text-[10px] text-slate-500">知財部</div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                        <User size={16} />
                    </div>
                </div>

                <div className="h-5 w-px bg-slate-300 hidden sm:block" />

                {/* 右サイドバー開閉 */}
                <button
                    onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                    className={`p-2 rounded-md transition-colors ${
                        isRightSidebarOpen
                            ? "bg-blue-50 text-blue-600"
                            : "text-slate-500 hover:bg-slate-100"
                    }`}
                    title="詳細パネルの表示">
                    <PanelRight size={20} />
                </button>
            </div>
        </header>
    );
}
