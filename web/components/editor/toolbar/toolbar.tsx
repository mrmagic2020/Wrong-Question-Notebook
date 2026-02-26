import React from 'react';
import type { Editor } from '@tiptap/core';
import type { EditorActiveState } from '../use-editor-active-state';
import type { MathPopoverHandle } from '../popovers/math-popover';
import { FormattingButtons } from './formatting-buttons';
import { HeadingButtons } from './heading-buttons';
import { ListButtons } from './list-buttons';
import { HistoryButtons } from './history-buttons';
import { LinkPopover } from '../popovers/link-popover';
import { MathPopover } from '../popovers/math-popover';
import { ImagePopover } from '../popovers/image-popover';

function Separator() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

interface EditorToolbarProps {
  editor: Editor;
  activeState: EditorActiveState;
  disabled: boolean;
  mathPopoverRef: React.RefObject<MathPopoverHandle>;
}

export function EditorToolbar({
  editor,
  activeState,
  disabled,
  mathPopoverRef,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/50">
      <FormattingButtons
        editor={editor}
        activeState={activeState}
        disabled={disabled}
      />
      <Separator />
      <HeadingButtons
        editor={editor}
        activeState={activeState}
        disabled={disabled}
      />
      <Separator />
      <ListButtons
        editor={editor}
        activeState={activeState}
        disabled={disabled}
      />
      <Separator />
      <div className="flex items-center gap-1">
        <LinkPopover
          editor={editor}
          isLinkActive={activeState.link}
          disabled={disabled}
        />
        <MathPopover ref={mathPopoverRef} editor={editor} disabled={disabled} />
        <ImagePopover editor={editor} disabled={disabled} />
      </div>
      <Separator />
      <HistoryButtons
        editor={editor}
        activeState={activeState}
        disabled={disabled}
      />
    </div>
  );
}
