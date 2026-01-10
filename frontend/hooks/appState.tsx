// Patent_Survey_APP/frontend/hooks/appState.tsx

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, Dispatch, SetStateAction } from "react";

// 型定義
type MenuContextType = {
    // 左サイドバー
    isLeftSidebarOpen: boolean;
    setIsLeftSidebarOpen: Dispatch<SetStateAction<boolean>>;

    // 右サイドバー
    isRightSidebarOpen: boolean;
    setIsRightSidebarOpen: Dispatch<SetStateAction<boolean>>;
    rightSidebarWidth: number;
    setRightSidebarWidth: (width: number) => void;
    
    // 右サイドバーコンテンツ管理
    rightSidebarContent: ReactNode | null;
    setRightSidebarContent: Dispatch<SetStateAction<ReactNode | null>>;
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
    // 左サイドバー
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    // 右サイドバー
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [rightSidebarWidth, setRightSidebarWidthState] = useState(300);
    
    // 右サイドバーに表示するコンテンツを管理
    const [rightSidebarContent, setRightSidebarContent] = useState<ReactNode | null>(null);
    
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // ローカルストレージから復元
        const savedLeft = localStorage.getItem("left-sidebar-open");
        if (savedLeft !== null) setIsLeftSidebarOpen(savedLeft === "true");

        const savedRight = localStorage.getItem("right-sidebar-open");
        if (savedRight !== null) setIsRightSidebarOpen(savedRight === "true");

        const savedWidth = localStorage.getItem("right-sidebar-width");
        if (savedWidth) setRightSidebarWidthState(parseInt(savedWidth, 10));

        setMounted(true);
    }, []);

    // ローカルストレージ保存をラップ関数として定義
    const setRightSidebarWidth = (width: number) => {
        setRightSidebarWidthState(width);
        localStorage.setItem("right-sidebar-width", String(width));
    };

    // ローカルストレージ保存処理をuseEffectで管理
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("left-sidebar-open", String(isLeftSidebarOpen));
        }
    }, [isLeftSidebarOpen, mounted]);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("right-sidebar-open", String(isRightSidebarOpen));
        }
    }, [isRightSidebarOpen, mounted]);

    // Hydration mismatch回避
    if (!mounted) return null;

    return (
        <MenuContext.Provider
            value={{
                isLeftSidebarOpen,
                setIsLeftSidebarOpen, // useState由来のsetStateをそのまま渡す
                isRightSidebarOpen,
                setIsRightSidebarOpen,
                rightSidebarWidth,
                setRightSidebarWidth,
                rightSidebarContent,
                setRightSidebarContent,
            }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenu = () => {
    const ctx = useContext(MenuContext);
    if (!ctx) throw new Error("useMenu must be used within MenuProvider");
    return ctx;
};