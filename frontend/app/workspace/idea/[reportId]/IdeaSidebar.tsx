"use client";

import { useReport } from "@/hooks/useReport";
import {
    Bot,
    CheckCircle2,
    FileText,
    LayoutDashboard,
    Lightbulb,
    MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const IdeaSidebar = () => {
    const { currentReport } = useReport();
    const pathname = usePathname();

    // URLからベースパスを抽出 (/workspace/idea/[id])
    const basePath = currentReport ? `/workspace/idea/${currentReport.metadata.report_id}` : "#";

    // レポートの中身をチェックして進捗判定（仮の判定ロジック）
    // ※ 型定義がまだanyなので安全にアクセス
    // const hasPatent = !!currentReport?.content?.source?.patent_text;
    // const hasAnalysis = !!currentReport?.content?.results?.analysis;
    // const hasIdeas = !!currentReport?.content?.results?.ideas;
    const hasPatent = false
    const hasAnalysis = false
    const hasIdeas = false

    const navItems = [
        {
            id: "dashboard",
            label: "ダッシュボード",
            href: basePath, // トップ
            icon: LayoutDashboard,
            completed: true, // 常にアクセス可
            disabled: false,
        },
        {
            id: "upload",
            label: "特許登録",
            href: `${basePath}/upload`,
            icon: FileText,
            completed: hasPatent,
            disabled: false,
        },
        {
            id: "analysis",
            label: "AI解析",
            href: `${basePath}/analysis`,
            icon: Bot,
            completed: hasAnalysis,
            disabled: !hasPatent, // 特許がないと進めない
        },
        {
            id: "ideas",
            label: "アイデア生成",
            href: `${basePath}/ideas`,
            icon: Lightbulb,
            completed: hasIdeas,
            disabled: !hasAnalysis, // 解析していないと進めない
        },
        {
            id: "chat",
            label: "対話モード",
            href: `${basePath}/chat`,
            icon: MessageSquare,
            completed: false,
            disabled: !hasIdeas, // アイデアがないと進めない
        },
    ];

    return (
        <div className="h-full flex flex-col bg-slate-900 text-slate-300">
            <div className="p-4 border-b border-slate-800">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Idea Generation
                </h2>
                <p
                    className="text-sm font-medium text-white truncate"
                    title={currentReport?.metadata.title}>
                    {currentReport?.metadata.title || "ロード中..."}
                </p>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;

                        if (item.disabled) {
                            return (
                                <li
                                    key={item.id}
                                    className="px-4 py-3 flex items-center gap-3 text-slate-600 cursor-not-allowed">
                                    <item.icon size={20} />
                                    <span className="text-sm">{item.label}</span>
                                </li>
                            );
                        }

                        return (
                            <li key={item.id}>
                                <Link
                                    href={item.href}
                                    className={`
                    flex items-center justify-between px-4 py-3 transition-colors
                    ${
                        isActive
                            ? "bg-blue-600 text-white border-r-4 border-blue-300"
                            : "hover:bg-slate-800 hover:text-white"
                    }
                  `}>
                                    <div className="flex items-center gap-3">
                                        <item.icon
                                            size={20}
                                            className={isActive ? "text-white" : "text-slate-400"}
                                        />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </div>
                                    {item.completed && item.id !== "dashboard" && (
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};
