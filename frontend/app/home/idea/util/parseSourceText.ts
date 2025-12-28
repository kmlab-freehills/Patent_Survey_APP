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