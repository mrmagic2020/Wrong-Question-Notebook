import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Mathematics } from '@tiptap/extension-mathematics';
import Typography from '@tiptap/extension-typography';
import { Placeholder, CharacterCount } from '@tiptap/extensions';
import { ResizableImage } from 'tiptap-extension-resizable-image';
import type { Node } from '@tiptap/pm/model';

interface CreateEditorExtensionsOptions {
  placeholder: string;
  maxLength?: number;
  onMathClick: (latex: string, isBlock: boolean, pos: number) => void;
}

export function createEditorExtensions({
  placeholder,
  maxLength,
  onMathClick,
}: CreateEditorExtensionsOptions) {
  return [
    StarterKit.configure({
      link: false,
    }),
    Link.configure({
      openOnClick: false,
      enableClickSelection: true,
      autolink: true,
      linkOnPaste: true,
      defaultProtocol: 'https',
      protocols: ['http', 'https'],
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
      validate: (href: string) => /^https?:\/\//.test(href),
    }).extend({
      inclusive: false,
    }),
    Subscript,
    Superscript,
    Mathematics.configure({
      inlineOptions: {
        onClick: (node: Node, pos: number) => {
          onMathClick(node.attrs.latex || '', false, pos);
        },
      },
      blockOptions: {
        onClick: (node: Node, pos: number) => {
          onMathClick(node.attrs.latex || '', true, pos);
        },
      },
      katexOptions: {
        strict: false,
        throwOnError: false,
        macros: {
          '\\R': '\\mathbb{R}',
          '\\N': '\\mathbb{N}',
        },
      },
    }),
    Placeholder.configure({
      placeholder,
    }),
    CharacterCount.configure({
      limit: maxLength || null,
      mode: 'textSize',
    }),
    Typography,
    ResizableImage.configure({
      allowBase64: false,
      withCaption: true,
    }),
  ];
}
