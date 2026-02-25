'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import 'katex/dist/katex.min.css';
import 'tiptap-extension-resizable-image/styles.css';
import './editor.css';
import { cn } from '@/lib/utils';
import { createEditorExtensions } from './editor-extensions';
import { useEditorActiveState } from './use-editor-active-state';
import { EditorSkeleton } from './editor-skeleton';
import { EditorToolbar } from './toolbar/toolbar';
import { ResizeHandle } from './resize-handle';
import type { MathPopoverHandle } from './popovers/math-popover';

export interface RichTextEditorHandle {
  editor: Editor | null;
  setContent: (html: string) => void;
}

interface RichTextEditorProps {
  initialContent?: string;
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

const RichTextEditor = React.forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor(
  {
    initialContent = '',
    onChange,
    placeholder = 'Start typing...',
    className,
    disabled = false,
    height = '300px',
    minHeight = '200px',
    maxHeight = '400px',
    maxLength,
    showCharacterCount = false,
  },
  ref
) {
  // Resize state
  const [editorHeight, setEditorHeight] = useState(height);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mathPopoverRef = useRef<MathPopoverHandle>(null);

  const { minHeightNum, maxHeightNum } = useMemo(() => {
    const min = parseInt(minHeight.replace('px', ''), 10);
    const max = parseInt(maxHeight.replace('px', ''), 10);
    if (isNaN(min) || isNaN(max))
      return { minHeightNum: 200, maxHeightNum: 400 };
    return { minHeightNum: min, maxHeightNum: max };
  }, [minHeight, maxHeight]);

  const editor = useEditor({
    extensions: createEditorExtensions({
      placeholder,
      maxLength,
      onMathClick: (latex, isBlock, pos) => {
        mathPopoverRef.current?.openForEdit(latex, isBlock, pos);
      },
    }),
    content: initialContent,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
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

  const activeState = useEditorActiveState(editor);

  // Expose imperative handle
  React.useImperativeHandle(
    ref,
    () => ({
      editor,
      setContent: (html: string) => {
        if (editor) {
          editor.commands.setContent(html);
        }
      },
    }),
    [editor]
  );

  // Resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = e.clientY - containerRect.top;
      const clampedHeight = Math.max(
        minHeightNum,
        Math.min(maxHeightNum, newHeight)
      );
      setEditorHeight(`${clampedHeight}px`);
    },
    [isResizing, minHeightNum, maxHeightNum]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'nw-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!editor) {
    return <EditorSkeleton height={editorHeight} className={className} />;
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
        maxHeight,
        overflow: 'hidden',
      }}
    >
      <EditorToolbar
        editor={editor}
        activeState={activeState}
        disabled={disabled}
        mathPopoverRef={mathPopoverRef}
      />

      {/* Editor content — fills remaining space via flex-1 */}
      <div
        className="p-3 overflow-y-auto overflow-x-hidden w-full min-w-0 flex-1 min-h-0"
        style={{
          paddingBottom: showCharacterCount || maxLength ? '80px' : '0px',
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Character count */}
      {(showCharacterCount || maxLength) && (
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

      <ResizeHandle onMouseDown={handleMouseDown} />
    </div>
  );
});

export { RichTextEditor };
