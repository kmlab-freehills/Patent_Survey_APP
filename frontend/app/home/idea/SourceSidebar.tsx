// SourceSidebar.tsx

import { useEffect, useRef } from "react";
import { parseSourceText } from "./util/parseSourceText";
import { SourceBlock } from "./util/parseSourceText";

type SourceSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  sourceBlocks: SourceBlock[];
  activeParagraphId: string | null;
};

// 特許原文サイドバー（右）
export const SourceSidebar = ({
    isOpen,
    onClose,
    fileName,
    sourceBlocks,
    activeParagraphId,
  }: SourceSidebarProps) => {
    const paragraphRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
      if (!isOpen || !activeParagraphId) return;

      const el = paragraphRefs.current[activeParagraphId];
      if (!el) return;

      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      el.classList.add("bg-yellow-100");
      const timer = setTimeout(() => {
        el.classList.remove("bg-yellow-100");
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
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        {/* サイドバーヘッダー */}
        <header className="flex justify-between items-center gap-4 py-3 px-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">原文</h2>
          <span className="text-sm pt-0.5">{fileName}</span>
          <button
            onClick={onClose}
            className="ml-auto cursor-pointer text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="閉じる"
          >
            ✕
          </button>
        </header>

        {/* 本文エリア */}
<div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sourceBlocks.map((block, index) => {
          if (block.type === "paragraph") {
            return (
              <div
                key={index}
                ref={(el) => {
                  paragraphRefs.current[block.id] = el;
                }}
                data-paragraph-id={block.id}
                className="rounded px-2 py-1 transition-colors"
              >
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
            <div key={index} className="whitespace-pre-wrap text-sm">
              {block.text}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
