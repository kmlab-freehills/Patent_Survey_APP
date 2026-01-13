"use client";

import { useIdeaReportStatus } from "@/hooks/useIdeaReportStatus";
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

export const IdeaLeftSidebar = () => {
    const { currentReport } = useReport();
    const status = useIdeaReportStatus();
    const pathname = usePathname();

    const basePath = currentReport ? `/workspace/idea/${currentReport.metadata.report_id}` : "#";

    // フックから取得
    if (!status) {
        return <div>Loading...</div>;
    }

    const navItems = [
        {
            id: "dashboard",
            label: "ダッシュボード",
            href: basePath,
            icon: LayoutDashboard,
            completed: true,
            disabled: false,
        },
        {
            id: "patent",
            label: "特許登録/閲覧", // 統合
            href: status.hasPatent
                ? `${basePath}/viewer` // 登録済み → 閲覧
                : `${basePath}/upload`, // 未登録 → アップロード
            icon: FileText,
            completed: status.hasPatent,
            disabled: false,
        },
        {
            id: "analysis",
            label: "AI解析",
            href: `${basePath}/analysis`,
            icon: Bot,
            completed: status?.hasAnalysis,
            disabled: !status?.hasPatent, // 特許PDFが登録されていないと進めない
        },
        {
            id: "ideas",
            label: "アイデア生成",
            href: `${basePath}/ideas`,
            icon: Lightbulb,
            completed: status?.hasIdeas,
            disabled: !status?.hasAnalysis, // 特許解析結果がないと進めない
        },
        {
            id: "chat",
            label: "対話モード",
            href: `${basePath}/chat`,
            icon: MessageSquare,
            completed: false, // チャットは「完了」という概念がない
            disabled: !status?.hasIdeas, // アイデア生成結果がないと進めない
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
