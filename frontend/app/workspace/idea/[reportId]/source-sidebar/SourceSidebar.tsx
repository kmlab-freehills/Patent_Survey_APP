"use client";

import type { components } from "@/types/schema";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FigureList } from "./FigureList";
import { SourceBlock } from "./sourcePatentTextProcess";
import { ImageModal } from "@/components/ui/ImageModal";

type PatentImage = components["schemas"]["PatentImage"];

// 環境変数
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type SourceSidebarProps = {
    onClose: () => void;
    fileName: string;
    sourceBlocks: SourceBlock[];
    activeParagraphId: string | null;
    patentImages: PatentImage[];
    selectedImage: PatentImage | null;
    setSelectedImage: (img: PatentImage | null) => void;
};

export const SourceSidebar = ({
    onClose,
    fileName,
    sourceBlocks,
    activeParagraphId,
    patentImages,
    selectedImage,
    setSelectedImage,
}: SourceSidebarProps) => {
    const paragraphRefs = useRef<Record<string, HTMLDivElement | null>>({});
    // 現在ハイライト中の段落IDを管理
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    // タイマーIDを保持（確実なクリーンアップのため）
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 前回ハイライトした要素への参照を保持
    const lastHighlightedElementRef = useRef<HTMLDivElement | null>(null);

    // ハイライト処理 --> 状態を確実にリセットして、連打しても安定して動作するように
    useEffect(() => {
        // 1. 前回のタイマーを確実にクリア
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        // 2. 前回のハイライトを確実に削除
        if (lastHighlightedElementRef.current) {
            lastHighlightedElementRef.current.classList.remove("bg-yellow-100");
            lastHighlightedElementRef.current = null;
        }

        // 3. 新しいハイライト対象がない場合は終了
        if (!activeParagraphId) {
            setHighlightedId(null);
            return;
        }

        // 4. 対象要素を取得
        const element = paragraphRefs.current[activeParagraphId];
        if (!element) {
            console.warn(`段落 ${activeParagraphId} が見つかりません`);
            return;
        }

        // 5. スクロール処理（ハイライト前に実行）
        element.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        // 6. 新しいハイライトを適用
        // スクロールの完了を待ってからハイライト（視覚的な安定性向上）
        requestAnimationFrame(() => {
            element.classList.add("bg-yellow-100");
            lastHighlightedElementRef.current = element;
            setHighlightedId(activeParagraphId);

            // 7. 2秒後にハイライトを解除
            timerRef.current = setTimeout(() => {
                element.classList.remove("bg-yellow-100");
                setHighlightedId(null);
                lastHighlightedElementRef.current = null;
                timerRef.current = null;
            }, 2000);
        });

        // 8. クリーンアップ関数
        return () => {
            // コンポーネントのアンマウントやactiveParagraphIdの変更時に確実にクリア
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            if (lastHighlightedElementRef.current) {
                lastHighlightedElementRef.current.classList.remove("bg-yellow-100");
                lastHighlightedElementRef.current = null;
            }
        };
    }, [activeParagraphId]);

    return (
        <div className="h-full flex flex-col bg-white">
            {/* サイドバーヘッダー */}
            <header className="flex justify-between items-center gap-2 py-3 px-4 border-b border-gray-200 bg-gray-50/50 shrink-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-gray-700">原文参照</h2>
                    <p className="text-xs text-gray-500 truncate" title={fileName}>
                        {fileName}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    aria-label="閉じる">
                    <X size={18} />
                </button>
            </header>

            {/* 本文エリア */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {sourceBlocks.map((block, index) => {
                    if (block.type === "paragraph") {
                        // 現在ハイライト中かどうかを判定
                        const isHighlighted = highlightedId === block.id;

                        return (
                            <div
                                key={index}
                                ref={(element) => {
                                    paragraphRefs.current[block.id] = element;
                                }}
                                data-paragraph-id={block.id}
                                className={`rounded px-2 py-1 transition-colors duration-300 hover:bg-gray-50 ${
                                    isHighlighted ? "bg-yellow-100" : ""
                                }`}>
                                <div className="text-xs text-blue-500/70 font-mono mb-1 select-none">
                                    [{block.id}]
                                </div>
                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                                    {block.text}
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div
                            key={index}
                            className="whitespace-pre-wrap text-sm font-bold text-gray-700 mt-6 mb-2 px-2">
                            {block.text}
                        </div>
                    );
                })}
            </div>

            {/* 図面リスト */}
            <div className="shrink-0 bg-gray-50">
                <FigureList images={patentImages} onSelect={setSelectedImage} />
            </div>

                            {/* 画像拡大モーダル */}
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage ? `${API_BASE}${selectedImage.url}` : null}
                altText={selectedImage?.label}
            />
        </div>
    );
};
