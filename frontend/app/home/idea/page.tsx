// page.tsx
"use client"

import { useState } from "react";
import { PatentUploadUI } from "./PatentUploadUI";
import { GeneratingScreen } from "./GeneratingScreen";
import type { components } from '@/types/schema'; // 自動生成型定義

type PatentContent = components['schemas']['PatentContent'];

// 画面状態の型定義
type ScreenState = "upload" | "generating" | "result";

export default function IdeaPage() {
  const [screen, setScreen] = useState<ScreenState>("upload");
  
  // 特許PDF情報 & 解析データ
  const [patentId, setPatentId] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [patentData, setPatentData] = useState<PatentContent | null>(null);

  return (
    <>
      {/* アップロード画面 */}
      {screen === "upload" && (
        <PatentUploadUI 
          setScreen={setScreen} 
          setPatentId={setPatentId} 
          setFileName={setFileName} 
          setPatentData={setPatentData} 
        />
      )}

      {/* 生成・解析画面 (データが存在する場合のみ表示) */}
      {screen === "generating" && patentData && (
        <GeneratingScreen 
          fileName={fileName} 
          patentId={patentId}
          patentData={patentData}
        />
      )}

      {/* 結果画面 (将来拡張用) */}
      {screen === "result" && <div>Result</div>}
    </>
  );
}