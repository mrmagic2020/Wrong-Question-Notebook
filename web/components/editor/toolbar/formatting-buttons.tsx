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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Editor');
  return (
    <div className="flex items-center gap-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={activeState.bold}
        disabled={disabled}
        title={t('toolbarBold')}
        shortcut="Ctrl+B"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={activeState.italic}
        disabled={disabled}
        title={t('toolbarItalic')}
        shortcut="Ctrl+I"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={activeState.strike}
        disabled={disabled}
        title={t('toolbarStrikethrough')}
        shortcut="Ctrl+Shift+S"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={activeState.code}
        disabled={disabled}
        title={t('toolbarInlineCode')}
        shortcut="Ctrl+E"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={activeState.subscript}
        disabled={disabled}
        title={t('toolbarSubscript')}
      >
        <SubscriptIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={activeState.superscript}
        disabled={disabled}
        title={t('toolbarSuperscript')}
      >
        <SuperscriptIcon className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
