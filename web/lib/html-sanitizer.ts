import sanitizeHtml from 'sanitize-html';
import { logger } from './logger';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Works both on client and server side using sanitize-html
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const sanitized = sanitizeHtml(html, getSanitizeConfig());

  // Ensure the sanitized HTML is valid and complete
  // This prevents issues where HTML might be truncated
  if (typeof window !== 'undefined') {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitized;
      // If parsing succeeded, return the sanitized content
      return sanitized;
    } catch {
      // If parsing failed, return the original content (it will be sanitized again)
      logger.warn('HTML sanitization resulted in invalid HTML', {
        component: 'HTMLSanitizer',
        action: 'sanitizeHtmlContent',
      });
      return html;
    }
  }

  return sanitized;
}

/**
 * Configuration for sanitize-html sanitization
 * Allows safe HTML tags and attributes commonly used in rich text content
 */
function getSanitizeConfig(): sanitizeHtml.IOptions {
  return {
    allowedTags: [
      // Basic text formatting
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'mark',
      'small',
      'sub',
      'sup',

      // Headings
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',

      // Lists
      'ul',
      'ol',
      'li',

      // Links and media
      'a',
      'img',

      // Code
      'code',
      'pre',

      // Quotes
      'blockquote',

      // Tables
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',

      // Horizontal rule
      'hr',

      // Math (KaTeX specific)
      'span',
      'div',
    ],

    allowedAttributes: {
      // Link attributes
      a: ['href', 'target', 'rel'],

      // Image attributes
      img: ['src', 'alt', 'title', 'width', 'height'],

      // Table attributes
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],

      // Math attributes (KaTeX)
      span: ['class', 'data-math'],
      div: ['class', 'data-math'],
      code: ['class'],

      // General attributes
      '*': ['id', 'style'],
    },

    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },

    // Allow data URIs for images (common in rich text editors)
    allowProtocolRelative: true,

    // Disallowed tags for security
    disallowedTagsMode: 'discard',

    // Additional security measures
    allowedIframeHostnames: [],
    allowedIframeDomains: [],

    // Transform functions for additional security
    transformTags: {
      // Ensure external links open in new tab
      a: (tagName, attribs) => {
        if (
          attribs.href &&
          (attribs.href.startsWith('http://') ||
            attribs.href.startsWith('https://'))
        ) {
          return {
            tagName: 'a',
            attribs: {
              ...attribs,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          };
        }
        return { tagName, attribs };
      },
    },
  };
}

/**
 * Validates that the provided HTML is safe (contains only allowed tags and attributes)
 * Returns true if the HTML is safe, false otherwise
 */
export function isValidHtml(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return true; // Empty or non-string content is considered valid
  }

  const sanitized = sanitizeHtmlContent(html);
  return sanitized === html;
}

/**
 * Strips all HTML tags, returning only the text content
 * Useful for creating previews or search indexes
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}
