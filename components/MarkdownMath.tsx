import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function MarkdownMath(props: {
  text: string;
  className?: string;
  inline?: boolean;
}) {
  const text = props.text ?? '';

  return (
    <div className={props.className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className={props.className}>{children}</p>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
