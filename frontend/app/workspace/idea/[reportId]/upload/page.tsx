// frontend/app/workspace/idea/[reportId]/upload/page.tsx

"use client";

import { useReport } from "@/hooks/useReport";
import { CheckCircle2, FileText, Trash2, UploadCloud, ArrowRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export default function IdeaUploadPage() {
    const { currentReport } = useReport();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI状態管理
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // ------------------------------------------------------------
    // ドラッグ＆ドロップなどのイベントハンドラ（UI挙動のみ）
    // ------------------------------------------------------------
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
        // 同じファイルを再選択可能にするためリセット
        e.target.value = "";
    };

    const validateAndSetFile = (file: File) => {
        // PDF判定
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            alert("PDFファイルのみアップロード可能です。");
            return;
        }
        setSelectedFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    // ------------------------------------------------------------
    // 送信ハンドラ（後で実装）
    // ------------------------------------------------------------
    const handleUpload = async () => {
        if (!selectedFile || !currentReport) return;

        console.log("TODO: Upload file to backend");
        console.log("Report ID:", currentReport.metadata.report_id);
        console.log("File:", selectedFile.name);
        
        // ここにバックエンドへのPOST処理を実装予定
    };

    // ------------------------------------------------------------
    // レンダリング
    // ------------------------------------------------------------
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* ヘッダー */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">特許PDFの登録</h1>
                <p className="text-slate-600">
                    解析対象となる特許公報（PDF）をアップロードしてください。<br />
                    J-PlatPatからダウンロードした形式に対応しています。
                </p>
            </div>

            {/* アップロードエリア */}
            {!selectedFile ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative group cursor-pointer
                        border-2 border-dashed rounded-xl p-12
                        flex flex-col items-center justify-center gap-4
                        transition-all duration-200 ease-in-out
                        ${
                            isDragging
                                ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                                : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50"
                        }
                    `}
                >
                    <div className={`p-4 rounded-full transition-colors ${
                        isDragging ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-md"
                    }`}>
                        <UploadCloud size={32} />
                    </div>
                    
                    <div className="text-center space-y-1">
                        <p className="text-lg font-medium text-slate-700">
                            クリックしてPDFを選択
                        </p>
                        <p className="text-sm text-slate-400">
                            またはドラッグ＆ドロップ (最大50MB)
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileInput}
                    />
                </div>
            ) : (
                /* ファイル選択後のプレビュー表示 */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-6 flex items-center gap-5">
                        {/* アイコン */}
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                            <FileText size={24} />
                        </div>

                        {/* ファイル情報 */}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate text-lg">
                                {selectedFile.name}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>

                        {/* 削除ボタン */}
                        <button
                            onClick={handleRemoveFile}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="ファイルを削除"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    {/* ステータスバーっぽい装飾 */}
                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                            <CheckCircle2 size={16} />
                            <span>アップロード準備完了</span>
                        </div>
                    </div>
                </div>
            )}

            {/* アクションボタンエリア */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile}
                    className={`
                        flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white transition-all shadow-md
                        ${
                            selectedFile
                                ? "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"
                                : "bg-slate-300 cursor-not-allowed"
                        }
                    `}
                >
                    <span>解析を開始する</span>
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}