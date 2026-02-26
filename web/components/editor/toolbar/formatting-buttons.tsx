import type { Editor } from '@tiptap/core';
import type { EditorActiveState } from '../use-editor-active-state';
import { ToolbarButton } from './toolbar-button';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
} from 'lucide-react';

interface FormattingButtonsProps {
  editor: Editor;
  activeState: EditorActiveState;
  disabled: boolean;
}

export function FormattingButtons({
  editor,
  activeState,
  disabled,
}: FormattingButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={activeState.bold}
        disabled={disabled}
        title="Bold"
        shortcut="Ctrl+B"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={activeState.italic}
        disabled={disabled}
        title="Italic"
        shortcut="Ctrl+I"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={activeState.strike}
        disabled={disabled}
        title="Strikethrough"
        shortcut="Ctrl+Shift+S"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={activeState.code}
        disabled={disabled}
        title="Inline code"
        shortcut="Ctrl+E"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={activeState.subscript}
        disabled={disabled}
        title="Subscript"
      >
        <SubscriptIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={activeState.superscript}
        disabled={disabled}
        title="Superscript"
      >
        <SuperscriptIcon className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
