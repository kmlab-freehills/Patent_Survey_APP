// Patent_Survey_APP/frontend/app/home/idea/components/SourceSidebar.tsx

import { useEffect, useRef } from "react";
import { SourceBlock } from "../util/parseSourceText";
// 画像
import { FigureList } from "./FigureList";
import { PatentImageModal } from "./PatentImageModal";

import type { components } from "@/types/schema";
type PatentImage = components["schemas"]["PatentImage"];

type SourceSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    sourceBlocks: SourceBlock[];
    activeParagraphId: string | null;
    patentImages: PatentImage[];
    selectedImage: PatentImage | null;
    setSelectedImage: (img: PatentImage | null) => void;
};

// 特許原文サイドバー（右）
export const SourceSidebar = ({
    isOpen,
    onClose,
    fileName,
    sourceBlocks,
    activeParagraphId,
    patentImages,
    selectedImage,
    setSelectedImage,
}: SourceSidebarProps) => {
    const paragraphRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (!isOpen || !activeParagraphId) return;

        const element = paragraphRefs.current[activeParagraphId];
        if (!element) return;

        element.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        element.classList.add("bg-yellow-100");
        const timer = setTimeout(() => {
            element.classList.remove("bg-yellow-100");
        }, 2500);

        return () => clearTimeout(timer);
    }, [isOpen, activeParagraphId]);

    return (
        <aside
            className={`
        fixed top-16 right-0 bottom-0 z-40
        h-[calc(100vh-4rem)] shadow-2xl
        w-105 max-w-[40vw] bg-white border-l border-gray-200
        transform transition-transform duration-250 ease-out
        flex flex-col
        ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
            {/* サイドバーヘッダー */}
            <header className="flex justify-between items-center gap-4 py-3 px-4 border-b border-gray-200">
                <div className="w-80 flex items-center gap-3">
                    <h2 className="text-lg font-bold whitespace-nowrap">
                        原文
                    </h2>
                    <span className="text-sm pt-1 truncate">{fileName}</span>
                </div>
                <button
                    onClick={onClose}
                    className="ml-auto text-xl cursor-pointer text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                    aria-label="閉じる">
                    ✕
                </button>
            </header>

            {/* 本文エリア */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
                {sourceBlocks.map((block, index) => {
                    if (block.type === "paragraph") {
                        return (
                            <div
                                key={index}
                                ref={(element) => {
                                    paragraphRefs.current[block.id] = element;
                                }}
                                data-paragraph-id={block.id}
                                className="rounded px-2 py-1 transition-colors">
                                <div className="text-xs text-slate-400 mb-1">
                                    [段落: {block.id}]
                                </div>
                                <div className="whitespace-pre-wrap text-sm">
                                    {block.text}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={index}
                            className="whitespace-pre-wrap text-sm">
                            {block.text}
                        </div>
                    );
                })}
            </div>

            <FigureList images={patentImages} onSelect={setSelectedImage} />

            <PatentImageModal
                image={selectedImage}
                onClose={() => setSelectedImage(null)}
            />
        </aside>
    );
};
