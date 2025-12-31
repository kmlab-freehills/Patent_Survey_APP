// Patent_Survey_APP/frontend/app/home/idea/components/sidebar/sourcePatentTextProcess.ts

import type { components } from "@/types/schema";
type PatentContent = components["schemas"]["PatentContent"];

// ============================================================
// PatentContentオブジェクトを整形された1つの文字列に変換する関数
// → GenerateScreen内で全文取得時に使用する
// → 別の関数で段落ごとに分割し、原文参照サイドバーに表示
// ============================================================

// 表示順序と見出しの定義
const SECTION_ORDER: {
    key: keyof Omit<PatentContent, "others">;
    header: string;
}[] = [
    { key: "abstract", header: "要約" },
    { key: "claims", header: "特許請求の範囲" },
    { key: "tech_field", header: "技術分野" },
    { key: "background", header: "背景技術" },
    { key: "problem_to_solve", header: "発明が解決しようとする課題" },
    { key: "means_to_solve", header: "課題を解決するための手段" },
    { key: "effect", header: "発明の効果" },
    { key: "drawings_desc", header: "図面の簡単な説明" },
    { key: "embodiments", header: "発明を実施するための形態" },
    { key: "industrial_applicability", header: "産業上の利用可能性" },
    { key: "symbols_desc", header: "符号の説明" },
];

export const formatPatentToString = (data: PatentContent): string => {
    const parts: string[] = [];

    // 1. 定義済みセクションの処理
    SECTION_ORDER.forEach((section) => {
        const content = data[section.key];
        // 中身が存在する場合のみ追加
        if (content && content.trim() !== "") {
            parts.push(`【${section.header}】\n${content}`);
        }
    });

    // 2. 'others'（その他のセクション）の処理
    if (data.others) {
        Object.entries(data.others).forEach(([key, content]) => {
            if (content && content.trim() !== "") {
                // key自体が見出し名になっていることが多いのでそのまま使う
                parts.push(`【${key}】\n${content}`);
            }
        });
    }

    // セクション間を改行2つで結合して返す
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
