// Patent_Survey_APP/frontend/app/workspace/idea/[reportId]/layout.tsx

"use client";

import { useLayoutState } from "@/hooks/useLayoutState";
import { useReport } from "@/hooks/useReport";
import React, { useEffect,  } from "react";
import { IdeaSidebar } from "./IdeaSidebar"

export default function IdeaReportLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ reportId: string }>;
}) {
    const { setLeftSidebarContent } = useLayoutState();
    const { currentReport, loadReportFromApi, isLoading } = useReport();

    // React.use() で Promise をアンラップして reportId を取得
    const { reportId } = React.use(params);

    // 1. リロード対策: URLのIDと現在のStateが一致しない場合、ロードを実行
    useEffect(() => {
        if (!reportId) return;

        if (!currentReport || currentReport.metadata.report_id !== reportId) {
            console.log(`[IdeaLayout] Loading report: ${reportId}`);
            loadReportFromApi(reportId, "idea");
        }
    }, [reportId, currentReport, loadReportFromApi]);

    // 2. 左サイドバーをこの機能専用のものに差し替え
    useEffect(() => {
        setLeftSidebarContent(<IdeaSidebar />);

        // アンマウント時にリセットする場合はここで行う
        // return () => setLeftSidebarContent(null);
    }, [setLeftSidebarContent]);

    if (isLoading && !currentReport) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 text-slate-500">
                レポートを読み込んでいます...
            </div>
        );
    }

    return <>{children}</>;
}
