import { describe, it, expect } from 'vitest';
import { sanitizeHtmlContent, stripHtml } from '../html-sanitizer';

// ---------------------------------------------------------------------------
// sanitizeHtmlContent — input validation
// ---------------------------------------------------------------------------

describe('sanitizeHtmlContent', () => {
  describe('input validation', () => {
    it('should return empty string for empty input', () => {
      expect(sanitizeHtmlContent('')).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeHtmlContent(null as unknown as string)).toBe('');
      expect(sanitizeHtmlContent(undefined as unknown as string)).toBe('');
      expect(sanitizeHtmlContent(42 as unknown as string)).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Allowed tags
  // ---------------------------------------------------------------------------

  describe('allowed tags', () => {
    it('should preserve basic formatting tags', () => {
      const input =
        '<p><strong>bold</strong> <em>italic</em> <u>underline</u></p>';
      expect(sanitizeHtmlContent(input)).toBe(input);
    });

    it('should preserve heading tags', () => {
      expect(sanitizeHtmlContent('<h1>Title</h1>')).toBe('<h1>Title</h1>');
      expect(sanitizeHtmlContent('<h3>Sub</h3>')).toBe('<h3>Sub</h3>');
    });

    it('should preserve list tags', () => {
      const input = '<ul><li>one</li><li>two</li></ul>';
      expect(sanitizeHtmlContent(input)).toBe(input);
    });

    it('should preserve code and pre tags', () => {
      const input = '<pre><code>const x = 1;</code></pre>';
      expect(sanitizeHtmlContent(input)).toBe(input);
    });

    it('should preserve table tags', () => {
      const input =
        '<table><thead><tr><th>H</th></tr></thead><tbody><tr><td>D</td></tr></tbody></table>';
      expect(sanitizeHtmlContent(input)).toBe(input);
    });

    it('should preserve blockquote and hr', () => {
      expect(sanitizeHtmlContent('<blockquote>q</blockquote>')).toBe(
        '<blockquote>q</blockquote>'
      );
      expect(sanitizeHtmlContent('<hr />')).toContain('hr');
    });

    it('should preserve span and div (for KaTeX)', () => {
      expect(sanitizeHtmlContent('<span>x</span>')).toBe('<span>x</span>');
      expect(sanitizeHtmlContent('<div>x</div>')).toBe('<div>x</div>');
    });
  });

  // ---------------------------------------------------------------------------
  // Disallowed tags
  // ---------------------------------------------------------------------------

  describe('disallowed tags', () => {
    it('should strip script tags', () => {
      const result = sanitizeHtmlContent('<script>alert("xss")</script>');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('should strip iframe tags', () => {
      const result = sanitizeHtmlContent(
        '<iframe src="https://evil.com"></iframe>'
      );
      expect(result).not.toContain('<iframe');
    });

    it('should strip form and input tags', () => {
      const result = sanitizeHtmlContent(
        '<form action="/steal"><input type="text" /></form>'
      );
      expect(result).not.toContain('<form');
      expect(result).not.toContain('<input');
    });

    it('should strip object and embed tags', () => {
      const result = sanitizeHtmlContent(
        '<object data="x.swf"></object><embed src="x.swf" />'
      );
      expect(result).not.toContain('<object');
      expect(result).not.toContain('<embed');
    });

    it('should strip event handler attributes', () => {
      const result = sanitizeHtmlContent('<p onclick="alert(1)">click me</p>');
      expect(result).not.toContain('onclick');
    });
  });

  // ---------------------------------------------------------------------------
  // Link sanitization
  // ---------------------------------------------------------------------------

  describe('link sanitization', () => {
    it('should add target="_blank" and rel to external links', () => {
      const result = sanitizeHtmlContent(
        '<a href="https://example.com">link</a>'
      );
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should not add target="_blank" to non-http links', () => {
      const result = sanitizeHtmlContent(
        '<a href="mailto:test@example.com">mail</a>'
      );
      expect(result).not.toContain('target="_blank"');
    });

    it('should strip javascript: href', () => {
      const result = sanitizeHtmlContent(
        '<a href="javascript:alert(1)">xss</a>'
      );
      expect(result).not.toContain('javascript:');
    });

    it('should strip protocol-relative URLs', () => {
      const result = sanitizeHtmlContent('<a href="//evil.com/phish">link</a>');
      expect(result).not.toContain('//evil.com');
    });
  });

  // ---------------------------------------------------------------------------
  // Image sanitization
  // ---------------------------------------------------------------------------

  describe('image sanitization', () => {
    it('should allow http/https image sources', () => {
      const result = sanitizeHtmlContent(
        '<img src="https://example.com/img.jpg" alt="test" />'
      );
      expect(result).toContain('src="https://example.com/img.jpg"');
    });

    it('should allow /api/files/ image sources', () => {
      const result = sanitizeHtmlContent(
        '<img src="/api/files/abc123" alt="uploaded" />'
      );
      expect(result).toContain('src="/api/files/abc123"');
    });

    it('should strip javascript: image sources', () => {
      const result = sanitizeHtmlContent('<img src="javascript:alert(1)" />');
      expect(result).not.toContain('javascript:');
    });

    it('should strip data: image sources', () => {
      const result = sanitizeHtmlContent(
        '<img src="data:image/svg+xml,<svg onload=alert(1)>" />'
      );
      expect(result).not.toContain('data:');
    });

    it('should strip blob: image sources', () => {
      const result = sanitizeHtmlContent(
        '<img src="blob:https://example.com/abc" />'
      );
      expect(result).not.toContain('blob:');
    });

    it('should strip file: image sources', () => {
      const result = sanitizeHtmlContent('<img src="file:///etc/passwd" />');
      expect(result).not.toContain('file:');
    });

    it('should handle case-insensitive dangerous protocols', () => {
      const result = sanitizeHtmlContent('<img src="JAVASCRIPT:alert(1)" />');
      expect(result).not.toContain('JAVASCRIPT:');
    });

    it('should handle case-insensitive valid protocols', () => {
      const result = sanitizeHtmlContent(
        '<img src="HTTPS://example.com/img.jpg" alt="test" />'
      );
      expect(result).toContain('HTTPS://example.com/img.jpg');
    });

    it('should strip invalid relative paths', () => {
      const result = sanitizeHtmlContent('<img src="/some/other/path.jpg" />');
      expect(result).not.toContain('/some/other/path.jpg');
    });

    it('should preserve allowed image attributes', () => {
      const result = sanitizeHtmlContent(
        '<img src="https://example.com/i.jpg" alt="a" title="t" width="100" height="50" />'
      );
      expect(result).toContain('alt="a"');
      expect(result).toContain('title="t"');
      expect(result).toContain('width="100"');
      expect(result).toContain('height="50"');
    });
  });

  // ---------------------------------------------------------------------------
  // Style attribute handling
  // ---------------------------------------------------------------------------

  describe('style attribute handling', () => {
    it('should strip style from non-img elements in standard mode', () => {
      const result = sanitizeHtmlContent(
        '<p style="background:url(javascript:alert(1))">text</p>'
      );
      expect(result).not.toContain('style=');
    });

    it('should strip style from span/div in standard mode', () => {
      const result = sanitizeHtmlContent('<span style="color:red">text</span>');
      expect(result).not.toContain('style=');
    });

    it('should allow safe CSS properties on img elements', () => {
      const result = sanitizeHtmlContent(
        '<img src="https://example.com/i.jpg" style="max-width:100%" />'
      );
      expect(result).toContain('max-width:100%');
    });

    it('should strip url() from img style to prevent data exfiltration', () => {
      const result = sanitizeHtmlContent(
        '<img src="https://example.com/i.jpg" style="background:url(https://attacker.com/steal)" />'
      );
      expect(result).not.toContain('url(');
      expect(result).not.toContain('attacker.com');
    });

    it('should strip position:fixed from img style to prevent overlay attacks', () => {
      const result = sanitizeHtmlContent(
        '<img src="https://example.com/i.jpg" style="position:fixed;top:0;left:0;width:100vw;height:100vh" />'
      );
      expect(result).not.toContain('position:fixed');
    });

    it('should allow safe img style properties and strip dangerous ones', () => {
      const result = sanitizeHtmlContent(
        '<img src="https://example.com/i.jpg" style="max-width:100%;position:absolute;background-image:url(evil)" />'
      );
      expect(result).toContain('max-width:100%');
      expect(result).not.toContain('position');
      expect(result).not.toContain('url(');
    });
  });

  // ---------------------------------------------------------------------------
  // Math content detection
  // ---------------------------------------------------------------------------

  describe('math content detection', () => {
    it('should use permissive config for content with katex class', () => {
      const input =
        '<span class="katex"><span class="katex-mathml">x²</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('katex-mathml');
    });

    it('should use permissive config for content with tiptap class', () => {
      const input =
        '<div class="tiptap-math"><span style="font-size:1em">x</span></div>';
      const result = sanitizeHtmlContent(input);
      // Math config allows style on span/div
      expect(result).toContain('style=');
    });

    it('should NOT trigger math mode for plain text containing "katex"', () => {
      const input = '<p>I use katex for rendering math</p>';
      const result = sanitizeHtmlContent(input);
      // Should use standard config — no permissive class handling
      expect(result).toBe('<p>I use katex for rendering math</p>');
    });

    it('should NOT trigger math mode for katex in href', () => {
      const input = '<a href="https://katex.org">KaTeX docs</a>';
      const result = sanitizeHtmlContent(input);
      // Should use standard config with link transform
      expect(result).toContain('target="_blank"');
    });

    it('should allow safe KaTeX styles on span/div in math mode', () => {
      const input =
        '<span class="katex" style="font-size:1.2em;vertical-align:-0.25em">math</span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('font-size:1.2em');
      expect(result).toContain('vertical-align:-0.25em');
    });

    it('should allow position:relative in math mode', () => {
      const input =
        '<span class="katex"><span style="position:relative;top:-2.655em">x</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('position:relative');
    });

    it('should strip position:fixed in math mode', () => {
      const input =
        '<span class="katex"><span style="position:fixed;top:0;left:0;width:100vw;height:100vh">overlay</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).not.toContain('position:fixed');
    });

    it('should strip url() from styles in math mode', () => {
      const input =
        '<span class="katex" style="background:url(https://attacker.com/steal)">math</span>';
      const result = sanitizeHtmlContent(input);
      expect(result).not.toContain('url(');
      expect(result).not.toContain('attacker.com');
    });

    it('should allow wildcard classes in math mode', () => {
      const input =
        '<span class="katex"><span class="mord mathnormal">x</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('mord mathnormal');
    });

    it('should trigger math mode for single-quoted class attributes', () => {
      const input =
        "<span class='katex'><span style='font-size:1em'>x</span></span>";
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('font-size:1em');
    });

    it('should preserve color style in math mode for \\textcolor', () => {
      const input =
        '<span class="katex"><span style="color:#cc0000">x</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('color:#cc0000');
    });

    it('should preserve named color in math mode', () => {
      const input =
        '<span class="katex"><span style="color:red">x</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('color:red');
    });

    it('should preserve background-color in math mode for \\colorbox', () => {
      const input =
        '<span class="katex"><span style="background-color:#ffa500">x</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('background-color:#ffa500');
    });

    it('should preserve vertical-align keyword in math mode', () => {
      const input =
        '<span class="katex"><span style="vertical-align:bottom">x</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('vertical-align:bottom');
    });

    it('should preserve margin shorthand in math mode', () => {
      const input =
        '<span class="katex"><span style="margin:0 -0.1667em">x</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('margin:0 -0.1667em');
    });

    it('should preserve border properties in math mode for \\boxed', () => {
      const input =
        '<span class="katex"><span style="border-width:0.04em;border-style:solid">x</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('border-width:0.04em');
      expect(result).toContain('border-style:solid');
    });

    it('should preserve border-right-width in math mode for angle brackets', () => {
      const input =
        '<span class="katex"><span style="border-right-width:0.049em;border-right-style:solid">x</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('border-right-width:0.049em');
      expect(result).toContain('border-right-style:solid');
    });

    it('should preserve border-top-width in math mode for fraction rules', () => {
      const input =
        '<span class="katex"><span style="border-top-width:0.04em">x</span></span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('border-top-width:0.04em');
    });
  });

  // ---------------------------------------------------------------------------
  // Allowed attributes
  // ---------------------------------------------------------------------------

  describe('allowed attributes', () => {
    it('should allow id on any element', () => {
      const result = sanitizeHtmlContent('<p id="intro">text</p>');
      expect(result).toContain('id="intro"');
    });

    it('should allow data-math and data-latex on span', () => {
      const input = '<span data-math="true" data-latex="x^2">x²</span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('data-math="true"');
      expect(result).toContain('data-latex="x^2"');
    });

    it('should allow aria attributes on span/div', () => {
      const input =
        '<span aria-hidden="true" role="img" aria-label="equation">x</span>';
      const result = sanitizeHtmlContent(input);
      expect(result).toContain('aria-hidden="true"');
      expect(result).toContain('role="img"');
      expect(result).toContain('aria-label="equation"');
    });

    it('should allow class on code elements', () => {
      const result = sanitizeHtmlContent(
        '<code class="language-js">const x = 1;</code>'
      );
      expect(result).toContain('class="language-js"');
    });

    it('should allow colspan/rowspan on td/th', () => {
      const result = sanitizeHtmlContent(
        '<table><tr><td colspan="2">wide</td></tr></table>'
      );
      expect(result).toContain('colspan="2"');
    });
  });

  // ---------------------------------------------------------------------------
  // XSS vectors
  // ---------------------------------------------------------------------------

  describe('XSS prevention', () => {
    it('should strip onerror on img', () => {
      const result = sanitizeHtmlContent('<img src="x" onerror="alert(1)" />');
      expect(result).not.toContain('onerror');
    });

    it('should strip nested script injection', () => {
      const result = sanitizeHtmlContent(
        '<div><img src=x onerror=alert(1)><script>alert(2)</script></div>'
      );
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('should strip SVG-based XSS', () => {
      const result = sanitizeHtmlContent(
        '<svg onload="alert(1)"><circle r="50" /></svg>'
      );
      expect(result).not.toContain('<svg');
      expect(result).not.toContain('onload');
    });

    it('should strip meta refresh injection', () => {
      const result = sanitizeHtmlContent(
        '<meta http-equiv="refresh" content="0;url=evil.com" />'
      );
      expect(result).not.toContain('<meta');
    });

    it('should strip style tag injection', () => {
      const result = sanitizeHtmlContent(
        '<style>body { background: url("javascript:alert(1)") }</style>'
      );
      expect(result).not.toContain('<style');
    });
  });
});

// ---------------------------------------------------------------------------
// stripHtml
// ---------------------------------------------------------------------------

describe('stripHtml', () => {
  it('should return empty string for empty input', () => {
    expect(stripHtml('')).toBe('');
  });

  it('should return empty string for non-string input', () => {
    expect(stripHtml(null as unknown as string)).toBe('');
    expect(stripHtml(undefined as unknown as string)).toBe('');
  });

  it('should strip all HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe(
      'Hello world'
    );
  });

  it('should strip nested tags and insert spaces between blocks', () => {
    expect(stripHtml('<div><p>a</p><ul><li>b</li><li>c</li></ul></div>')).toBe(
      'a b c'
    );
  });

  it('should handle content with no tags', () => {
    expect(stripHtml('plain text')).toBe('plain text');
  });

  it('should handle HTML entities', () => {
    expect(stripHtml('<p>&amp; &lt; &gt;</p>')).toBe('&amp; &lt; &gt;');
  });
});
