'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Asset {
  path: string;
  kind?: 'image' | 'pdf';
}

interface AssetPreviewProps {
  asset: Asset;
}

export default function AssetPreview({ asset }: AssetPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const getFileUrl = (path: string) => {
    // Construct the URL for the file
    return `/api/files/${encodeURIComponent(path)}`;
  };

  const getFileName = (path: string) => {
    return path.split('/').pop() || 'Unknown file';
  };

  const isImage =
    asset.kind === 'image' ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(asset.path);
  const isPdf = asset.kind === 'pdf' || /\.pdf$/i.test(asset.path);

  if (isImage) {
    if (imageError) {
      return (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="p-4 text-center text-muted-foreground bg-muted">
            <p className="text-sm">Image preview unavailable</p>
            <a
              href={getFileUrl(asset.path)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline text-sm hover:text-primary/80 transition-colors"
            >
              View image
            </a>
          </div>
          <div className="p-2 bg-muted border-t border-border">
            <p className="text-xs text-muted-foreground truncate">
              {getFileName(asset.path)}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <a
          href={getFileUrl(asset.path)}
          target="_blank"
          rel="noopener noreferrer"
          className="block cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Image
            src={getFileUrl(asset.path)}
            alt={getFileName(asset.path)}
            width={800}
            height={256}
            className="w-full h-auto max-h-64 object-contain bg-muted"
            unoptimized
            onError={() => setImageError(true)}
          />
        </a>
        <div className="p-2 bg-muted border-t border-border">
          <p className="text-xs text-muted-foreground truncate">
            {getFileName(asset.path)}
          </p>
          <p className="text-xs text-primary mt-1">Click to view full size</p>
        </div>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="border border-border rounded-lg p-4 bg-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-950/20 rounded flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-xs font-bold">
                PDF
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground truncate">
                {getFileName(asset.path)}
              </p>
              <p className="text-xs text-muted-foreground">PDF Document</p>
            </div>
          </div>
          <a
            href={getFileUrl(asset.path)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors"
          >
            View PDF
          </a>
        </div>
      </div>
    );
  }

  // Fallback for unknown file types
  return (
    <div className="border border-border rounded-lg p-4 bg-muted">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
            <span className="text-muted-foreground text-xs">📄</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground truncate">
              {getFileName(asset.path)}
            </p>
            <p className="text-xs text-muted-foreground">File</p>
          </div>
        </div>
        <a
          href={getFileUrl(asset.path)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded hover:bg-secondary/80 transition-colors"
        >
          View File
        </a>
      </div>
    </div>
  );
}
