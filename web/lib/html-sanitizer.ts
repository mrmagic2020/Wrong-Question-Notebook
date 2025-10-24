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

  // Special handling for math content - use a more permissive config
  if (html.includes('katex') || html.includes('tiptap')) {
    // Use a more permissive config for math content
    const mathConfig = {
      ...getSanitizeConfig(),
      // Allow all classes for math elements to preserve KaTeX styling
      allowedClasses: {
        span: [
          'katex',
          'katex-display',
          'katex-inline',
          'katex-mathml',
          'katex-html',
        ],
        div: [
          'katex',
          'katex-display',
          'katex-inline',
          'katex-mathml',
          'katex-html',
        ],
      },
    };

    return sanitizeHtml(html, mathConfig);
  }

  // Use standard config for non-math content
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
      img: ['src', 'alt', 'title', 'width', 'height', 'style'],

      // Table attributes
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],

      // Math attributes (KaTeX) - allow all common KaTeX attributes
      span: [
        'class',
        'data-math',
        'data-type',
        'data-latex',
        'aria-hidden',
        'aria-label',
        'role',
      ],
      div: [
        'class',
        'data-math',
        'data-type',
        'data-latex',
        'aria-hidden',
        'aria-label',
        'role',
      ],
      code: ['class'],

      // General attributes
      '*': ['id', 'style'],
    },

    // Allow specific classes for images
    allowedClasses: {
      img: ['editor-image'],
    },

    // Allow all classes for math-related elements (KaTeX generates many dynamic classes)
    // Note: sanitize-html doesn't support wildcards, so we'll use transformTags instead

    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
    },

    // Allow protocol relative URLs for images
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
      // Preserve math content
      span: (tagName, attribs) => {
        // If this looks like a math element, preserve all attributes
        if (
          attribs.class &&
          (attribs.class.includes('katex') || attribs.class.includes('tiptap'))
        ) {
          return { tagName, attribs };
        }
        return { tagName, attribs };
      },
      div: (tagName, attribs) => {
        // If this looks like a math element, preserve all attributes
        if (
          attribs.class &&
          (attribs.class.includes('katex') || attribs.class.includes('tiptap'))
        ) {
          return { tagName, attribs };
        }
        return { tagName, attribs };
      },
      // Validate image URLs for security
      img: (tagName, attribs) => {
        if (attribs.src) {
          // Block dangerous protocols
          const dangerousProtocols = [
            'javascript:',
            'data:',
            'file:',
            'blob:',
            'ftp:',
          ];
          if (
            dangerousProtocols.some(protocol =>
              attribs.src.toLowerCase().startsWith(protocol)
            )
          ) {
            // Remove the src attribute to prevent XSS
            const { src, ...safeAttribs } = attribs;
            void src; // Explicitly mark as intentionally unused
            return { tagName, attribs: safeAttribs };
          }

          // Only allow http://, https://, or relative paths starting with /api/files/
          if (
            !attribs.src.startsWith('http://') &&
            !attribs.src.startsWith('https://') &&
            !attribs.src.startsWith('/api/files/')
          ) {
            // Remove the src attribute for invalid URLs
            const { src, ...safeAttribs } = attribs;
            void src; // Explicitly mark as intentionally unused
            return { tagName, attribs: safeAttribs };
          }
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
