'use client';

import { useCallback, useRef, useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  CropIcon,
  ImagePlus,
  Send,
  RotateCcw,
  NotebookPen,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { QR_SESSION_CONSTANTS } from '@/lib/constants';

type UploadState = 'capture' | 'crop' | 'uploading' | 'success' | 'error';

interface MobileUploaderProps {
  sessionId: string;
  token: string;
}

/** Extract the cropped region from an <img> element and return it as a Blob. */
function getCroppedBlob(
  image: HTMLImageElement,
  pixelCrop: PixelCrop
): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(pixelCrop.width * scaleX);
  canvas.height = Math.round(pixelCrop.height * scaleY);

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    image,
    Math.round(pixelCrop.x * scaleX),
    Math.round(pixelCrop.y * scaleY),
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Failed to crop image')),
      'image/jpeg',
      0.92
    );
  });
}

export function MobileUploader({ sessionId, token }: MobileUploaderProps) {
  const [state, setState] = useState<UploadState>('capture');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;

      // Validate type
      if (
        !(
          QR_SESSION_CONSTANTS.ALLOWED_MIME_TYPES as readonly string[]
        ).includes(selected.type)
      ) {
        setErrorMessage(QR_SESSION_CONSTANTS.ERRORS.INVALID_FILE_TYPE);
        setState('error');
        return;
      }

      // Validate size
      if (selected.size > QR_SESSION_CONSTANTS.MAX_FILE_SIZE) {
        setErrorMessage(QR_SESSION_CONSTANTS.ERRORS.FILE_TOO_LARGE);
        setState('error');
        return;
      }

      setFile(selected);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
        const fullCrop: Crop = {
          unit: '%',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        };
        setCrop(fullCrop);
        setCompletedCrop(undefined);
        setState('crop');
      };
      reader.readAsDataURL(selected);

      // Reset input for re-selection
      e.target.value = '';
    },
    []
  );

  const handleRetake = useCallback(() => {
    setFile(null);
    setPreview(null);
    setErrorMessage('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setState('capture');
  }, []);

  const handleUpload = useCallback(
    async (skipCrop: boolean) => {
      if (!file || !preview) return;

      setState('uploading');

      try {
        let uploadBlob: Blob = file;

        if (!skipCrop && completedCrop && imgRef.current) {
          uploadBlob = await getCroppedBlob(imgRef.current, completedCrop);
        }

        const formData = new FormData();
        formData.append('file', uploadBlob, file.name);

        const res = await fetch(
          `/api/qr-upload/${sessionId}?token=${encodeURIComponent(token)}`,
          { method: 'POST', body: formData }
        );

        if (res.ok) {
          setState('success');
          return;
        }

        const json = await res.json().catch(() => null);
        const message =
          json?.error || 'Something went wrong. Please try again.';

        if (res.status === 410) {
          setErrorMessage(QR_SESSION_CONSTANTS.ERRORS.SESSION_EXPIRED);
        } else if (res.status === 409) {
          setErrorMessage(QR_SESSION_CONSTANTS.ERRORS.SESSION_ALREADY_USED);
        } else if (res.status === 403) {
          setErrorMessage(QR_SESSION_CONSTANTS.ERRORS.INVALID_TOKEN);
        } else {
          setErrorMessage(message);
        }
        setState('error');
      } catch {
        setErrorMessage('Network error. Check your connection and try again.');
        setState('error');
      }
    },
    [file, preview, sessionId, token, completedCrop]
  );

  // -- Capture state --
  if (state === 'capture') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-8 text-center">
          {/* Branding */}
          <div className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/20">
              <NotebookPen className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Wrong Question Notebook
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Take a photo of the problem to send to your desktop
            </p>
          </div>

          {/* Capture buttons */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={QR_SESSION_CONSTANTS.ALLOWED_MIME_TYPES.join(',')}
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={libraryInputRef}
              type="file"
              accept={QR_SESSION_CONSTANTS.ALLOWED_MIME_TYPES.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              size="lg"
              className="w-full rounded-xl bg-amber-600 px-7 py-6 text-base font-medium text-white shadow-md hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="mr-2 h-5 w-5" />
              Take Photo
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full rounded-xl px-7 py-6 text-base font-medium"
              onClick={() => libraryInputRef.current?.click()}
            >
              <ImagePlus className="mr-2 h-5 w-5" />
              Choose from Library
            </Button>
          </div>

          {/* Privacy note */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Your photo is stored securely in your account only</span>
          </div>
        </div>
      </div>
    );
  }

  // -- Crop state --
  if (state === 'crop' && preview) {
    return (
      <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="px-6 pb-2 pt-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <CropIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Drag edges to crop your photo
          </div>
        </div>

        {/* Crop area */}
        <div className="flex flex-1 items-center justify-center overflow-auto px-4 py-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={preview}
              alt="Photo to crop"
              className="max-h-[60dvh] w-auto rounded-lg"
              onLoad={(e) => {
                const img = e.currentTarget;
                setCompletedCrop({
                  unit: 'px',
                  x: 0,
                  y: 0,
                  width: img.width,
                  height: img.height,
                });
              }}
            />
          </ReactCrop>
        </div>

        {/* Bottom controls */}
        <div className="space-y-3 px-6 pb-8 pt-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl py-5"
              onClick={handleRetake}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl bg-amber-600 py-5 text-white shadow-md hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
              disabled={!completedCrop?.width || !completedCrop?.height}
              onClick={() => handleUpload(false)}
            >
              <Send className="mr-2 h-4 w-4" />
              Crop & Send
            </Button>
          </div>

          <button
            type="button"
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => handleUpload(true)}
          >
            Skip cropping &amp; send original
          </button>
        </div>
      </div>
    );
  }

  // -- Uploading state --
  if (state === 'uploading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6 text-center">
          <Spinner className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sending to your notebook...
          </p>
        </div>
      </div>
    );
  }

  // -- Success state --
  if (state === 'success') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Photo sent!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You can close this tab. The image will appear on your desktop
              shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -- Error state --
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
          <AlertTriangle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {errorMessage}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={handleRetake}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
