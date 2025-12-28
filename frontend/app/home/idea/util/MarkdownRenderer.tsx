import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ReferenceText } from "./ReferenceText";

type MarkdownRendererProps = {
  content: string;
  onClickParagraph?: (id: string) => void;
};

export const MarkdownRenderer = ({ content, onClickParagraph }: MarkdownRendererProps) => {
  return (
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
                <ReferenceText onClickParagraph={onClickParagraph}>{child}</ReferenceText>
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
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
