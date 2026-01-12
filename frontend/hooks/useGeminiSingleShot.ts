// frontend/hooks/useGeminiSingleShot.ts

import { useCallback, useState } from "react";
import { readSSE } from "./internal/readSSE";

interface SingleShotParams {
    reportType: string;
    reportId: string;
    artifactName: string;

    promptType: string;
    systemPromptType?: string;
    context: Record<string, string>;
}

export const useGeminiSingleShot = () => {
    const [output, setOutput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (params: SingleShotParams) => {
        setIsGenerating(true);
        setOutput("");
        setError(null);

        try {
            const response = await fetch("/generate/single-shot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    report_type: params.reportType,
                    report_id: params.reportId,
                    artifact_name: params.artifactName,
                    prompt_type: params.promptType,
                    system_prompt_type: params.systemPromptType,
                    context: params.context,
                }),
            });

            await readSSE(response, (event) => {
                if (event.type === "content_delta") {
                    setOutput((prev) => prev + event.data.chunk);
                }
                if (event.type === "error") {
                    throw new Error(event.data.message);
                }
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return { output, isGenerating, error, generate };
};
