// Patent_Survey_APP/frontend/components/layout/RightSidebar.tsx

"use client";

import { useLayoutState } from "@/hooks/useLayoutState";
import { PanelRight } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// コンテンツラッパー（メモ化による再レンダリング防止）
// ============================================================
const SidebarContent = memo(({ content }: { content: React.ReactNode }) => {
    return <>{content}</>;
}, (prevProps, nextProps) => {
    // contentが変わらない限り再レンダリングしない
    return prevProps.content === nextProps.content;
});

SidebarContent.displayName = "SidebarContent";

// ============================================================
// 空コンテンツのプレースホルダー（メモ化）
// ============================================================
const EmptyPlaceholder = memo(() => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <PanelRight size={32} className="text-slate-400" />
        </div>
        <h3 className="text-sm font-medium text-slate-700 mb-2">詳細パネル</h3>
        <p className="text-xs text-slate-400 max-w-xs">
            特定のページでは、ここに関連情報が表示されます
        </p>
    </div>
));

EmptyPlaceholder.displayName = "EmptyPlaceholder";

// ============================================================
// メインコンポーネント
// ============================================================
export const RightSidebar = () => {
    const {
        isRightSidebarOpen,
        rightSidebarWidth,
        setRightSidebarWidth,
        rightSidebarContent,
    } = useLayoutState();

    const [isResizing, setIsResizing] = useState(false);
    
    // 🆕 リサイズ中は幅の更新を間引くためのバッファ
    const resizeBufferRef = useRef<number>(rightSidebarWidth);
    
    // 🆕 throttle用のタイマー
    const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

    // リサイズ開始
    const startResizing = useCallback(() => {
        setIsResizing(true);
        resizeBufferRef.current = rightSidebarWidth;
    }, [rightSidebarWidth]);

    // リサイズ終了
    const stopResizing = useCallback(() => {
        setIsResizing(false);
        
        // リサイズ終了時に最終的な幅を確定
        if (throttleTimerRef.current) {
            clearTimeout(throttleTimerRef.current);
            throttleTimerRef.current = null;
        }
        
        // バッファに溜まった最新の幅を反映
        if (resizeBufferRef.current !== rightSidebarWidth) {
            setRightSidebarWidth(resizeBufferRef.current);
        }
    }, [rightSidebarWidth, setRightSidebarWidth]);

    // 🆕 リサイズ処理（throttle版）
    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (!isResizing) return;
            // 画面右端からの距離を計算
            const newWidth = window.innerWidth - mouseMoveEvent.clientX;
            
            // 最小幅:300px, 最大幅: 画面の50%程度
            if (newWidth < 300 || newWidth > window.innerWidth * 0.6) return;

            // バッファに幅を保存（即座には反映しない）
            resizeBufferRef.current = newWidth;

            // 🔧 16ms（約60fps）ごとに幅を更新（throttle）
            if (!throttleTimerRef.current) {
                throttleTimerRef.current = setTimeout(() => {
                    setRightSidebarWidth(resizeBufferRef.current);
                    throttleTimerRef.current = null;
                }, 16);
            }
        },
        [isResizing, setRightSidebarWidth]
    );

    // 操作中の処理
    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    // クリーンアップ
    useEffect(() => {
        return () => {
            if (throttleTimerRef.current) {
                clearTimeout(throttleTimerRef.current);
            }
        };
    }, []);

    return (
        <aside
            className={`bg-white border-l border-gray-200 relative flex flex-col shrink-0 ${
                isResizing ? "select-none" : "transition-[width] duration-300 ease-in-out"
            }`}
            style={{
                width: isRightSidebarOpen ? `${rightSidebarWidth}px` : "0px",
                height: "100%",
                overflow: "hidden",
                visibility: isRightSidebarOpen ? "visible" : "hidden",
                // リサイズ中はGPU加速を有効化（スムーズなアニメーション）
                willChange: isResizing ? "width" : "auto",
            }}>
            
            {/* リサイズハンドル */}
            <div
                className="absolute top-0 bottom-0 left-0 w-1 cursor-col-resize hover:bg-blue-400/50 transition-colors z-50 flex items-center justify-center group"
                onMouseDown={startResizing}>
                <div className="h-8 w-1 bg-gray-300 rounded hidden md:block group-hover:bg-blue-400" />
            </div>

            {/* コンテンツ表示領域 - グローバルステートから注入される - メモ化により再レンダリングを最小化 */}
            <div 
                className="w-full h-full overflow-hidden relative flex flex-col"
                // リサイズ中はポインターイベントを無効化（パフォーマンス向上）
                style={{ pointerEvents: isResizing ? "none" : "auto" }}
            >
                {rightSidebarContent ? (
                    <SidebarContent content={rightSidebarContent} />
                ) : (
                    <EmptyPlaceholder />
                )}
            </div>
        </aside>
    );
};