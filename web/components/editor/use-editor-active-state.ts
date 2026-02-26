import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';

export interface EditorActiveState {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
  heading1: boolean;
  heading2: boolean;
  heading3: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  link: boolean;
  subscript: boolean;
  superscript: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export const DEFAULT_ACTIVE_STATE: EditorActiveState = {
  bold: false,
  italic: false,
  strike: false,
  code: false,
  heading1: false,
  heading2: false,
  heading3: false,
  bulletList: false,
  orderedList: false,
  blockquote: false,
  link: false,
  subscript: false,
  superscript: false,
  canUndo: false,
  canRedo: false,
};

export function useEditorActiveState(editor: Editor | null): EditorActiveState {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }): EditorActiveState => {
      if (!e) return DEFAULT_ACTIVE_STATE;
      return {
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        strike: e.isActive('strike'),
        code: e.isActive('code'),
        heading1: e.isActive('heading', { level: 1 }),
        heading2: e.isActive('heading', { level: 2 }),
        heading3: e.isActive('heading', { level: 3 }),
        bulletList: e.isActive('bulletList'),
        orderedList: e.isActive('orderedList'),
        blockquote: e.isActive('blockquote'),
        link: e.isActive('link'),
        subscript: e.isActive('subscript'),
        superscript: e.isActive('superscript'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });
  return state ?? DEFAULT_ACTIVE_STATE;
}
