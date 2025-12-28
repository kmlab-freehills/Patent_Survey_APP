// ============================================================
// テキストのパース
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
      const beforeText = sourceText
        .slice(lastIndex, matchStart)
        .trim();

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
      .slice(
        matchEnd,
        nextMatch ? nextMatch.index! : sourceText.length
      )
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

// ============================================================
// 画像のパース
// ============================================================

// 正規表現
const FIGURE_REF_REGEX = /\[図:\s*(\d+)\]/g;
// 1 / 12 / 001 などに対応可能

type SourceInline =
  | { type: "text"; text: string }
  | { type: "figure-ref"; figureNo: string };

// 画像のインライン分解
export function parseFigureRefs(text: string): SourceInline[] {
const parts: SourceInline[] = [];
let lastIndex = 0;

for (const match of text.matchAll(FIGURE_REF_REGEX)) {
  const start = match.index!;
  const end = start + match[0].length;

  if (start > lastIndex) {
    parts.push({
      type: "text",
      text: text.slice(lastIndex, start),
    });
  }

  parts.push({
    type: "figure-ref",
    figureNo: match[1],
  });

  lastIndex = end;
}

if (lastIndex < text.length) {
  parts.push({
    type: "text",
    text: text.slice(lastIndex),
  });
}

return parts;
}
