// Patent_Survey_APP/frontend/hooks/useLayoutState.tsx

"use client";

import React, {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";

// 型定義
type LayoutContextType = {
    // --- 左サイドバー ---
    isLeftSidebarOpen: boolean; // 左サイドバーの開閉状態
    setIsLeftSidebarOpen: Dispatch<SetStateAction<boolean>>; // 左サイドバーの開閉状態を管理
    leftSidebarContent: ReactNode | null; // 左サイドバーの中身
    setLeftSidebarContent: Dispatch<SetStateAction<ReactNode | null>>; // 左サイドバーのコンテンツを管理
    // --- 右サイドバー ---
    isRightSidebarOpen: boolean; // 右サイドバーの開閉状態
    setIsRightSidebarOpen: Dispatch<SetStateAction<boolean>>; // 右サイドバーの開閉状態を管理
    rightSidebarWidth: number; // 右サイドバーの幅
    setRightSidebarWidth: (width: number) => void; // 右サイドバーの幅を管理
    rightSidebarContent: ReactNode | null; // 右サイドバーの中身
    setRightSidebarContent: Dispatch<SetStateAction<ReactNode | null>>; // 右サイドバーのコンテンツを管理
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined); // コンテキュータイプ

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
    // --- 左サイドバー ---
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true); // 左サイドバーの開閉状態
    const [leftSidebarContent, setLeftSidebarContent] = useState<ReactNode | null>(null); // 左サイドバーのコンテンツ
    // --- 右サイドバー ---
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false); // 右サイドバーの開閉状態
    const [rightSidebarWidth, setRightSidebarWidthState] = useState(300); // 右サイドバーの幅
    const [rightSidebarContent, setRightSidebarContent] = useState<ReactNode | null>(null); // 右サイドバーのコンテンツ
    const [mounted, setMounted] = useState(false); // マウント状態

    // --- 初期化・永続化ロード（ローカルストレージから復元） ---
    useEffect(() => {
        // 左サイドバー
        const savedLeft = localStorage.getItem("layout-left-open");
        if (savedLeft !== null) setIsLeftSidebarOpen(savedLeft === "true");

        // 右サイドバー
        const savedRight = localStorage.getItem("layout-right-open");
        if (savedRight !== null) setIsRightSidebarOpen(savedRight === "true");

        // 右サイドバーの幅
        const savedWidth = localStorage.getItem("layout-right-width");
        if (savedWidth) setRightSidebarWidthState(parseInt(savedWidth, 10));

        // マウント状態を更新
        setMounted(true);
    }, []);

    // 右サイドバーの幅を管理（ラップ関数）
    const setRightSidebarWidth = (width: number) => {
        setRightSidebarWidthState(width);
        // ローカルストレージに保存
        localStorage.setItem("layout-right-width", String(width));
    };

    // 左サイドバーの開閉状態を保存
    useEffect(() => {
        if (mounted) localStorage.setItem("layout-left-open", String(isLeftSidebarOpen));
    }, [isLeftSidebarOpen, mounted]);

    // 右サイドバーの開閉状態を保存
    useEffect(() => {
        if (mounted) localStorage.setItem("layout-right-open", String(isRightSidebarOpen));
    }, [isRightSidebarOpen, mounted]);

    // Hydration mismatch回避
    if (!mounted) return null;

    // コンテキュータイプを提供
    return (
        <LayoutContext.Provider
            value={{
                isLeftSidebarOpen,
                setIsLeftSidebarOpen,
                leftSidebarContent,
                setLeftSidebarContent,
                isRightSidebarOpen,
                setIsRightSidebarOpen,
                rightSidebarWidth,
                setRightSidebarWidth,
                rightSidebarContent,
                setRightSidebarContent,
            }}>
            {children}
        </LayoutContext.Provider>
    );
};

// コンテキューを使用するためのカスタムフック
export const useLayoutState = () => {
    const context = useContext(LayoutContext);
    if (!context) throw new Error("useLayoutState must be used within LayoutProvider");
    return context;
};
