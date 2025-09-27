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
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 text-center text-gray-500 bg-gray-50">
            <p className="text-sm">Image preview unavailable</p>
            <a
              href={getFileUrl(asset.path)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm"
            >
              View image
            </a>
          </div>
          <div className="p-2 bg-gray-50 border-t">
            <p className="text-xs text-gray-600 truncate">
              {getFileName(asset.path)}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
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
            className="w-full h-auto max-h-64 object-contain bg-gray-50"
            unoptimized
            onError={() => setImageError(true)}
          />
        </a>
        <div className="p-2 bg-gray-50 border-t">
          <p className="text-xs text-gray-600 truncate">
            {getFileName(asset.path)}
          </p>
          <p className="text-xs text-blue-600 mt-1">Click to view full size</p>
        </div>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
              <span className="text-red-600 text-xs font-bold">PDF</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 truncate">
                {getFileName(asset.path)}
              </p>
              <p className="text-xs text-gray-500">PDF Document</p>
            </div>
          </div>
          <a
            href={getFileUrl(asset.path)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            View PDF
          </a>
        </div>
      </div>
    );
  }

  // Fallback for unknown file types
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-600 text-xs">📄</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {getFileName(asset.path)}
            </p>
            <p className="text-xs text-gray-500">File</p>
          </div>
        </div>
        <a
          href={getFileUrl(asset.path)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
        >
          View File
        </a>
      </div>
    </div>
  );
}
