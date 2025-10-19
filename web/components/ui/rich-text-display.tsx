'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
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
const RichTextDisplay = React.memo(function RichTextDisplay({
  content,
  className,
}: RichTextDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastProcessedContent = useRef<string>('');
  const hasProcessedMath = useRef<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sanitize content before rendering to prevent XSS attacks
  const sanitizedContent = useMemo(() => {
    return content ? sanitizeHtmlContent(content) : '';
  }, [content]);

  // Process math elements - this function handles the actual math rendering
  const processMathElements = useCallback(() => {
    if (!containerRef.current || hasProcessedMath.current) return;

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
        } catch (error) {
          // Log error for debugging but don't crash the component
          console.warn('KaTeX rendering failed:', error);
          // Keep the original element if rendering fails
          // This ensures graceful degradation for invalid LaTeX
        }
      }
    });

    // Mark that we've processed math for this content
    hasProcessedMath.current = true;
  }, []);

  // Cleanup function to clear timeouts and observers
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Process math elements after rendering
  useEffect(() => {
    // Clean up previous timeouts and observers
    cleanup();

    // Reset the processed flag when content changes
    if (lastProcessedContent.current !== sanitizedContent) {
      lastProcessedContent.current = sanitizedContent;
      hasProcessedMath.current = false;
    }

    // Use a small delay to ensure the DOM has been updated with the new content
    timeoutRef.current = setTimeout(() => {
      processMathElements();
    }, 0);

    return cleanup;
  }, [sanitizedContent, processMathElements, cleanup]);

  // Handle visibility changes - process math when component becomes visible
  useEffect(() => {
    if (!containerRef.current || hasProcessedMath.current) return;

    // Use Intersection Observer to detect when component becomes visible
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasProcessedMath.current) {
            // Component is visible and math hasn't been processed yet
            processMathElements();
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of the component is visible
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [processMathElements]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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
});

export { RichTextDisplay };
