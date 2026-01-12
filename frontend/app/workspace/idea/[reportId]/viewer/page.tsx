// Patent_Survey_APP/frontend/app/workspace/idea/[reportId]/viewer/page.tsx

"use client";

import { CopyButton } from "@/components/ui/CopyButton";
import { ImageModal } from "@/components/ui/ImageModal";
import MarkdownViewer from "@/components/ui/MarkdownViewer";
import { useReport } from "@/hooks/useReport";
import { components } from "@/types/schema";
import {
    AlertCircle,
    FileText,
    Image as ImageIcon,
    Loader2,
    PanelRightClose,
    PanelRightOpen,
    Bot,
    ArrowRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IdeaReportContent } from "../ideaReportType"; // 型定義をインポート

// ------------------------------------------------------------
// 型定義
// ------------------------------------------------------------
type PatentContent = components["schemas"]["PatentContent"];
type PatentImage = components["schemas"]["PatentImage"];

// 見出しラベルの辞書 --> 表示順序の制御には使用せず、キーの日本語化にのみ使用。受け取った順で表示するため。
const SECTION_LABELS: Record<string, string> = {
    abstract: "要約",
    claims: "特許請求の範囲",
    tech_field: "技術分野",
    background: "背景技術",
    problem_to_solve: "解決しようとする課題",
    means_to_solve: "解決手段",
    effect: "発明の効果",
    drawings_desc: "図面の簡単な説明",
    embodiments: "実施形態",
    symbols_desc: "符号の説明",
    industrial_applicability: "産業上の利用可能性",
};

// 環境変数
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PatentViewerPage() {
    // Contextから現在のレポート情報を取得（型安全にアクセス）
    const { currentReport } = useReport<IdeaReportContent>();

    // Local State
    const [patentData, setPatentData] = useState<PatentContent | null>(null);
    const [images, setImages] = useState<PatentImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showImages, setShowImages] = useState(true);
    const [selectedImage, setSelectedImage] = useState<{
        url: string;
        label: string;
    } | null>(null);

    // ------------------------------------------------------------
    // データ取得
    // ------------------------------------------------------------
    useEffect(() => {
        const fetchData = async () => {
            if (!currentReport) return;

            setIsLoading(true);
            setError(null);

            const { report_type, report_id } = currentReport.metadata;

            try {
                // 並列でデータと画像リストを取得
                // ※ バックエンドの保存パス仕様に基づく: storage/reports/{type}/{id}/patent/data.json
                const [dataRes, imagesRes] = await Promise.all([
                    fetch(
                        `${API_BASE}/static/reports/${report_type}/${report_id}/patent/data.json`
                    ),
                    fetch(
                        `${API_BASE}/static/reports/${report_type}/${report_id}/patent/images.json`
                    ),
                ]);

                if (!dataRes.ok) throw new Error("テキストデータの取得に失敗しました");
                const data: PatentContent = await dataRes.json();
                setPatentData(data);

                // 画像は存在しない場合もあるため、404なら空配列とする
                if (imagesRes.ok) {
                    const imgList: PatentImage[] = await imagesRes.json();
                    setImages(imgList);
                } else {
                    setImages([]);
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setError(
                    "データの読み込みに失敗しました。まだ解析が完了していない可能性があります。"
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentReport]);

    // 全文結合ロジック（コピー用）
    const fullText = useMemo(() => {
        if (!patentData) return "";
        return Object.entries(patentData)
            .map(([key, content]) => {
                if (key === "others" && typeof content === "object") {
                    return Object.entries(content)
                        .map(([k, v]) => `【${k}】\n${v}`)
                        .join("\n\n");
                }
                if (typeof content === "string" && content) {
                    const label = SECTION_LABELS[key] || key;
                    return `【${label}】\n${content}`;
                }
                return "";
            })
            .filter(Boolean)
            .join("\n\n");
    }, [patentData]);

    // ------------------------------------------------------------
    // ローディング / エラー表示
    // ------------------------------------------------------------
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-white text-slate-500 gap-2">
                <Loader2 className="animate-spin" />
                <span>解析データを読み込んでいます...</span>
            </div>
        );
    }

    if (error || !patentData) {
        return (
            <div className="flex h-full items-center justify-center bg-white p-8">
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center gap-3 max-w-lg">
                    <AlertCircle size={24} />
                    <div>
                        <h3 className="font-bold">エラーが発生しました</h3>
                        <p className="text-sm mt-1">{error || "データが見つかりません"}</p>
                    </div>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------
    // メインレンダリング
    // ------------------------------------------------------------
    const hasImages = images.length > 0;

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto bg-white">
            {/* 画像拡大モーダル */}
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage ? `${API_BASE}${selectedImage.url}` : null}
                altText={selectedImage?.label}
            />

            {/* ヘッダーエリア */}
            <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        解析結果 {currentReport?.content.patent_info?.filename || "特許文書"}
                    </h2>
                    <div className="flex items-center mt-1">
                        <span className="text-xs text-slate-400 font-mono">
                            ID:
                            {currentReport?.content.patent_info?.patent_id ||
                                currentReport?.metadata.report_id}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <CopyButton text={fullText} label="全文をコピー" />

                    {hasImages && (
                        <button
                            onClick={() => setShowImages(!showImages)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border
                            bg-white text-slate-500 border-slate-200
                            hover:bg-slate-50 hover:text-slate-700 transition-all"
                            title={showImages ? "画像を非表示" : "画像を表示"}>
                            {showImages ? (
                                <PanelRightClose size={16} />
                            ) : (
                                <PanelRightOpen size={16} />
                            )}
                            <span className="hidden sm:inline">
                                {showImages ? "画像OFF" : "画像ON"}
                            </span>
                        </button>
                    )}
                    {/* 次のステップへの遷移ボタン */}
          <Link
            href={`/workspace/idea/${currentReport?.metadata.report_id}/analysis`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm ml-2"
          >
            <Bot size={18} />
            <span>AI解析に進む</span>
            <ArrowRight size={16} />
          </Link>
                </div>
            </div>

            {/* コンテンツエリア */}
            <div className="flex flex-1 overflow-hidden">
                {/* 左カラム: テキスト本文 (Markdown) */}
                <div className="flex-1 overflow-y-auto p-8 pb-20">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* JSONデータの並び順を信頼し、そのままマップする */}
                        {Object.entries(patentData).map(([key, content]) => {
                            // 'others' キーはネストされたオブジェクトとして処理
                            if (
                                key === "others" &&
                                typeof content === "object" &&
                                content !== null
                            ) {
                                return Object.entries(content as Record<string, string>).map(
                                    ([otherKey, otherContent]) => (
                                        <SectionBlock
                                            key={otherKey}
                                            title={otherKey}
                                            content={otherContent}
                                            isCustomSection
                                        />
                                    )
                                );
                            }

                            // 通常の文字列セクション
                            if (typeof content === "string" && content) {
                                const label = SECTION_LABELS[key] || key; // 辞書にあれば日本語、なければキーそのまま
                                return (
                                    <SectionBlock
                                        key={key}
                                        title={label}
                                        content={content}
                                        isCustomSection={false}
                                    />
                                );
                            }

                            return null;
                        })}
                    </div>
                </div>

                {/* 右カラム: 画像一覧 */}
                {hasImages && showImages && (
                    <div className="w-80 lg:w-96 shrink-0 flex flex-col border-l border-slate-100 bg-slate-50/50">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                <ImageIcon size={16} />
                                抽出画像 ({images.length})
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {images.map((img) => (
                                <div
                                    key={img.id}
                                    className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                    <div
                                        className="aspect-video bg-slate-100 rounded-md overflow-hidden mb-2 flex items-center justify-center relative cursor-zoom-in group"
                                        onClick={() =>
                                            setSelectedImage({ url: img.url, label: img.label })
                                        }>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`${API_BASE}${img.url}`}
                                            alt={img.label}
                                            className="max-w-full max-h-40 object-contain transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">
                                            {img.label}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ------------------------------------------------------------
// サブコンポーネント: セクション表示ブロック
// ------------------------------------------------------------
const SectionBlock = ({
    title,
    content,
    isCustomSection,
}: {
    title: string;
    content: string;
    isCustomSection: boolean;
}) => {
    return (
        <section className="group">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <h3
                    className={`text-lg font-bold text-slate-800 border-l-4 pl-3 ${
                        isCustomSection ? "border-slate-400" : "border-blue-600"
                    }`}>
                    {title}
                </h3>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={content} className="text-slate-400 hover:text-slate-600" />
                </div>
            </div>
            <div className="px-1">
                <MarkdownViewer
                    content={content}
                    className="text-slate-700 leading-relaxed text-sm patent-content"
                />
            </div>
        </section>
    );
};
