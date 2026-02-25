import type { Editor } from '@tiptap/core';
import type { EditorActiveState } from '../use-editor-active-state';
import { ToolbarButton } from './toolbar-button';
import { Undo, Redo } from 'lucide-react';

interface HistoryButtonsProps {
  editor: Editor;
  activeState: EditorActiveState;
  disabled: boolean;
}

export function HistoryButtons({
  editor,
  activeState,
  disabled,
}: HistoryButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!activeState.canUndo || disabled}
        title="Undo"
        shortcut="Ctrl+Z"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!activeState.canRedo || disabled}
        title="Redo"
        shortcut="Ctrl+Shift+Z"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
