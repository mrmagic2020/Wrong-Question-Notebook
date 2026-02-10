'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadFiles } from '@/lib/storage/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FileAsset {
  path: string;
  name: string;
  uploading?: boolean;
  error?: string;
}

interface FileManagerProps {
  role: 'problem' | 'solution';
  problemId: string;
  isEditMode: boolean;
  initialFiles?: FileAsset[];
  onFilesChange: (files: FileAsset[]) => void;
  onInsertImage?: (path: string, name: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function FileManager({
  role,
  problemId,
  isEditMode,
  initialFiles = [],
  onFilesChange,
  onInsertImage,
  className = '',
  disabled = false,
}: FileManagerProps) {
  const [files, setFiles] = useState<FileAsset[]>(initialFiles);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to check if a file is an image
  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  // Sync initialFiles prop with local state
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  // Helper to update files and notify parent
  const updateFiles = (newFiles: FileAsset[]) => {
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  // Helper to update database assets in edit mode
  const updateDatabaseAssets = async (newFiles: FileAsset[]) => {
    if (!isEditMode || !problemId) return;

    try {
      const assetData = newFiles.map(file => ({
        path: file.path,
      }));

      const payload: Partial<{
        assets: Array<{ path: string }>;
        solution_assets: Array<{ path: string }>;
      }> = {};
      if (role === 'problem') {
        payload.assets = assetData;
      } else if (role === 'solution') {
        payload.solution_assets = assetData;
      }

      const response = await fetch(`/api/problems/${problemId}/assets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(
          'Failed to update database assets:',
          errorData.error || 'Unknown error'
        );
      }
    } catch (error) {
      console.warn('Failed to update database assets:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (selectedFiles: FileList) => {
    if (!selectedFiles.length) return;

    // Check if component is disabled
    if (disabled) {
      setError('File upload is disabled. Please expand the form first.');
      return;
    }

    // Validate problemId before attempting upload
    if (!problemId || problemId.trim() === '' || problemId === 'disabled') {
      setError(
        'Cannot upload files: Problem ID is not available. Please expand the form first.'
      );
      return;
    }

    setError(null);

    // Validate file sizes before upload
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles: string[] = [];

    Array.from(selectedFiles).forEach(file => {
      if (file.size > maxSize) {
        oversizedFiles.push(file.name);
      }
    });

    if (oversizedFiles.length > 0) {
      setError(
        `Files too large: ${oversizedFiles.join(', ')}. Maximum file size is 10MB.`
      );
      return;
    }

    // Store current files before adding uploading ones
    const currentFiles = files;

    // Add uploading files to state immediately for better UX
    const uploadingFiles: FileAsset[] = Array.from(selectedFiles).map(file => ({
      path: '',
      name: file.name,
      uploading: true,
    }));

    const filesWithUploading = [...currentFiles, ...uploadingFiles];
    updateFiles(filesWithUploading);

    try {
      const uploadedPaths = await uploadFiles(selectedFiles, role, problemId);

      // Create final files array with uploaded files
      const finalFiles: FileAsset[] = [
        // Keep existing files (remove any uploading placeholders)
        ...currentFiles,
        // Add successfully uploaded files
        ...uploadedPaths.map((uploadedPath, index) => ({
          path: uploadedPath,
          name: uploadingFiles[index].name,
        })),
      ];

      updateFiles(finalFiles);

      // Update database in edit mode
      await updateDatabaseAssets(finalFiles);
    } catch (err: any) {
      setError(err.message ?? 'Upload failed');

      // Remove failed uploading files - keep only the original files
      updateFiles(currentFiles);
    } finally {
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle individual file deletion
  const handleDeleteFile = async (fileToDelete: FileAsset) => {
    if (fileToDelete.uploading) return; // Can't delete while uploading

    try {
      // Call API to delete the file (works for both staging and permanent files)
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fileToDelete.path }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete file');
      }

      // Remove from local state
      const updatedFiles = files.filter(f => f.path !== fileToDelete.path);
      updateFiles(updatedFiles);

      // Update database in edit mode
      await updateDatabaseAssets(updatedFiles);
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete file');
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    handleFileUpload(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled
            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 cursor-not-allowed'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
        }`}
        onDrop={disabled ? undefined : handleDrop}
        onDragOver={disabled ? undefined : handleDragOver}
        onClick={disabled ? undefined : () => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={e => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          accept="image/*,.pdf"
        />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {disabled ? (
              <span className="font-medium text-gray-400 dark:text-gray-500">
                Expand the form to upload files
              </span>
            ) : (
              <>
                <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                  Click to upload
                </span>{' '}
                or drag and drop
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {disabled
              ? 'Form must be expanded first'
              : 'Images and PDFs up to 10MB each'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md p-3">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`file-${index}-${file.name}`}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 rounded-md p-3"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {file.name
                      .toLowerCase()
                      .match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                      <svg
                        className="h-8 w-8 text-green-600 dark:text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : file.name.toLowerCase().endsWith('.pdf') ? (
                      <svg
                        className="h-8 w-8 text-red-600 dark:text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-8 w-8 text-gray-600 dark:text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    {file.uploading ? (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Uploading...
                      </p>
                    ) : file.error ? (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {file.error}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Ready
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {file.path && !file.uploading && (
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <Link
                        href={`/api/files/${encodeURIComponent(file.path)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </Link>
                    </Button>
                  )}
                  {file.path &&
                    !file.uploading &&
                    isImageFile(file.name) &&
                    onInsertImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onInsertImage(file.path, file.name)}
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                        title="Insert image into editor"
                      >
                        Insert
                      </Button>
                    )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file)}
                    disabled={file.uploading}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:text-gray-400 dark:disabled:text-gray-500"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
