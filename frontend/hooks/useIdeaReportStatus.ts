// frontend/hooks/useIdeaReportStatus.ts

import { IdeaReportContent } from "@/app/workspace/idea/[reportId]/ideaReportType";
import { useMemo } from "react";
import { useReport } from "./useReport";

export const useIdeaReportStatus = () => {
    const { currentReport } = useReport<IdeaReportContent>();

    const status = useMemo(() => {
        if (!currentReport) return null;

        const content = currentReport.content;

        // 各ステップの完了状況を実データから判定
        const hasPatent = !!content.patent_info?.has_patent;
        const hasAnalysis = !!content.generated?.artifacts?.patent_summary?.output;
        const hasIdeas = !!content.generated?.artifacts?.idea_generation?.output;
        const hasConversation = !!content.generated?.conversation;

        return {
            hasPatent,
            hasAnalysis,
            hasIdeas,
            hasConversation,
        };
    }, [currentReport]);

    return status;
};
