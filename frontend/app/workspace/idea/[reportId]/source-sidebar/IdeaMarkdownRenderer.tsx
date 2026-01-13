import "@/styles/markdown_style.css";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 原文参照サイドバーとリンクさせる

// ============================================================
// Markdownレンダリングを統括するメインコンポーネント
// ============================================================

type MarkdownRendererProps = {
    content: string;
    onClickParagraph?: (id: string) => void;
};

export const MarkdownRenderer = ({ content, onClickParagraph }: MarkdownRendererProps) => {
    return (
        // markdownクラスは別ファイルで定義
        <div className="markdown break-word">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p({ children }) {
                        return (
                            <p>
                                {React.Children.map(children, (child) => (
                                    <ReferenceText>{child}</ReferenceText>
                                ))}
                            </p>
                        );
                    },
                    li({ children }) {
                        return (
                            <li>
                                {React.Children.map(children, (child) => (
                                    <ReferenceText onClickParagraph={onClickParagraph}>
                                        {child}
                                    </ReferenceText>
                                ))}
                            </li>
                        );
                    },
                    blockquote({ children }) {
                        return (
                            <blockquote>
                                {React.Children.map(children, (child) => (
                                    <ReferenceText>{child}</ReferenceText>
                                ))}
                            </blockquote>
                        );
                    },
                }}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

// ============================================================
// 特定の文字列を原文サイドバーとリンクさせるためのサブコンポーネント
// → 上記出力テキストのレンダリング時に利用
// ============================================================

// 正規表現パターン
const PATTERNS = {
    paragraph: /^\[段落:\s*(\d{4})\]$/,
    abstract: /^\[要約\]$/,
    claim: /^\[請求項:\s*\d+\]$/,
    figure: /^\[図:\s*\d+\]$/,
    table: /^\[表:\s*\d+\]$/,
    guess: /^\[推測\]$/,
};
// LLMに対し、以下の形式で出典を明示するようプロンプトで指示している。
// 特許テキスト抽出時も【xxxx】 --> [段落: xxxx]の形式に変換している。
// [段落: xxxx], [要約], [請求項: x], [図: x], [表: x], [推測]

type ReferenceTextProps = {
    children: React.ReactNode;
    onClickParagraph?: (id: string) => void;
};

const ReferenceText = ({ children, onClickParagraph }: ReferenceTextProps) => {
    if (typeof children !== "string") return <>{children}</>;

    const parts = children.split(/(\[[^\]]+\])/g);

    return (
        <>
            {parts.map((part, index) => {
                // ------------------------------------------------------------
                // クリック可能なパターンに対する処理（段落）
                // ------------------------------------------------------------
                const paragraphMatch = part.match(PATTERNS.paragraph);
                if (paragraphMatch) {
                    const id = paragraphMatch[1];
                    return (
                        <button
                            key={index}
                            onClick={() => onClickParagraph?.(id)}
                            className="ref ref-paragraph">
                            {part}
                        </button>
                    );
                }

                // ------------------------------------------------------------
                // 装飾のみのパターンに対する処理
                // ------------------------------------------------------------
                if (
                    PATTERNS.abstract.test(part) ||
                    PATTERNS.claim.test(part) ||
                    PATTERNS.figure.test(part) ||
                    PATTERNS.table.test(part) ||
                    PATTERNS.guess.test(part)
                ) {
                    return (
                        <span key={index} className="ref ref-meta">
                            {part}
                        </span>
                    );
                }

                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </>
    );
};
