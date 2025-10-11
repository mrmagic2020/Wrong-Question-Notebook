'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { sanitizeHtmlContent } from '@/lib/html-sanitizer';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

/**
 * Component to display rich text content with proper styling
 * This ensures links and other formatted content render correctly outside the editor
 * Content is automatically sanitized before rendering to prevent XSS attacks
 */
export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sanitize content before rendering to prevent XSS attacks
  const sanitizedContent = content ? sanitizeHtmlContent(content) : '';

  // Process math elements after rendering
  useEffect(() => {
    if (!containerRef.current) return;

    const mathElements = containerRef.current.querySelectorAll('[data-latex]');

    mathElements.forEach(element => {
      const latex = element.getAttribute('data-latex');
      const isBlock = element.getAttribute('data-type') === 'block-math';

      if (latex && !element.hasAttribute('data-katex-rendered')) {
        try {
          const rendered = katex.renderToString(latex, {
            throwOnError: false,
            displayMode: isBlock,
            output: 'html',
          });

          // Replace the element's content with rendered math
          element.innerHTML = rendered;

          // Add appropriate classes based on math type
          if (isBlock) {
            element.classList.add('katex-display');
          } else {
            element.classList.add('katex');
          }

          // Mark as rendered to prevent re-processing
          element.setAttribute('data-katex-rendered', 'true');
        } catch {
          // Keep the original element if rendering fails
          // This ensures graceful degradation for invalid LaTeX
        }
      }
    });
  }, [sanitizedContent]);

  if (!content) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn('rich-text-content', className)}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
