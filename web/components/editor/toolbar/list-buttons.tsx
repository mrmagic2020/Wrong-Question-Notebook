import type { Editor } from '@tiptap/core';
import type { EditorActiveState } from '../use-editor-active-state';
import { ToolbarButton } from './toolbar-button';
import { List, ListOrdered, Quote } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ListButtonsProps {
  editor: Editor;
  activeState: EditorActiveState;
  disabled: boolean;
}

export function ListButtons({
  editor,
  activeState,
  disabled,
}: ListButtonsProps) {
  const t = useTranslations('Editor');
  return (
    <div className="flex items-center gap-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={activeState.bulletList}
        disabled={disabled}
        title={t('toolbarBulletList')}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={activeState.orderedList}
        disabled={disabled}
        title={t('toolbarNumberedList')}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={activeState.blockquote}
        disabled={disabled}
        title={t('toolbarQuote')}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
