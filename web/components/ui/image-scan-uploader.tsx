'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  Smartphone,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { createClient } from '@/lib/supabase/client';
import { AI_CONSTANTS, QR_SESSION_CONSTANTS } from '@/lib/constants';
import type {
  ExtractedProblemData,
  QRSessionCreateResponse,
} from '@/lib/types';

export interface ExtractionQuota {
  used: number;
  limit: number;
  remaining: number;
}

export interface ImageAttachment {
  file: File;
  saveAsProblemAsset: boolean;
  saveAsSolutionAsset: boolean;
}

interface ImageScanUploaderProps {
  onExtracted: (
    data: ExtractedProblemData,
    imageAttachment?: ImageAttachment
  ) => void;
  onCancel: () => void;
  quota: ExtractionQuota | null;
  onQuotaChange: (quota: ExtractionQuota) => void;
}

type UploaderState = 'initial' | 'preview' | 'result';

const ALLOWED_MIME_TYPES = AI_CONSTANTS.EXTRACTION.ALLOWED_MIME_TYPES;
const MAX_SIZE = AI_CONSTANTS.EXTRACTION.MAX_IMAGE_SIZE;
const COMPRESS_THRESHOLD = AI_CONSTANTS.EXTRACTION.COMPRESS_THRESHOLD;
const COMPRESS_MAX_DIMENSION = AI_CONSTANTS.EXTRACTION.COMPRESS_MAX_DIMENSION;
const COMPRESS_QUALITY = AI_CONSTANTS.EXTRACTION.COMPRESS_QUALITY;

function compressImage(
  file: File
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > COMPRESS_MAX_DIMENSION || height > COMPRESS_MAX_DIMENSION) {
        const scale =
          COMPRESS_MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', COMPRESS_QUALITY);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };
    img.src = objectUrl;
  });
}

export function ImageScanUploader({
  onExtracted,
  onCancel,
  quota,
  onQuotaChange,
}: ImageScanUploaderProps) {
  const [state, setState] = useState<UploaderState>('initial');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] =
    useState<ExtractedProblemData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saveAsProblemAsset, setSaveAsProblemAsset] = useState(false);
  const [saveAsSolutionAsset, setSaveAsSolutionAsset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Desktop detection — QR upload only makes sense on desktop
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // QR state
  const [qrSession, setQrSession] = useState<QRSessionCreateResponse | null>(
    null
  );
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatingRef = useRef(false);

  const stopListening = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }
  }, []);

  const validateAndSetFile = useCallback(
    (file: File) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast.error('Please upload a JPEG, PNG, WebP, or GIF image.');
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error('Image is too large. Maximum size is 5MB.');
        return;
      }

      stopListening();
      setImageFile(file);
      setError(null);

      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
        setState('preview');
      };
      reader.readAsDataURL(file);
    },
    [stopListening]
  );

  // Clipboard paste handler — active in initial state
  useEffect(() => {
    if (state !== 'initial') return;

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
      }
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    };
  }, []);

  const consumeAndLoadImage = useCallback(
    async (sessionId: string) => {
      try {
        const consumeRes = await fetch(
          `/api/qr-sessions/${sessionId}/consume`,
          { method: 'POST' }
        );
        const consumeJson = await consumeRes.json();

        if (!consumeRes.ok) {
          throw new Error(consumeJson.error || 'Failed to retrieve image');
        }

        const { filePath, mimeType } = consumeJson.data;

        const fileRes = await fetch(
          `/api/files/${encodeURIComponent(filePath)}`
        );
        if (!fileRes.ok) {
          throw new Error('Failed to fetch image');
        }

        const blob = await fileRes.blob();
        const fileName = filePath.split('/').pop() || 'photo.jpg';
        const file = new File([blob], fileName, {
          type: mimeType || blob.type,
        });

        validateAndSetFile(file);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load image from phone');
      }
    },
    [validateAndSetFile]
  );

  // Start QR session + Realtime subscription
  const createQrSession = useCallback(async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setQrLoading(true);
    try {
      const res = await fetch('/api/qr-sessions', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create QR session');
      }

      const session: QRSessionCreateResponse = json.data;
      setQrSession(session);

      // Start countdown
      const expiresAt = new Date(session.expiresAt).getTime();
      setQrSecondsLeft(
        Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      );

      countdownRef.current = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.floor((expiresAt - Date.now()) / 1000)
        );
        setQrSecondsLeft(remaining);
        if (remaining <= 0) {
          stopListening();
        }
      }, 1000);

      // Ensure the Realtime connection has the user's JWT.
      // supabase-js only forwards TOKEN_REFRESHED and SIGNED_IN to
      // Realtime, but on page load the auth module fires
      // INITIAL_SESSION which is ignored — so we set it explicitly.
      const supabase = createClient();
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      if (authSession?.access_token) {
        supabase.realtime.setAuth(authSession.access_token);
      }

      // Subscribe to Realtime changes on this session row
      const channel = supabase
        .channel(`qr-session-${session.sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'qr_upload_sessions',
            filter: `id=eq.${session.sessionId}`,
          },
          payload => {
            const newStatus = (payload.new as { status: string }).status;
            if (newStatus === 'uploaded') {
              stopListening();
              consumeAndLoadImage(session.sessionId);
            } else if (newStatus === 'expired') {
              stopListening();
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('Realtime subscription failed:', err);
            // One-shot fallback: single status check after delay
            fallbackRef.current = setTimeout(async () => {
              try {
                const res = await fetch(
                  `/api/qr-sessions/${session.sessionId}/status`
                );
                const json = await res.json();
                if (res.ok && json.data?.status === 'uploaded') {
                  stopListening();
                  await consumeAndLoadImage(session.sessionId);
                }
              } catch {
                // Silent fail on fallback
              }
            }, QR_SESSION_CONSTANTS.REALTIME_FALLBACK_DELAY_MS);
          }
        });

      channelRef.current = channel;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create QR code');
    } finally {
      setQrLoading(false);
      creatingRef.current = false;
    }
  }, [stopListening, consumeAndLoadImage]);

  // Auto-create QR session on mount (desktop only)
  useEffect(() => {
    if (isDesktop) createQrSession();
  }, [isDesktop, createQrSession]);

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
      e.target.value = '';
    },
    [validateAndSetFile]
  );

  const handleExtract = useCallback(async () => {
    if (!imageFile) return;

    setIsExtracting(true);
    setError(null);

    try {
      let base64 = imagePreview!.split(',')[1];
      let mimeType = imageFile.type;

      if (base64.length > COMPRESS_THRESHOLD) {
        const compressed = await compressImage(imageFile);
        base64 = compressed.base64;
        mimeType = compressed.mimeType;
      }

      const res = await fetch('/api/ai/extract-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 429 && json.details?.quota) {
          onQuotaChange(json.details.quota);
        }
        throw new Error(json.error || 'Extraction failed');
      }

      if (json.data?.quota) {
        onQuotaChange(json.data.quota);
      }
      setExtractionResult(json.data);
      setState('result');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      toast.error(err.message || 'Failed to extract problem from image');
    } finally {
      setIsExtracting(false);
    }
  }, [imageFile, imagePreview, onQuotaChange]);

  const reset = useCallback(() => {
    stopListening();
    setImageFile(null);
    setImagePreview(null);
    setExtractionResult(null);
    setError(null);
    setQrSession(null);
    setQrLoading(false);
    setSaveAsProblemAsset(false);
    setSaveAsSolutionAsset(false);
    setState('initial');
    if (isDesktop) setTimeout(() => createQrSession(), 0);
  }, [stopListening, createQrSession, isDesktop]);

  const quotaExhausted = quota !== null && quota.remaining <= 0;

  const quotaIndicator = quota ? (
    <p
      className={`text-xs ${
        quota.remaining <= 0
          ? 'text-rose-600 dark:text-rose-400'
          : quota.remaining <= 2
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      {quota.used} of {quota.limit} daily extractions used
    </p>
  ) : null;

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

  // ── Initial state: dropzone (left) + QR code (right) ──
  if (state === 'initial') {
    const isExpired = qrSession && qrSecondsLeft <= 0;
    const minutes = Math.floor(qrSecondsLeft / 60);
    const seconds = qrSecondsLeft % 60;

    return (
      <div className="space-y-3">
        <div className="flex gap-3">
          {/* Left: dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
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
            <div className="rounded-xl bg-amber-500/10 p-2.5 dark:bg-amber-500/20">
              <Upload className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drop, paste, or browse
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                JPEG, PNG, WebP, GIF &le; 5 MB
              </p>
            </div>
          </div>

          {/* Divider + QR code (desktop only) */}
          {isDesktop && (
            <>
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="h-full w-px bg-gray-200/60 dark:bg-gray-700/40" />
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  or
                </span>
                <div className="h-full w-px bg-gray-200/60 dark:bg-gray-700/40" />
              </div>

              <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200/40 bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 dark:border-gray-700/30 dark:from-gray-800/40 dark:to-gray-700/20">
                {/* QR code area */}
                {qrLoading && !qrSession ? (
                  <div className="flex h-[120px] w-[120px] items-center justify-center">
                    <Spinner className="h-6 w-6 text-gray-400" />
                  </div>
                ) : qrSession ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="rounded-lg bg-white p-1.5 shadow-sm">
                      <QRCodeSVG
                        value={qrSession.uploadUrl}
                        size={108}
                        level="M"
                        includeMargin={false}
                        className={isExpired ? 'opacity-30' : ''}
                      />
                    </div>
                    {isExpired ? (
                      <button
                        type="button"
                        onClick={() => {
                          stopListening();
                          setQrSession(null);
                          createQrSession();
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Refresh code
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                        <Timer className="h-2.5 w-2.5" />
                        {minutes}:{seconds.toString().padStart(2, '0')}
                        <span className="ml-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-[120px] w-[120px] flex-col items-center justify-center gap-2">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={createQrSession}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      Generate QR
                    </button>
                  </div>
                )}

                {/* Instructions */}
                <ol className="space-y-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                  <li className="flex gap-1.5">
                    <span className="font-semibold text-gray-400 dark:text-gray-500">
                      1.
                    </span>
                    Scan the code with your phone camera
                  </li>
                  <li className="flex gap-1.5">
                    <span className="font-semibold text-gray-400 dark:text-gray-500">
                      2.
                    </span>
                    Take a photo of the problem
                  </li>
                  <li className="flex gap-1.5">
                    <span className="font-semibold text-gray-400 dark:text-gray-500">
                      3.
                    </span>
                    It appears here automatically
                  </li>
                </ol>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>{quotaIndicator}</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              stopListening();
              onCancel();
            }}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ── Preview state ──
  if (state === 'preview') {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-gray-200/40 bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 dark:border-gray-700/30 dark:from-gray-800/40 dark:to-gray-700/20">
          <div className="flex items-start gap-4">
            {imagePreview && (
              <Image
                src={imagePreview}
                alt="Preview"
                width={32}
                height={32}
                className="h-32 w-32 rounded-xl border border-gray-200/40 object-cover dark:border-gray-700/30"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <div className="flex items-center gap-4 rounded-xl border border-amber-200/40 bg-amber-50/30 px-3 py-2 dark:border-amber-800/30 dark:bg-amber-950/20">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Save image as:
          </span>
          <div className="flex items-center gap-1.5">
            <Switch
              id="save-problem-asset"
              checked={saveAsProblemAsset}
              onCheckedChange={setSaveAsProblemAsset}
              className="h-4 w-8 [&>span]:h-3.5 [&>span]:w-3.5 data-[state=checked]:[&>span]:translate-x-3.5"
            />
            <Label
              htmlFor="save-problem-asset"
              className="cursor-pointer text-xs text-gray-600 dark:text-gray-400"
            >
              Problem asset
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch
              id="save-solution-asset"
              checked={saveAsSolutionAsset}
              onCheckedChange={setSaveAsSolutionAsset}
              className="h-4 w-8 [&>span]:h-3.5 [&>span]:w-3.5 data-[state=checked]:[&>span]:translate-x-3.5"
            />
            <Label
              htmlFor="save-solution-asset"
              className="cursor-pointer text-xs text-gray-600 dark:text-gray-400"
            >
              Solution asset
            </Label>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>{quotaIndicator}</div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={isExtracting}
              className="text-muted-foreground"
            >
              <X className="mr-1 h-4 w-4" />
              Remove
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExtract}
              disabled={isExtracting || quotaExhausted}
            >
              {isExtracting ? (
                <>
                  <Spinner />
                  Extracting...
                </>
              ) : quotaExhausted ? (
                'Daily limit reached'
              ) : (
                <>
                  <Sparkles className="mr-1 h-4 w-4" />
                  Extract
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Result state ──
  if (state === 'result' && extractionResult) {
    const { confidence } = extractionResult;
    const warnings = confidence.warnings || [];

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-emerald-200/40 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 dark:border-emerald-800/30 dark:from-emerald-950/40 dark:to-emerald-900/20">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Problem extracted
            </span>
          </div>

          {/* Confidence badges */}
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${confidenceColor(confidence.problem_type_confidence)}`}
            >
              Type: {confidence.problem_type_confidence}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${confidenceColor(confidence.content_quality)}`}
            >
              Quality: {confidence.content_quality.replace('_', ' ')}
            </span>
            {confidence.has_math && (
              <span className="inline-flex items-center rounded-full border border-blue-200/50 bg-blue-100/80 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:border-blue-800/40 dark:bg-blue-900/30 dark:text-blue-300">
                Contains equations
              </span>
            )}
          </div>

          {/* Preview of extracted content */}
          <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
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
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
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
            onClick={() => {
              const attachment =
                saveAsProblemAsset || saveAsSolutionAsset
                  ? {
                      file: imageFile!,
                      saveAsProblemAsset,
                      saveAsSolutionAsset,
                    }
                  : undefined;
              onExtracted(extractionResult, attachment);
            }}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Use this extraction
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
