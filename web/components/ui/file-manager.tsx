'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadFiles } from '@/lib/storage/client';

interface FileAsset {
  path: string;
  name: string;
  uploading?: boolean;
  error?: string;
}

interface FileManagerProps {
  role: 'problem' | 'solution';
  stagingId: string;
  initialFiles?: FileAsset[];
  onFilesChange: (files: FileAsset[]) => void;
  className?: string;
}

export default function FileManager({
  role,
  stagingId,
  initialFiles = [],
  onFilesChange,
  className = '',
}: FileManagerProps) {
  const [files, setFiles] = useState<FileAsset[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialFiles prop with local state
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  // Helper to update files and notify parent
  const updateFiles = (newFiles: FileAsset[]) => {
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  // Handle file upload
  const handleFileUpload = async (selectedFiles: FileList) => {
    if (!selectedFiles.length) return;

    setUploading(true);
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
      setError(`Files too large: ${oversizedFiles.join(', ')}. Maximum file size is 10MB.`);
      setUploading(false);
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
      const uploadedPaths = await uploadFiles(selectedFiles, role, stagingId);

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
    } catch (err: any) {
      setError(err.message ?? 'Upload failed');

      // Remove failed uploading files - keep only the original files
      updateFiles(currentFiles);
    } finally {
      setUploading(false);
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
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
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
            className="mx-auto h-12 w-12 text-gray-400"
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
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Click to upload
            </span>{' '}
            or drag and drop
          </div>
          <p className="text-xs text-gray-500">
            Images and PDFs up to 10MB each
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`file-${index}-${file.name}`}
                className="flex items-center justify-between bg-gray-50 rounded-md p-3"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {file.name
                      .toLowerCase()
                      .match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                      <svg
                        className="h-8 w-8 text-green-600"
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
                        className="h-8 w-8 text-red-600"
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
                        className="h-8 w-8 text-gray-600"
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
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    {file.uploading ? (
                      <p className="text-xs text-blue-600">Uploading...</p>
                    ) : file.error ? (
                      <p className="text-xs text-red-600">{file.error}</p>
                    ) : (
                      <p className="text-xs text-gray-500">Ready</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {file.path && !file.uploading && (
                    <a
                      href={`/api/files/${encodeURIComponent(file.path)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file)}
                    disabled={file.uploading}
                    className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploading && (
        <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-3">
          Uploading files...
        </div>
      )}
    </div>
  );
}
