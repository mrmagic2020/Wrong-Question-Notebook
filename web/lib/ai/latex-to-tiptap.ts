/**
 * Converts plain text with LaTeX delimiters ($...$ and $$...$$)
 * into TipTap-compatible HTML with data-latex attributes.
 *
 * Input format (from Gemini):
 *   "Solve for $x$ in $$x^2 + 2x - 3 = 0$$"
 *
 * Output format (for TipTap setContent):
 *   "<p>Solve for <span data-latex="x" data-type="inline-math"></span> in </p>
 *    <div data-latex="x^2 + 2x - 3 = 0" data-type="block-math"></div>"
 */

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Process a single line of raw text, converting inline math ($...$)
 * to TipTap inline-math spans while escaping plain text segments.
 *
 * Important: this receives RAW text (not HTML-escaped) so the $
 * delimiters are still intact for regex matching.
 */
function processInlineMath(line: string): string {
  // Match $...$ but not $$...$$
  const regex = /(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g;
  const parts: string[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    // Escape the plain text before this math segment
    if (match.index > lastIdx) {
      parts.push(escapeHtml(line.slice(lastIdx, match.index)));
    }
    // Add the math node (escape LaTeX for safe HTML attribute)
    const escapedLatex = escapeHtml(match[1].trim());
    parts.push(
      `<span data-latex="${escapedLatex}" data-type="inline-math"></span>`
    );
    lastIdx = match.index + match[0].length;
  }

  // Escape any remaining plain text after the last match
  if (lastIdx < line.length) {
    parts.push(escapeHtml(line.slice(lastIdx)));
  }

  return parts.join('');
}

/**
 * Convert plain text with LaTeX delimiters to TipTap-compatible HTML.
 *
 * Handles:
 * - $$...$$ → <div data-latex="..." data-type="block-math"></div>
 * - $...$ → <span data-latex="..." data-type="inline-math"></span>
 * - Plain text → <p>...</p>
 * - Empty lines → paragraph breaks
 */
export function latexToTiptapHtml(text: string): string {
  if (!text || text.trim() === '') return '';

  const result: string[] = [];

  // First, split on block math ($$...$$) which can span multiple lines
  const blockMathRegex = /\$\$([\s\S]+?)\$\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockMathRegex.exec(text)) !== null) {
    // Process text before this block math
    const before = text.slice(lastIndex, match.index);
    if (before.trim()) {
      result.push(...textToParagraphs(before));
    }

    // Add block math
    const latex = escapeHtml(match[1].trim());
    result.push(`<div data-latex="${latex}" data-type="block-math"></div>`);

    lastIndex = match.index + match[0].length;
  }

  // Process remaining text after the last block math
  const remaining = text.slice(lastIndex);
  if (remaining.trim()) {
    result.push(...textToParagraphs(remaining));
  }

  return result.join('');
}

/**
 * Convert plain text (possibly with inline math) into <p> elements.
 * Splits on double newlines for paragraph breaks.
 */
function textToParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter((para) => para.length > 0)
    .map((para) => {
      // Replace single newlines with <br> within a paragraph
      // processInlineMath handles escaping internally, so pass raw text
      const withBreaks = para
        .split('\n')
        .map((line) => processInlineMath(line))
        .join('<br>');
      return `<p>${withBreaks}</p>`;
    });
}
