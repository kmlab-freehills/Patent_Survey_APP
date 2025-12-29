// Patent_Survey_APP/frontend/app/home/idea/page.tsx

"use client";

import type { components } from "@/types/schema"; // 自動生成型定義
import { useState } from "react";
import { GeneratingScreen } from "./GeneratingScreen";
import { PatentUploadUI } from "./PatentUploadUI";

type PatentContent = components["schemas"]["PatentContent"];
type PatentImage = components["schemas"]["PatentImage"];

// 画面状態の型定義
type ScreenState = "upload" | "generating" | "result";

export default function IdeaPage() {
    const [screen, setScreen] = useState<ScreenState>("upload");

    // 特許PDF情報 & 解析データ
    const [patentId, setPatentId] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [patentData, setPatentData] = useState<PatentContent | null>(null);
    const [patentImages, setPatentImages] = useState<PatentImage[]>([]);

    return (
        <>
            {/* アップロード画面 */}
            {screen === "upload" && (
                <PatentUploadUI
                    setScreen={setScreen}
                    setPatentId={setPatentId}
                    setFileName={setFileName}
                    setPatentData={setPatentData}
                    setPatentImages={setPatentImages}
                />
            )}

            {/* 生成・解析画面 (データが存在する場合のみ表示) */}
            {screen === "generating" && patentData && (
                <GeneratingScreen
                    fileName={fileName}
                    patentId={patentId}
                    patentData={patentData}
                    patentImages={patentImages}
                />
            )}

            {/* 結果画面 (将来拡張用) */}
            {screen === "result" && <div>Result</div>}
        </>
    );
}
