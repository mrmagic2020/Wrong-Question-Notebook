import type { Editor } from '@tiptap/core';
import type { EditorActiveState } from '../use-editor-active-state';
import { ToolbarButton } from './toolbar-button';
import { Heading1, Heading2, Heading3 } from 'lucide-react';

interface HeadingButtonsProps {
  editor: Editor;
  activeState: EditorActiveState;
  disabled: boolean;
}

export function HeadingButtons({
  editor,
  activeState,
  disabled,
}: HeadingButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={activeState.heading1}
        disabled={disabled}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={activeState.heading2}
        disabled={disabled}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={activeState.heading3}
        disabled={disabled}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
