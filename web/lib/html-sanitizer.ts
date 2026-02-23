import sanitizeHtml from 'sanitize-html';

// ---------------------------------------------------------------------------
// CSS allowlists — only listed property+value combos survive sanitization.
// Prevents CSS injection via url(), position:fixed, expression(), etc.
// ---------------------------------------------------------------------------

/** Matches safe CSS numeric values (e.g. "10px", "1.5em", "100%", "-0.25em") */
const CSS_NUMERIC =
  /^-?\d+(?:\.\d+)?(?:px|em|rem|ex|%|cm|mm|in|pt|pc|ch|vh|vw)?$/;

const IMG_STYLES: Record<string, RegExp[]> = {
  width: [CSS_NUMERIC, /^auto$/],
  height: [CSS_NUMERIC, /^auto$/],
  'max-width': [CSS_NUMERIC],
  'max-height': [CSS_NUMERIC],
  display: [/^(?:block|inline|inline-block|none)$/],
  'object-fit': [/^(?:contain|cover|fill|none|scale-down)$/],
};

/** Verified against katex.renderToString output for complex formulas. */
const KATEX_STYLES: Record<string, RegExp[]> = {
  height: [CSS_NUMERIC],
  width: [CSS_NUMERIC],
  'min-width': [CSS_NUMERIC],
  'max-width': [CSS_NUMERIC],
  top: [CSS_NUMERIC],
  left: [CSS_NUMERIC],
  right: [CSS_NUMERIC],
  bottom: [CSS_NUMERIC],
  'vertical-align': [CSS_NUMERIC],
  'margin-left': [CSS_NUMERIC],
  'margin-right': [CSS_NUMERIC],
  'margin-top': [CSS_NUMERIC],
  'margin-bottom': [CSS_NUMERIC],
  'padding-left': [CSS_NUMERIC],
  'padding-right': [CSS_NUMERIC],
  'font-size': [CSS_NUMERIC],
  'border-bottom-width': [CSS_NUMERIC],
  position: [/^relative$/],
};

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

/**
 * Detects KaTeX/TipTap math content by looking for class attribute values.
 * Uses word-boundary matching so plain text containing "katex" won't trigger.
 */
const MATH_CLASS_PATTERN = /class="[^"]*\b(?:katex|tiptap)\b[^"]*"/;

/** Attributes shared by both span and div (KaTeX math rendering). */
const MATH_ELEMENT_ATTRS = [
  'class',
  'data-math',
  'data-type',
  'data-latex',
  'aria-hidden',
  'aria-label',
  'role',
];

const DANGEROUS_IMG_PROTOCOLS = [
  'javascript:',
  'data:',
  'file:',
  'blob:',
  'ftp:',
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses a stricter config for regular content and a more permissive one
 * for math content (KaTeX/TipTap) that needs extra classes and styles.
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  if (MATH_CLASS_PATTERN.test(html)) {
    return sanitizeHtml(html, getMathSanitizeConfig());
  }

  return sanitizeHtml(html, getBaseSanitizeConfig());
}

/**
 * Strips all HTML tags, returning only text content.
 * Useful for creating previews or search indexes.
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

// ---------------------------------------------------------------------------
// Config builders
// ---------------------------------------------------------------------------

/** Base sanitize-html config for regular (non-math) rich text content. */
function getBaseSanitizeConfig(): sanitizeHtml.IOptions {
  return {
    allowedTags: [
      // Text formatting
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
      // Misc
      'hr',
      // KaTeX math rendering
      'span',
      'div',
    ],

    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'style'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      span: MATH_ELEMENT_ATTRS,
      div: MATH_ELEMENT_ATTRS,
      code: ['class'],
      '*': ['id'],
    },

    allowedClasses: {
      img: ['editor-image'],
    },

    allowedStyles: {
      img: IMG_STYLES,
    },

    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',

    transformTags: {
      a: addTargetBlankToExternalLinks,
      img: validateImgSrc,
    },
  };
}

/**
 * Extended config for content containing KaTeX/TipTap math.
 * Adds style attributes and wildcard classes for span/div so that
 * KaTeX's generated inline styles and dynamic class names survive.
 */
function getMathSanitizeConfig(): sanitizeHtml.IOptions {
  const base = getBaseSanitizeConfig();
  const baseAttrs =
    base.allowedAttributes && typeof base.allowedAttributes === 'object'
      ? base.allowedAttributes
      : {};

  return {
    ...base,
    allowedAttributes: {
      ...baseAttrs,
      span: [...((baseAttrs.span as string[]) ?? []), 'style'],
      div: [...((baseAttrs.div as string[]) ?? []), 'style'],
    },
    allowedClasses: {
      span: ['*'],
      div: ['*'],
    },
    allowedStyles: {
      img: IMG_STYLES,
      span: KATEX_STYLES,
      div: KATEX_STYLES,
    },
  };
}

// ---------------------------------------------------------------------------
// Transform helpers (used by sanitize-html transformTags)
// ---------------------------------------------------------------------------

/** Adds target="_blank" and rel="noopener noreferrer" to external links. */
const addTargetBlankToExternalLinks: sanitizeHtml.Transformer = (
  tagName,
  attribs
) => {
  if (
    attribs.href &&
    (attribs.href.startsWith('http://') || attribs.href.startsWith('https://'))
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
};

/**
 * Validates image src against an allowlist of safe origins:
 * http://, https://, or the internal /api/files/ path.
 * Strips src for anything else (dangerous protocols, unknown paths).
 */
const validateImgSrc: sanitizeHtml.Transformer = (tagName, attribs) => {
  if (!attribs.src) {
    return { tagName, attribs };
  }

  const srcLower = attribs.src.toLowerCase();

  const isDangerous = DANGEROUS_IMG_PROTOCOLS.some(p => srcLower.startsWith(p));
  const isAllowed =
    srcLower.startsWith('http://') ||
    srcLower.startsWith('https://') ||
    attribs.src.startsWith('/api/files/');

  if (isDangerous || !isAllowed) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { src: _removed, ...safeAttribs } = attribs;
    return { tagName, attribs: safeAttribs };
  }

  return { tagName, attribs };
};
