'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AI_CONSTANTS } from '@/lib/constants';
import type { ExtractedProblemData } from '@/lib/types';

interface ImageScanUploaderProps {
  onExtracted: (data: ExtractedProblemData) => void;
  onCancel: () => void;
}

type UploaderState = 'dropzone' | 'preview' | 'result';

const ALLOWED_MIME_TYPES = AI_CONSTANTS.EXTRACTION.ALLOWED_MIME_TYPES;
const MAX_SIZE = AI_CONSTANTS.EXTRACTION.MAX_IMAGE_SIZE;

export function ImageScanUploader({
  onExtracted,
  onCancel,
}: ImageScanUploaderProps) {
  const [state, setState] = useState<UploaderState>('dropzone');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] =
    useState<ExtractedProblemData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = useCallback((file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Image is too large. Maximum size is 5MB.');
      return;
    }

    setImageFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = e => {
      setImagePreview(e.target?.result as string);
      setState('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  // Clipboard paste handler
  useEffect(() => {
    if (state !== 'dropzone') return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) validateAndSetFile(file);
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [state, validateAndSetFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSetFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [validateAndSetFile]
  );

  const handleExtract = useCallback(async () => {
    if (!imageFile) return;

    setIsExtracting(true);
    setError(null);

    try {
      const buffer = await imageFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const res = await fetch('/api/ai/extract-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: imageFile.type,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Extraction failed');
      }

      setExtractionResult(json.data);
      setState('result');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      toast.error(err.message || 'Failed to extract problem from image');
    } finally {
      setIsExtracting(false);
    }
  }, [imageFile]);

  const reset = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setExtractionResult(null);
    setError(null);
    setState('dropzone');
  }, []);

  const confidenceColor = (
    level: 'high' | 'medium' | 'low' | 'clear' | 'partially_unclear' | 'unclear'
  ) => {
    switch (level) {
      case 'high':
      case 'clear':
        return 'bg-emerald-100/80 text-emerald-800 border-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/40';
      case 'medium':
      case 'partially_unclear':
        return 'bg-amber-100/80 text-amber-800 border-amber-200/50 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40';
      case 'low':
      case 'unclear':
        return 'bg-rose-100/80 text-rose-800 border-rose-200/50 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/40';
    }
  };

  // Dropzone state
  if (state === 'dropzone') {
    return (
      <div className="space-y-3">
        <div
          onDrop={handleDrop}
          onDragOver={e => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragOver
              ? 'border-amber-400 bg-amber-50/50 dark:border-amber-500 dark:bg-amber-950/20'
              : 'border-gray-300/60 dark:border-gray-700/40 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/10'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 dark:bg-amber-500/20 p-3">
              <Upload className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drop an image here, paste from clipboard, or click to browse
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                JPEG, PNG, WebP, or GIF up to 5MB
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Preview state
  if (state === 'preview') {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-gray-200/40 dark:border-gray-700/30 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/40 dark:to-gray-700/20 p-4">
          <div className="flex items-start gap-4">
            {imagePreview && (
              <Image
                src={imagePreview}
                alt="Preview"
                width={32}
                height={32}
                className="h-32 w-32 rounded-xl object-cover border border-gray-200/40 dark:border-gray-700/30"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {imageFile?.name}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ''}
              </p>
              {error && (
                <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={isExtracting}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExtract}
            disabled={isExtracting}
          >
            {isExtracting ? (
              <>
                <Spinner />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                Extract
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Result state
  if (state === 'result' && extractionResult) {
    const { confidence } = extractionResult;
    const warnings = confidence.warnings || [];

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-emerald-200/40 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Problem extracted
            </span>
          </div>

          {/* Confidence badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${confidenceColor(confidence.problem_type_confidence)}`}
            >
              Type: {confidence.problem_type_confidence}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${confidenceColor(confidence.content_quality)}`}
            >
              Quality: {confidence.content_quality.replace('_', ' ')}
            </span>
            {confidence.has_math && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border bg-blue-100/80 text-blue-800 border-blue-200/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/40">
                Contains math
              </span>
            )}
          </div>

          {/* Preview of extracted content */}
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <span className="font-medium">Title:</span> {extractionResult.title}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Type:</span>{' '}
            {extractionResult.problem_type === 'mcq'
              ? 'Multiple Choice'
              : extractionResult.problem_type === 'short'
                ? 'Short Answer'
                : 'Extended Response'}
            {extractionResult.mcq_choices &&
              ` (${extractionResult.mcq_choices.length} choices)`}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {warnings.map((warning, i) => (
                <div
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-muted-foreground"
          >
            Try again
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onExtracted(extractionResult)}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Use this extraction
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
