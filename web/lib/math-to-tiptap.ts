/**
 * Converts math-delimited text (from Gemini extraction) to TipTap-compatible HTML.
 *
 * Input format:
 * - Inline math: $...$
 * - Block math: $$...$$ (must be on its own line)
 *
 * Output format (matching @tiptap/extension-mathematics):
 * - Inline: <span data-type="inline-math" data-latex="..."></span>
 * - Block: <div data-type="block-math" data-latex="..."></div>
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

export function convertMathTextToTipTapHtml(text: string): string {
  const lines = text.split('\n');
  const htmlParts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line -> empty paragraph
    if (trimmed === '') {
      htmlParts.push('<p></p>');
      continue;
    }

    // Block math: entire line is $$...$$
    const blockMatch = trimmed.match(/^\$\$([\s\S]*?)\$\$$/);
    if (blockMatch) {
      htmlParts.push(
        `<div data-type="block-math" data-latex="${escapeAttr(blockMatch[1])}"></div>`
      );
      continue;
    }

    // Inline math replacement within a text line
    let result = '';
    let lastIndex = 0;
    const inlineRegex = /\$([^$\n]+?)\$/g;
    let match: RegExpExecArray | null;

    while ((match = inlineRegex.exec(line)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        result += escapeHtml(line.slice(lastIndex, match.index));
      }
      result += `<span data-type="inline-math" data-latex="${escapeAttr(match[1])}"></span>`;
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      result += escapeHtml(line.slice(lastIndex));
    }

    htmlParts.push(`<p>${result}</p>`);
  }

  return htmlParts.join('');
}
