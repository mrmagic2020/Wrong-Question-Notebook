'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { sanitizeHtmlContent } from '@/lib/html-sanitizer';

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
  if (!content) {
    return null;
  }

  // Sanitize content before rendering to prevent XSS attacks
  const sanitizedContent = sanitizeHtmlContent(content);

  return (
    <div
      className={cn('rich-text-content', className)}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
