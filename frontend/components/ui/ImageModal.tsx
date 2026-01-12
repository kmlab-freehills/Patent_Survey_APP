"use client";

import { RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    altText?: string;
}

// 画像拡大汎用モーダル
export const ImageModal = ({ isOpen, onClose, imageUrl, altText }: ImageModalProps) => {
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);

    // モーダルが開くたびに状態をリセット
    useEffect(() => {
        if (isOpen) {
            setRotation(0);
            setScale(1);
        }
    }, [isOpen]);

    // ESCキーで閉じる
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !imageUrl) return null;

    const handleRotateLeft = () => setRotation((prev) => prev - 90);
    const handleRotateRight = () => setRotation((prev) => prev + 90);
    const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3)); // 最大3倍
    const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5)); // 最小0.5倍

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            {/* コントロールバー */}
            <div
                className="absolute top-4 right-4 z-50 flex items-center gap-2 p-2 bg-black/40 rounded-full backdrop-blur-md border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex gap-1 pr-2 border-r border-white/20">
                    <button
                        onClick={handleRotateLeft}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="左に90度回転"
                    >
                        <RotateCcw size={20} />
                    </button>
                    <button
                        onClick={handleRotateRight}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="右に90度回転"
                    >
                        <RotateCw size={20} />
                    </button>
                </div>

                <div className="flex gap-1 px-2 border-r border-white/20">
                    <button
                        onClick={handleZoomOut}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="縮小"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <button
                        onClick={handleZoomIn}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="拡大"
                    >
                        <ZoomIn size={20} />
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="ml-1 p-2 bg-white/10 hover:bg-red-500/80 text-white rounded-full transition-colors"
                    title="閉じる (Esc)"
                >
                    <X size={20} />
                </button>
            </div>

            {/* 画像表示エリア */}
            <div
                className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden"
                onClick={onClose} // 画像外クリックでも閉じる
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt={altText || "Preview"}
                    onClick={(e) => e.stopPropagation()} // 画像クリックでは閉じない
                    style={{
                        transform: `rotate(${rotation}deg) scale(${scale})`,
                        transition: "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                    }}
                    className="shadow-2xl select-none"
                    draggable={false}
                />
            </div>
            
            {/* 情報表示（左下） */}
            <div className="absolute bottom-6 left-6 text-white/70 text-sm font-mono bg-black/40 px-3 py-1 rounded-md backdrop-blur-md">
                {altText} • {Math.round(scale * 100)}% • {rotation}°
            </div>
        </div>
    );
};