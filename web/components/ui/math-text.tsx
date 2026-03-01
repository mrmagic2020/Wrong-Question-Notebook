'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
}

/** Check whether a string contains `$...$` inline math delimiters. */
export function containsMath(text: string): boolean {
  return /\$[^$]+\$/.test(text);
}

/**
 * Renders a plain-text string that may contain `$...$` inline LaTeX.
 * Math segments are rendered via KaTeX; plain segments are regular text.
 * Invalid LaTeX falls back to a red `<code>` element.
 */
const MathText = React.memo(function MathText({
  text,
  className,
}: MathTextProps) {
  const rendered = useMemo(() => {
    if (!containsMath(text)) return null;

    const parts: React.ReactNode[] = [];
    const regex = /\$([^$]+)\$/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Plain text before this match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const latex = match[1];
      try {
        const html = katex.renderToString(`\\displaystyle ${latex}`, {
          macros: {
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
          },
          strict: false,
          throwOnError: true,
          displayMode: false,
        });
        parts.push(
          <span
            key={match.index}
            className="math-text-inline"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        parts.push(
          <code key={match.index} className="text-red-500 text-xs">
            {match[0]}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Trailing plain text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  }, [text]);

  if (!rendered) {
    return <span className={className}>{text}</span>;
  }

  return <span className={`math-text ${className ?? ''}`}>{rendered}</span>;
});

export default MathText;
