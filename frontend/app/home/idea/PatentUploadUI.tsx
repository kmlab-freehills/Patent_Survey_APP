'use client';

import React, { useState, useCallback, useRef } from 'react';
import type { components } from '@/types/schema'; // 自動生成型定義
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  Send,
} from 'lucide-react';


// 特許PDFレスポンスの型
type PatentResponse = components['schemas']['PatentUploadResponse'];
type PatentContent = components['schemas']['PatentContent'];

// ファイルの型
interface FileItem {
  name: string;
  size: string;
}

// Props
interface UploadUIProps {
  setScreen: (state: "upload" | "generating" | "result") => void;
  setFileName: (fileName: string) => void;
  setPatentId: (patentId: string) => void;
  setPatentData: (data: PatentContent) => void;
}

export const PatentUploadUI  = ({ setScreen, setFileName, setPatentId, setPatentData }: UploadUIProps) => {
  const [isDragging, setIsDragging] = useState(false);
  // ファイル変数
  const [fileInfo, setFileInfo] = useState<FileItem | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);

  // input要素への参照（リセット用）
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ドラッグアンドドロップUI
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // 共通のファイル処理ロジック --> アップロード～ファイル変数に格納
  const processFile = (uploadedFile: File) => {
    // ファイルタイプの定義（MIMEタイプ or 拡張子）
    const isPdfType = uploadedFile.type === 'application/pdf';
    const isPdfExt = uploadedFile.name.toLowerCase().endsWith('.pdf');

    // ファイルタイプの判定
    if (!isPdfType && !isPdfExt) {
      alert('PDFファイルのみアップロード可能です。');
      return;
    }
    setRawFile(uploadedFile); // 実ファイルを保持
    const newFileItem: FileItem = {
      name: uploadedFile.name,
      size: `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`,
    };
    setFileInfo(newFileItem); // 常に新しいファイルで上書き
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // 先頭の1ファイルのみ取得
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  // クリック選択時のハンドラー
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    // 同じファイルを再選択できるようにinputをリセット
    e.target.value = '';
  };

  const removeFile = () => {
    setFileInfo(null);
    setRawFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 送信処理
const handleSubmit = async () => {
    if (!rawFile) return;

    const formData = new FormData();
    formData.append('file', rawFile);

    try {
      const res = await fetch('http://localhost:8000/patent/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      // ▼ 型を指定しておくことで、dataの中身が補完されるようになる
      const data: PatentResponse = await res.json();

      // Stateの更新
      setFileName(data.filename);
      setPatentId(data.patent_id);
      setPatentData(data.patent_data); // Pydanticモデル通りのキー名でアクセス
      setScreen("generating");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("アップロードに失敗しました");
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* 説明文 */}
          <div>
            <h2 className="text-lg font-medium text-slate-800 mb-1">J-PlatPat PDFアップロード</h2>
            <p className="text-slate-500 text-sm">
              特許公報PDFをアップロードしてください。生成AIが内容を解析し、特許を踏まえたアイデアを生成します。
            </p>
          </div>

          {/* アップロードエリア */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                relative rounded-lg border-2 border-dashed p-12 text-center transition-all duration-200 ease-in-out
                ${isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/50'
              }
              `}
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <div className={`
                  p-4 rounded-full 
                  ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 shadow-sm'}
                `}>
                <UploadCloud size={32} />
              </div>
              <div>
                <p className="text-base font-medium text-slate-700">
                  <span className="text-blue-600 cursor-pointer hover:underline">クリックしてファイルを選択</span>
                  {' '}またはドラッグ＆ドロップ
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  PDF形式 (最大 50MB) / 単一ファイルのみ
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf"
              onChange={handleFileInput}
            />
          </div>

          {/* ファイル表示（fileが存在する場合のみ表示） */}
          {fileInfo && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  アップロード済みファイル
                </h3>

                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <FileRow file={fileInfo} onRemove={removeFile} />
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex items-center justify-center gap-2 w-full max-w-lg px-8 py-3
                    bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                    text-white font-semibold rounded-lg shadow-sm transition-all cursor-pointer">
                  <span>解析を実行する</span>
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ファイル表示
function FileRow({ file, onRemove }: { file: FileItem, onRemove: () => void }) {
  return (
    <div className={`p-4 flex items-center gap-4 border-l-4 border-emerald-500 hover:bg-slate-50 transition-colors group`}>
      {/* ファイルアイコン */}
      <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center text-slate-500 shrink-0">
        <FileText size={20} />
      </div>

      {/* ファイル情報表示 */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <p className="font-medium text-slate-800 truncate pr-4">{file.name}</p>
          <button
            onClick={onRemove}
            className="text-slate-400 hover:text-red-500 opacity-100 transition-all"
            title="ファイルを削除"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{file.size}</span>
        </div>
      </div>

      {/* アップロード状況 */}
      <div className="flex items-center gap-2 text-sm font-medium min-w-25 text-emerald-600 justify-end">
        <CheckCircle2 />
        アップロード完了
      </div>
    </div>
  );
}