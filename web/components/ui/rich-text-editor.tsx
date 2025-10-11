'use client';

import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Placeholder, CharacterCount } from '@tiptap/extensions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Calculator,
} from 'lucide-react';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
  maxHeight?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
}

const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <Button
    type="button"
    variant={isActive ? 'default' : 'ghost'}
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="h-8 w-8 p-0"
  >
    {children}
  </Button>
);

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  className,
  disabled = false,
  minHeight = '200px',
  maxHeight = '400px',
  maxLength,
  showCharacterCount = false,
}: RichTextEditorProps) {
  const [linkPopoverOpen, setLinkPopoverOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkText, setLinkText] = React.useState('');
  const [mathPopoverOpen, setMathPopoverOpen] = React.useState(false);
  const [mathFormula, setMathFormula] = React.useState('');

  // State to track active formatting states for proper toolbar updates
  const [activeStates, setActiveStates] = React.useState({
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
  });

  // Function to update active states based on editor state
  const updateActiveStates = React.useCallback((editor: any) => {
    if (!editor) return;

    setActiveStates({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      strike: editor.isActive('strike'),
      code: editor.isActive('code'),
      heading1: editor.isActive('heading', { level: 1 }),
      heading2: editor.isActive('heading', { level: 2 }),
      heading3: editor.isActive('heading', { level: 3 }),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
      link: editor.isActive('link'),
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false, // Disable StarterKit's link extension since we're using our own
      }),
      Link.configure({
        openOnClick: false, // Prevent navigation in edit mode
        enableClickSelection: true, // Select link when clicked for editing
        autolink: true, // Disable automatic link detection to prevent extension
        linkOnPaste: true, // Allow pasting URLs as links
        defaultProtocol: 'https', // Default protocol for URLs without one
        protocols: ['http', 'https'], // Only allow these protocols
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        validate: href => {
          // Allow any valid URL
          return /^https?:\/\//.test(href);
        },
      }).extend({
        inclusive: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength || null,
        mode: 'textSize',
      }),
    ],
    content,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();

      // Update active states for toolbar
      updateActiveStates(editor);

      // Always call onChange with the current HTML content
      // The character limit is for user guidance, but we don't want to break HTML structure
      onChange?.(htmlContent);
    },
    onSelectionUpdate: ({ editor }) => {
      // Update active states when selection changes
      updateActiveStates(editor);
    },
    onFocus: ({ editor }) => {
      // Update active states when editor gains focus
      updateActiveStates(editor);
    },
    editorProps: {
      attributes: {
        class:
          'tiptap focus:outline-none w-full max-w-full min-w-0 overflow-wrap-anywhere break-words overflow-x-hidden',
        style: `min-height: ${minHeight}; max-width: 100%; width: 100%; min-width: 0; overflow-wrap: anywhere; word-break: break-word; overflow-x: hidden; box-sizing: border-box;`,
      },
    },
  });

  const handleAddLink = useCallback(() => {
    if (!linkUrl.trim() || !editor) return;

    // Ensure URL has protocol
    let finalUrl = linkUrl.trim();
    if (!finalUrl.match(/^https?:\/\//)) {
      finalUrl = `https://${finalUrl}`;
    }

    if (editor.isActive('link')) {
      // Update existing link using extension command
      editor.chain().focus().setLink({ href: finalUrl }).run();
    } else if (editor.state.selection.empty) {
      // No text selected, insert text and then make it a link
      const displayText = linkText.trim() || finalUrl;

      // Insert the text first
      editor.chain().focus().insertContent(displayText).run();

      // Then select the inserted text and make it a link
      const currentPos = editor.state.selection.from;
      const startPos = currentPos - displayText.length;
      editor
        .chain()
        .focus()
        .setTextSelection({ from: startPos, to: currentPos })
        .setLink({ href: finalUrl })
        .run();
    } else {
      // Text is selected, replace it with a link
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      );
      const displayText = linkText.trim() || selectedText;

      // Replace selected text with new text
      editor
        .chain()
        .focus()
        .insertContentAt(editor.state.selection, displayText)
        .run();

      // Then select the inserted text and make it a link
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
    setLinkPopoverOpen(false);
  }, [editor, linkUrl, linkText]);

  const handleRemoveLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  const handleLinkButtonClick = useCallback(() => {
    if (activeStates.link && editor) {
      // If we're on a link, populate the dialog with existing link data
      const { href } = editor.getAttributes('link');
      setLinkUrl(href || '');
      setLinkText(''); // Don't pre-fill text when editing existing link
      setLinkPopoverOpen(true);
    } else {
      // If text is selected, pre-populate the display text field
      if (!editor?.state.selection.empty && editor) {
        const selectedText = editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        );
        setLinkText(selectedText);
      } else {
        setLinkText('');
      }
      setLinkUrl('');
      setLinkPopoverOpen(true);
    }
  }, [editor, activeStates.link]);

  const handleAddMath = useCallback(() => {
    if (mathFormula.trim()) {
      // Insert as inline code with math formatting
      editor
        ?.chain()
        .focus()
        .insertContent(`<code class="math">${mathFormula}</code>`)
        .run();
      setMathFormula('');
      setMathPopoverOpen(false);
    }
  }, [editor, mathFormula]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Initialize active states when editor is ready
  useEffect(() => {
    if (editor) {
      updateActiveStates(editor);
    }
  }, [editor, updateActiveStates]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        'rich-text-editor-container border border-input rounded-md bg-background w-full max-w-full min-w-0',
        className
      )}
      style={{
        maxHeight: maxHeight,
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/50">
        {/* Text formatting */}
        <div className="flex items-center gap-1">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={activeStates.bold}
            disabled={disabled}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={activeStates.italic}
            disabled={disabled}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={activeStates.strike}
            disabled={disabled}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={activeStates.code}
            disabled={disabled}
            title="Inline code"
          >
            <Code className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <div className="flex items-center gap-1">
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={activeStates.heading1}
            disabled={disabled}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={activeStates.heading2}
            disabled={disabled}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={activeStates.heading3}
            disabled={disabled}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists and quotes */}
        <div className="flex items-center gap-1">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={activeStates.bulletList}
            disabled={disabled}
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={activeStates.orderedList}
            disabled={disabled}
            title="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={activeStates.blockquote}
            disabled={disabled}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Advanced features */}
        <div className="flex items-center gap-1">
          <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant={activeStates.link ? 'default' : 'ghost'}
                size="sm"
                onClick={handleLinkButtonClick}
                disabled={disabled}
                title={
                  activeStates.link
                    ? 'Edit link'
                    : !editor?.state.selection.empty
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
                  {activeStates.link ? 'Edit Link' : 'Add Link'}
                </div>
                {!activeStates.link && (
                  <div className="space-y-2">
                    <Label htmlFor="link-text">Display text</Label>
                    <Input
                      id="link-text"
                      placeholder={
                        editor?.state.selection.empty
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
                    {!editor?.state.selection.empty && editor && (
                      <p className="text-xs text-muted-foreground">
                        Selected text: "
                        {editor.state.doc.textBetween(
                          editor.state.selection.from,
                          editor.state.selection.to
                        )}
                        "
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
                    onClick={() => {
                      setLinkPopoverOpen(false);
                      setLinkUrl('');
                      setLinkText('');
                    }}
                  >
                    Cancel
                  </Button>
                  {activeStates.link && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        handleRemoveLink();
                        setLinkPopoverOpen(false);
                        setLinkUrl('');
                        setLinkText('');
                      }}
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
                    {activeStates.link ? 'Update Link' : 'Add Link'}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover open={mathPopoverOpen} onOpenChange={setMathPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Add math formula"
                className="h-8 w-8 p-0"
              >
                <Calculator className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="math-formula">Math Formula</Label>
                  <Input
                    id="math-formula"
                    placeholder="E = mc², x² + y² = z², ∫f(x)dx"
                    value={mathFormula}
                    onChange={e => setMathFormula(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleAddMath();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter mathematical expressions using standard notation
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMathPopoverOpen(false);
                      setMathFormula('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddMath}
                    disabled={!mathFormula.trim()}
                  >
                    Add Formula
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* History */}
        <div className="flex items-center gap-1">
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo() || disabled}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo() || disabled}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>
        </div>
      </div>

      {/* Editor content */}
      <div
        className="p-3 overflow-y-auto overflow-x-hidden w-full min-w-0"
        style={{
          minHeight: minHeight,
          maxHeight: `calc(${maxHeight} - 120px)`, // Subtract toolbar and character count height
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          position: 'relative',
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Character count */}
      {(showCharacterCount || maxLength) && editor && (
        <div className="flex justify-between items-center px-3 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
          <span>
            {editor.storage.characterCount.characters()}{' '}
            {maxLength ? `of ${maxLength}` : ''} text characters
          </span>
          {maxLength &&
            editor.storage.characterCount.characters() > maxLength && (
              <span className="text-red-500 font-medium">
                Text limit exceeded
              </span>
            )}
        </div>
      )}
    </div>
  );
}
