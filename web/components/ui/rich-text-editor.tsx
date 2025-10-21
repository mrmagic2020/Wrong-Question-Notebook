'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Mathematics } from '@tiptap/extension-mathematics';
import Typography from '@tiptap/extension-typography';
import { Placeholder, CharacterCount } from '@tiptap/extensions';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
} from 'lucide-react';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  height?: string;
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
  height = '300px',
  minHeight = '200px',
  maxHeight = '400px',
  maxLength,
  showCharacterCount = false,
}: RichTextEditorProps) {
  const [linkPopoverOpen, setLinkPopoverOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkText, setLinkText] = React.useState('');
  const [mathDialogOpen, setMathDialogOpen] = React.useState(false);
  const [mathLatex, setMathLatex] = React.useState('');
  const [mathIsBlock, setMathIsBlock] = React.useState(false);
  const [mathEditingPos, setMathEditingPos] = React.useState<number | null>(
    null
  );
  const [mathPreview, setMathPreview] = React.useState<string>('');

  // Resize functionality
  const [editorHeight, setEditorHeight] = useState<string>(height);
  const [isResizing, setIsResizing] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState<number>(60); // Default toolbar height
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

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
    subscript: false,
    superscript: false,
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
      subscript: editor.isActive('subscript'),
      superscript: editor.isActive('superscript'),
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
      Subscript,
      Superscript,
      Mathematics.configure({
        inlineOptions: {
          onClick: (node, pos) => {
            setMathLatex(node.attrs.latex || '');
            setMathIsBlock(false);
            setMathEditingPos(pos);
            generatePreview(node.attrs.latex || '', false);
            setMathDialogOpen(true);
          },
        },
        blockOptions: {
          onClick: (node, pos) => {
            setMathLatex(node.attrs.latex || '');
            setMathIsBlock(true);
            setMathEditingPos(pos);
            generatePreview(node.attrs.latex || '', true);
            setMathDialogOpen(true);
          },
        },
        katexOptions: {
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
    parseOptions: {
      preserveWhitespace: 'full',
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

  // Generate LaTeX preview
  const generatePreview = useCallback((latex: string, isBlock: boolean) => {
    if (!latex.trim()) {
      setMathPreview('');
      return;
    }

    try {
      const html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: isBlock,
        output: 'html',
      });
      setMathPreview(html);
    } catch {
      setMathPreview('');
    }
  }, []);

  const handleMathButtonClick = useCallback(() => {
    setMathLatex('');
    setMathIsBlock(false);
    setMathEditingPos(null);
    setMathPreview('');
    setMathDialogOpen(true);
  }, []);

  const handleInsertMath = useCallback(() => {
    if (!mathLatex.trim() || !editor) return;

    if (mathEditingPos !== null) {
      // Update existing math - need to delete old and insert new if type changed
      const currentNode = editor.state.doc.nodeAt(mathEditingPos);
      const wasBlock = currentNode?.type.name === 'blockMath';

      if (wasBlock === mathIsBlock) {
        // Same type, just update
        if (mathIsBlock) {
          editor
            .chain()
            .setNodeSelection(mathEditingPos)
            .updateBlockMath({ latex: mathLatex })
            .run();
        } else {
          editor
            .chain()
            .setNodeSelection(mathEditingPos)
            .updateInlineMath({ latex: mathLatex })
            .run();
        }
      } else {
        // Type changed, delete old and insert new
        if (wasBlock) {
          editor
            .chain()
            .setNodeSelection(mathEditingPos)
            .deleteBlockMath()
            .run();
        } else {
          editor
            .chain()
            .setNodeSelection(mathEditingPos)
            .deleteInlineMath()
            .run();
        }

        // Insert new with correct type
        if (mathIsBlock) {
          editor.chain().focus().insertBlockMath({ latex: mathLatex }).run();
        } else {
          editor.chain().focus().insertInlineMath({ latex: mathLatex }).run();
        }
      }
    } else {
      // Insert new math
      if (mathIsBlock) {
        editor.chain().focus().insertBlockMath({ latex: mathLatex }).run();
      } else {
        editor.chain().focus().insertInlineMath({ latex: mathLatex }).run();
      }
    }

    setMathLatex('');
    setMathIsBlock(false);
    setMathEditingPos(null);
    setMathPreview('');
    setMathDialogOpen(false);
  }, [editor, mathLatex, mathIsBlock, mathEditingPos]);

  const handleRemoveMath = useCallback(() => {
    if (!editor || mathEditingPos === null) return;

    if (mathIsBlock) {
      editor.chain().setNodeSelection(mathEditingPos).deleteBlockMath().run();
    } else {
      editor.chain().setNodeSelection(mathEditingPos).deleteInlineMath().run();
    }

    setMathLatex('');
    setMathIsBlock(false);
    setMathEditingPos(null);
    setMathPreview('');
    setMathDialogOpen(false);
  }, [editor, mathIsBlock, mathEditingPos]);

  // Resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      try {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newHeight = e.clientY - containerRect.top;

        // Convert minHeight and maxHeight to numbers for comparison
        const minHeightNum = parseInt(minHeight.replace('px', ''), 10);
        const maxHeightNum = parseInt(maxHeight.replace('px', ''), 10);

        // Validate parsed values
        if (isNaN(minHeightNum) || isNaN(maxHeightNum)) {
          console.warn('Invalid minHeight or maxHeight values');
          return;
        }

        // Clamp the height between min and max
        const clampedHeight = Math.max(
          minHeightNum,
          Math.min(maxHeightNum, newHeight)
        );
        setEditorHeight(`${clampedHeight}px`);
      } catch (error) {
        console.error('Error during resize:', error);
      }
    },
    [isResizing, minHeight, maxHeight]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners for resize
  useEffect(() => {
    if (isResizing) {
      try {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'nw-resize';
        document.body.style.userSelect = 'none';
      } catch (error) {
        console.error('Error adding resize event listeners:', error);
      }
    } else {
      try {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      } catch (error) {
        console.error('Error removing resize event listeners:', error);
      }
    }

    return () => {
      try {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      } catch (error) {
        console.error('Error cleaning up resize event listeners:', error);
      }
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Update preview when latex or block mode changes
  useEffect(() => {
    generatePreview(mathLatex, mathIsBlock);
  }, [mathLatex, mathIsBlock, generatePreview]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Ensure all event listeners are cleaned up
      try {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      } catch (error) {
        console.error('Error cleaning up resize event listeners:', error);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  // Measure toolbar height dynamically using ResizeObserver
  useEffect(() => {
    const measureToolbarHeight = () => {
      if (toolbarRef.current) {
        const height = toolbarRef.current.offsetHeight;
        setToolbarHeight(height);
      }
    };

    // Initial measurement with delay to ensure toolbar is fully rendered
    const initialTimeout = setTimeout(measureToolbarHeight, 100);

    // Use ResizeObserver to track toolbar height changes
    let resizeObserver: ResizeObserver | null = null;

    if (toolbarRef.current && typeof ResizeObserver !== 'undefined') {
      try {
        resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            const height = entry.contentRect.height;
            setToolbarHeight(height);
          }
        });

        resizeObserver.observe(toolbarRef.current);
      } catch (error) {
        // Fallback if ResizeObserver fails
        console.warn(
          `ResizeObserver not supported, falling back to window resize listener (error: ${error})`
        );
      }
    }

    // Also use MutationObserver to watch for changes in toolbar content
    let mutationObserver: MutationObserver | null = null;

    if (toolbarRef.current && typeof MutationObserver !== 'undefined') {
      try {
        mutationObserver = new MutationObserver(() => {
          // Small delay to ensure layout has updated after DOM changes
          setTimeout(measureToolbarHeight, 10);
        });

        mutationObserver.observe(toolbarRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style'],
        });
      } catch (error) {
        // Fallback if MutationObserver fails
        console.warn(
          `MutationObserver not supported, falling back to window resize listener (error: ${error})`
        );
      }
    }

    // Fallback: re-measure on window resize
    const handleResize = () => {
      // Small delay to ensure layout has updated
      setTimeout(measureToolbarHeight, 10);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(initialTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'rich-text-editor-container border border-input rounded-md bg-background w-full max-w-full min-w-0',
        className
      )}
      style={{
        height: editorHeight,
        maxHeight: maxHeight,
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Toolbar */}
      <div
        ref={toolbarRef}
        className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/50"
      >
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
          <MenuButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={activeStates.subscript}
            disabled={disabled}
            title="Subscript"
          >
            <SubscriptIcon className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={activeStates.superscript}
            disabled={disabled}
            title="Superscript"
          >
            <SuperscriptIcon className="h-4 w-4" />
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
          <Popover open={mathDialogOpen} onOpenChange={setMathDialogOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Add math formula"
                className="h-8 w-8 p-0"
                onClick={handleMathButtonClick}
              >
                <Calculator className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="start">
              <div className="space-y-4">
                <div className="text-sm font-medium">
                  {mathEditingPos !== null
                    ? 'Edit Math Formula'
                    : 'Add Math Formula'}
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="math-latex">LaTeX Formula</Label>
                    <Input
                      id="math-latex"
                      placeholder="E = mc^2, \\frac{a}{b}, \\sum_{i=1}^{n} i"
                      value={mathLatex}
                      onChange={e => setMathLatex(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleInsertMath();
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use LaTeX notation. Press Ctrl+Enter to insert.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="math-block"
                      checked={mathIsBlock}
                      onCheckedChange={checked =>
                        setMathIsBlock(checked === true)
                      }
                    />
                    <Label htmlFor="math-block" className="text-sm">
                      Block formula (displayed on its own line)
                    </Label>
                  </div>

                  {mathLatex.trim() && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Preview:
                      </Label>
                      <div className="p-3 border rounded-md bg-muted/50 min-h-[60px] flex items-center justify-center">
                        {mathPreview ? (
                          <div
                            className={mathIsBlock ? 'block' : 'inline'}
                            dangerouslySetInnerHTML={{ __html: mathPreview }}
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Invalid LaTeX syntax
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMathDialogOpen(false);
                      setMathLatex('');
                      setMathIsBlock(false);
                      setMathEditingPos(null);
                    }}
                  >
                    Cancel
                  </Button>
                  {mathEditingPos !== null && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveMath}
                    >
                      Remove
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleInsertMath}
                    disabled={!mathLatex.trim()}
                  >
                    {mathEditingPos !== null
                      ? 'Update Formula'
                      : 'Insert Formula'}
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
          height: `calc(${editorHeight} - ${toolbarHeight + 35}px)`, // Subtract dynamic toolbar height
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          position: 'relative',
          paddingBottom: showCharacterCount || maxLength ? '80px' : '0px', // Increased bottom padding for character count
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Character count */}
      {(showCharacterCount || maxLength) && editor && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-3 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
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

      {/* Resize handle */}
      <div
        ref={resizeRef}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none"
        onMouseDown={handleMouseDown}
        role="button"
        tabIndex={0}
        aria-label="Resize editor"
        title="Drag to resize editor"
        style={{
          background:
            'linear-gradient(-45deg, transparent 0%, transparent 30%, #ccc 30%, #ccc 40%, transparent 40%, transparent 60%, #ccc 60%, #ccc 70%, transparent 70%)',
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsResizing(true);
          }
        }}
      />
    </div>
  );
}
