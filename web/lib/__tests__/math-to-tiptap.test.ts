import { convertMathTextToTipTapHtml } from '../math-to-tiptap';

describe('convertMathTextToTipTapHtml', () => {
  it('wraps plain text in a paragraph', () => {
    expect(convertMathTextToTipTapHtml('hello world')).toBe(
      '<p>hello world</p>'
    );
  });

  it('wraps multiple lines in separate paragraphs', () => {
    expect(convertMathTextToTipTapHtml('line one\nline two')).toBe(
      '<p>line one</p><p>line two</p>'
    );
  });

  it('converts empty lines to empty paragraphs', () => {
    expect(convertMathTextToTipTapHtml('a\n\nb')).toBe(
      '<p>a</p><p></p><p>b</p>'
    );
  });

  it('returns an empty paragraph for empty input', () => {
    expect(convertMathTextToTipTapHtml('')).toBe('<p></p>');
  });

  it('converts inline math $...$ to inline-math span', () => {
    expect(convertMathTextToTipTapHtml('solve $x^2$')).toBe(
      '<p>solve <span data-type="inline-math" data-latex="x^2"></span></p>'
    );
  });

  it('converts multiple inline math expressions on one line', () => {
    expect(convertMathTextToTipTapHtml('$a$ plus $b$')).toBe(
      '<p><span data-type="inline-math" data-latex="a"></span> plus <span data-type="inline-math" data-latex="b"></span></p>'
    );
  });

  it('converts block math $$...$$ to block-math div', () => {
    expect(convertMathTextToTipTapHtml('$$x^2 + 1$$')).toBe(
      '<div data-type="block-math" data-latex="x^2 + 1"></div>'
    );
  });

  it('handles mixed content across multiple lines', () => {
    const input = 'text\n$$E=mc^2$$\n\nsolve $x$';
    expect(convertMathTextToTipTapHtml(input)).toBe(
      '<p>text</p>' +
        '<div data-type="block-math" data-latex="E=mc^2"></div>' +
        '<p></p>' +
        '<p>solve <span data-type="inline-math" data-latex="x"></span></p>'
    );
  });

  describe('HTML escaping', () => {
    it('escapes <, >, and & in plain text', () => {
      expect(convertMathTextToTipTapHtml('a < b & c > d')).toBe(
        '<p>a &lt; b &amp; c &gt; d</p>'
      );
    });

    it('escapes quotes in math attribute values', () => {
      expect(convertMathTextToTipTapHtml('$a"b$')).toBe(
        '<p><span data-type="inline-math" data-latex="a&quot;b"></span></p>'
      );
    });

    it('escapes HTML entities inside block math attributes', () => {
      expect(convertMathTextToTipTapHtml('$$a<b>c$$')).toBe(
        '<div data-type="block-math" data-latex="a&lt;b&gt;c"></div>'
      );
    });
  });
});
