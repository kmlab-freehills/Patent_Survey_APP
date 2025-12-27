"use client"

import { useState } from "react";
import { PatentUploadUI } from "./PatentUploadUI";
import { GeneratingScreen } from "./GeneratingScreen";
import type { components } from '@/types/schema'; // 自動生成型定義

type PatentResponse = components['schemas']['PatentUploadResponse'];
type PatentContent = components['schemas']['PatentContent'];

export default function IdeaPage() {
    type ScreenState = "upload" | "generating" | "result";
    const [screen, setScreen] = useState<ScreenState>("upload")
    // 特許PDF情報
    const [patentId, setPatentId] = useState<string>("") 
    const [fileName, setFileName] = useState<string>("")
    const [patentData, setPatentData] = useState<PatentContent | null>(null);


    return (
        <>
            {screen === "upload" && <PatentUploadUI setScreen={setScreen} setPatentId={setPatentId} setFileName={setFileName} setPatentData={setPatentData} />}
            {screen === "generating" && (
                <GeneratingScreen 
                    fileName={fileName} 
                    patentId={patentId}
                    abstract={patentData?.abstract || ""} // 型安全にアクセス可能
                />
            )}
            {screen === "result" && <div>Result</div>}
        </>

    )
}
