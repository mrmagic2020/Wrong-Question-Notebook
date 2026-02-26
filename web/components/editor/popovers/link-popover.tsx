import { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Link as LinkIcon } from 'lucide-react';

interface LinkPopoverProps {
  editor: Editor;
  isLinkActive: boolean;
  disabled: boolean;
}

export function LinkPopover({
  editor,
  isLinkActive,
  disabled,
}: LinkPopoverProps) {
  const [open, setOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const handleOpen = useCallback(() => {
    if (isLinkActive) {
      const { href } = editor.getAttributes('link');
      setLinkUrl(href || '');
      setLinkText('');
    } else {
      if (!editor.state.selection.empty) {
        const selectedText = editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        );
        setLinkText(selectedText);
      } else {
        setLinkText('');
      }
      setLinkUrl('');
    }
    setOpen(true);
  }, [editor, isLinkActive]);

  const handleAddLink = useCallback(() => {
    if (!linkUrl.trim()) return;

    let finalUrl = linkUrl.trim();
    if (!finalUrl.match(/^https?:\/\//)) {
      finalUrl = `https://${finalUrl}`;
    }

    if (isLinkActive) {
      editor.chain().focus().setLink({ href: finalUrl }).run();
    } else if (editor.state.selection.empty) {
      const displayText = linkText.trim() || finalUrl;
      editor.chain().focus().insertContent(displayText).run();
      const currentPos = editor.state.selection.from;
      const startPos = currentPos - displayText.length;
      editor
        .chain()
        .focus()
        .setTextSelection({ from: startPos, to: currentPos })
        .setLink({ href: finalUrl })
        .run();
    } else {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      );
      const displayText = linkText.trim() || selectedText;
      editor
        .chain()
        .focus()
        .insertContentAt(editor.state.selection, displayText)
        .run();
      const currentPos = editor.state.selection.from;
      const startPos = currentPos - displayText.length;
      editor
        .chain()
        .focus()
        .setTextSelection({ from: startPos, to: currentPos })
        .setLink({ href: finalUrl })
        .run();
    }

    setLinkUrl('');
    setLinkText('');
    setOpen(false);
  }, [editor, linkUrl, linkText, isLinkActive]);

  const handleRemoveLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setLinkUrl('');
    setLinkText('');
    setOpen(false);
  }, [editor]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setLinkUrl('');
    setLinkText('');
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={isLinkActive ? 'default' : 'ghost'}
          size="sm"
          onClick={handleOpen}
          disabled={disabled}
          title={
            isLinkActive
              ? 'Edit link'
              : !editor.state.selection.empty
                ? 'Create link from selected text'
                : 'Add link'
          }
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">
            {isLinkActive ? 'Edit Link' : 'Add Link'}
          </div>
          {!isLinkActive && (
            <div className="space-y-2">
              <Label htmlFor="link-text">Display text</Label>
              <Input
                id="link-text"
                placeholder={
                  editor.state.selection.empty
                    ? 'Link text (optional)'
                    : 'Selected text will be used if empty'
                }
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && linkUrl) {
                    handleAddLink();
                  }
                }}
              />
              {!editor.state.selection.empty && (
                <p className="text-xs text-muted-foreground">
                  Selected text: &quot;
                  {editor.state.doc.textBetween(
                    editor.state.selection.from,
                    editor.state.selection.to
                  )}
                  &quot;
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleAddLink();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              Cancel
            </Button>
            {isLinkActive && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemoveLink}
              >
                Remove
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleAddLink}
              disabled={!linkUrl}
            >
              {isLinkActive ? 'Update Link' : 'Add Link'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
