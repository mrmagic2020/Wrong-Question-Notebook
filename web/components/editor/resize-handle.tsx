import React from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

export function ResizeHandle({ onMouseDown }: ResizeHandleProps) {
  return (
    <div
      className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none"
      onMouseDown={onMouseDown}
      role="button"
      tabIndex={0}
      aria-label="Resize editor"
      title="Drag to resize editor"
    >
      <svg
        className="w-full h-full text-gray-400 dark:text-gray-600"
        viewBox="0 0 16 16"
        fill="none"
      >
        <line
          x1="14"
          y1="2"
          x2="2"
          y2="14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="14"
          y1="7"
          x2="7"
          y2="14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="14"
          y1="12"
          x2="12"
          y2="14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
