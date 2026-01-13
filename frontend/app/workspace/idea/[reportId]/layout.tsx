// Patent_Survey_APP/frontend/app/workspace/idea/[reportId]/layout.tsx

"use client";

import { useLayoutState } from "@/hooks/useLayoutState";
import { useReport } from "@/hooks/useReport";
import type { components } from "@/types/schema";
import React, { memo, useEffect, useMemo, useState } from "react";
import { IdeaLeftSidebar } from "./IdeaLeftSidebar";
import { IdeaReportProvider, useIdeaReport } from "./IdeaReportContext";
import { IdeaReportContent } from "./ideaReportType";
import { SourceSidebar } from "./source-sidebar/SourceSidebar";
import { formatPatentToString, parseSourceText } from "./source-sidebar/sourcePatentTextProcess";

// 特許の型
type PatentContent = components["schemas"]["PatentContent"];
type PatentImage = components["schemas"]["PatentImage"];

// 環境変数
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================
// メモ化されたラッパーコンポーネント（パフォーマンス最適化）
// ============================================================

const MemoizedSourceSidebar = memo(
    ({
        fileName,
        sourceBlocks,
        activeParagraphId,
        patentImages,
    }: {
        fileName: string;
        sourceBlocks: any[];
        activeParagraphId: string | null;
        patentImages: PatentImage[];
    }) => {
        const [selectedImage, setSelectedImage] = useState<PatentImage | null>(null);

        return (
            <SourceSidebar
                onClose={() => {}}
                fileName={fileName}
                sourceBlocks={sourceBlocks}
                activeParagraphId={activeParagraphId}
                patentImages={patentImages}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
            />
        );
    },
    // カスタム比較関数（本質的なプロパティのみ比較）
    (prevProps, nextProps) => {
        return (
            prevProps.fileName === nextProps.fileName &&
            prevProps.sourceBlocks === nextProps.sourceBlocks &&
            prevProps.activeParagraphId === nextProps.activeParagraphId &&
            prevProps.patentImages === nextProps.patentImages
        );
    }
);

MemoizedSourceSidebar.displayName = "MemoizedSourceSidebar";

// ============================================================
// 内部コンポーネント（Context を使用するため）
// ============================================================

function IdeaReportLayoutContent({ children }: { children: React.ReactNode }) {
    const { setLeftSidebarContent, setRightSidebarContent } = useLayoutState();
    const { currentReport, loadReportFromApi, isLoading } = useReport<IdeaReportContent>();
    const { activeParagraphId } = useIdeaReport();

    const [patentData, setPatentData] = useState<PatentContent | null>(null);
    const [images, setImages] = useState<PatentImage[]>([]);

    // 1. 左サイドバー設定
    useEffect(() => {
        setLeftSidebarContent(<IdeaLeftSidebar />);
    }, [setLeftSidebarContent]);

    // 2. 特許データの取得
    useEffect(() => {
        const fetchPatentData = async () => {
            if (!currentReport) return;
            const { report_type, report_id } = currentReport.metadata;

            try {
                const [dataRes, imagesRes] = await Promise.all([
                    fetch(
                        `${API_BASE}/static/reports/${report_type}/${report_id}/patent/data.json`
                    ),
                    fetch(
                        `${API_BASE}/static/reports/${report_type}/${report_id}/patent/images.json`
                    ),
                ]);

                if (dataRes.ok) {
                    const data: PatentContent = await dataRes.json();
                    setPatentData(data);
                }

                if (imagesRes.ok) {
                    const imgList: PatentImage[] = await imagesRes.json();
                    setImages(imgList);
                }
            } catch (err) {
                console.error("特許データの取得エラー:", err);
            }
        };

        fetchPatentData();
    }, [currentReport]);

    // 3. テキスト処理（メモ化）

    const fullText = useMemo(() => {
        if (!patentData) return "";
        return formatPatentToString(patentData);
    }, [patentData]);

    const sourceBlocks = useMemo(() => {
        if (!fullText) return [];
        return parseSourceText(fullText);
    }, [fullText]);

    const fileName = useMemo(
        () => currentReport?.content.patent_info?.filename || "特許文書",
        [currentReport]
    );

    // 4. 右サイドバーに原文参照を設定（最小限の依存配列）
    useEffect(() => {
        if (!patentData) {
            setRightSidebarContent(null);
            return;
        }

        setRightSidebarContent(
            <MemoizedSourceSidebar
                fileName={fileName}
                sourceBlocks={sourceBlocks}
                activeParagraphId={activeParagraphId}
                patentImages={images}
            />
        );
    }, [
        patentData, // 特許データが変わったとき
        fileName, // ファイル名が変わったとき
        sourceBlocks, // 段落構造が変わったとき
        activeParagraphId, // ハイライト対象が変わったとき
        images, // 画像リストが変わったとき
        setRightSidebarContent,
    ]);

    if (isLoading && !currentReport) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 text-slate-500">
                レポートを読み込んでいます...
            </div>
        );
    }

    return <>{children}</>;
}

// ============================================================
// メインの Layout コンポーネント
// ============================================================

export default function IdeaReportLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ reportId: string }>;
}) {
    const { loadReportFromApi } = useReport();
    const { reportId } = React.use(params);

    // レポートのロード
    useEffect(() => {
        if (!reportId) return;
        loadReportFromApi(reportId, "idea");
    }, [reportId, loadReportFromApi]);

    return (
        <IdeaReportProvider>
            <IdeaReportLayoutContent>{children}</IdeaReportLayoutContent>
        </IdeaReportProvider>
    );
}
