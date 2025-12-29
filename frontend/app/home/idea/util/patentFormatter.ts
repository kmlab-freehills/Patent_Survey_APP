// Patent_Survey_APP/frontend/app/home/idea/util/patentFormatter.ts

import type { components } from "@/types/schema";

type PatentContent = components["schemas"]["PatentContent"];

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

/**
 * PatentContentオブジェクトを整形された1つの文字列に変換する関数
 */
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
