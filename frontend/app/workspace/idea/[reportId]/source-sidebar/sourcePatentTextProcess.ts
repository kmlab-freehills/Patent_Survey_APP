import type { components } from "@/types/schema";
type PatentContent = components["schemas"]["PatentContent"];

// ============================================================
// PatentContentオブジェクトを1つの文字列に変換する関数
// → GenerateScreen内で全文取得時に使用する
// → 別の関数で段落ごとに分割し、原文参照サイドバーに表示
// ============================================================

// 見出し辞書（受け取ったまま表示するためのマップ辞書）
const SECTION_HEADERS: Partial<Record<keyof PatentContent, string>> = {
    abstract: "要約",
    claims: "特許請求の範囲",
    tech_field: "技術分野",
    background: "背景技術",
    problem_to_solve: "発明が解決しようとする課題",
    means_to_solve: "課題を解決するための手段",
    effect: "発明の効果",
    drawings_desc: "図面の簡単な説明",
    embodiments: "発明を実施するための形態",
    industrial_applicability: "産業上の利用可能性",
    symbols_desc: "符号の説明",
};


export const formatPatentToString = (data: PatentContent): string => {
    const parts: string[] = [];

    Object.entries(data).forEach(([key, content]) => {
        if (key === "others") {
            if (content && typeof content === "object") {
                Object.entries(content).forEach(([otherKey, otherContent]) => {
                    if (otherContent && otherContent.trim() !== "") {
                        parts.push(`【${otherKey}】\n${otherContent}`);
                    }
                });
            }
            return;
        }

        if (typeof content === "string" && content.trim() !== "") {
            const header =
                SECTION_HEADERS[key as keyof PatentContent] ?? key;
            parts.push(`【${header}】\n${content}`);
        }
    });

    return parts.join("\n\n");
};


// ============================================================
// テキストのパース処理
// → 原文サイドバー内で段落ごとに分割して表示するために利用（全文取得後に段落ごとに分割する）
// ============================================================

// パース結果の型定義
export type SourceBlock =
    | { type: "paragraph"; id: string; text: string } // 段落番号付き（アンカー対象）
    | { type: "text"; text: string }; // 通常テキスト（見出しなど）

export function parseSourceText(sourceText: string): SourceBlock[] {
    const blocks: SourceBlock[] = [];

    const regex = /\[段落:\s*(\d{4})\]/g;
    const matches = [...sourceText.matchAll(regex)];

    // 段落番号が1つもない場合
    if (matches.length === 0) {
        return [{ type: "text", text: sourceText.trim() }];
    }

    let lastIndex = 0;

    matches.forEach((match, index) => {
        const paragraphId = match[1];
        const matchStart = match.index!;
        const matchEnd = matchStart + match[0].length;

        // 前のテキスト
        if (matchStart > lastIndex) {
            const beforeText = sourceText.slice(lastIndex, matchStart).trim();

            if (beforeText) {
                blocks.push({
                    type: "text",
                    text: beforeText,
                });
            }
        }

        // 段落本文
        const nextMatch = matches[index + 1];
        const paragraphText = sourceText
            .slice(matchEnd, nextMatch ? nextMatch.index! : sourceText.length)
            .trim();

        blocks.push({
            type: "paragraph",
            id: paragraphId,
            text: paragraphText,
        });

        lastIndex = nextMatch ? nextMatch.index! : sourceText.length;
    });

    return blocks;
}
