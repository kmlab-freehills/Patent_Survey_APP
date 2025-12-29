// Patent_Survey_APP/frontend/app/home/idea/util/ReferenceText.tsx

import React from "react";

const PATTERNS = {
    paragraph: /^\[段落:\s*(\d{4})\]$/,
    abstract: /^\[要約\]$/,
    claim: /^\[請求項:\s*\d+\]$/,
    figure: /^\[図:\s*\d+\]$/,
    guess: /^\[推測\]$/,
};

type ReferenceTextProps = {
    children: React.ReactNode;
    onClickParagraph?: (id: string) => void;
};

export const ReferenceText = ({
    children,
    onClickParagraph,
}: ReferenceTextProps) => {
    if (typeof children !== "string") return <>{children}</>;

    const parts = children.split(/(\[[^\]]+\])/g);

    return (
        <>
            {parts.map((part, index) => {
                // 段落（クリック可）
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

                // 装飾のみ
                if (
                    PATTERNS.abstract.test(part) ||
                    PATTERNS.claim.test(part) ||
                    PATTERNS.figure.test(part)
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
