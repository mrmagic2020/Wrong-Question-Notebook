import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Works both on client and server side using sanitize-html
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Special handling for math content - use a more permissive config
  // Match "katex" or "tiptap" as class attribute values to avoid false triggers
  // from plain text that happens to contain these words
  const MATH_CLASS_PATTERN = /class="[^"]*\b(?:katex|tiptap)\b[^"]*"/;
  if (MATH_CLASS_PATTERN.test(html)) {
    // Use a more permissive config for math content
    const baseConfig = getSanitizeConfig();
    const baseAttrs =
      baseConfig.allowedAttributes &&
      typeof baseConfig.allowedAttributes === 'object'
        ? baseConfig.allowedAttributes
        : {};
    const mathConfig = {
      ...baseConfig,
      allowedAttributes: {
        ...baseAttrs,
        // KaTeX uses inline styles on span/div for layout
        span: [...((baseAttrs.span as string[]) ?? []), 'style'],
        div: [...((baseAttrs.div as string[]) ?? []), 'style'],
      },
      // Allow all classes for math elements to preserve KaTeX styling
      allowedClasses: {
        span: ['*'],
        div: ['*'],
      },
    };

    return sanitizeHtml(html, mathConfig);
  }

  // Use standard config for non-math content
  return sanitizeHtml(html, getSanitizeConfig());
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
      '*': ['id'],
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

    // Disallow protocol-relative URLs (e.g. //evil.com) to prevent phishing
    allowProtocolRelative: false,

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
          const srcLower = attribs.src.toLowerCase();

          // Block dangerous protocols
          const dangerousProtocols = [
            'javascript:',
            'data:',
            'file:',
            'blob:',
            'ftp:',
          ];
          if (
            dangerousProtocols.some(protocol => srcLower.startsWith(protocol))
          ) {
            const { src, ...safeAttribs } = attribs;
            void src;
            return { tagName, attribs: safeAttribs };
          }

          // Only allow http://, https://, or relative paths starting with /api/files/
          if (
            !srcLower.startsWith('http://') &&
            !srcLower.startsWith('https://') &&
            !attribs.src.startsWith('/api/files/')
          ) {
            const { src, ...safeAttribs } = attribs;
            void src;
            return { tagName, attribs: safeAttribs };
          }
        }
        return { tagName, attribs };
      },
    },
  };
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
