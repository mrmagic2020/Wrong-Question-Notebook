import { Camera } from 'lucide-react';
import Image from 'next/image';

interface ScreenshotFrameProps {
  src?: string;
  darkSrc?: string;
  alt: string;
  placeholderLabel: string;
  accentColor?: string;
}

export function ScreenshotFrame({
  src,
  darkSrc,
  alt,
  placeholderLabel,
  accentColor = 'amber',
}: ScreenshotFrameProps) {
  const placeholderGradients: Record<string, string> = {
    amber:
      'from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20',
    rose: 'from-rose-50 to-pink-50/50 dark:from-rose-950/30 dark:to-pink-950/20',
    blue: 'from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20',
    green:
      'from-green-50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/20',
    orange:
      'from-orange-50 to-amber-50/50 dark:from-orange-950/30 dark:to-amber-950/20',
  };

  const iconColors: Record<string, string> = {
    amber: 'text-amber-400 dark:text-amber-600',
    rose: 'text-rose-400 dark:text-rose-600',
    blue: 'text-blue-400 dark:text-blue-600',
    green: 'text-green-400 dark:text-green-600',
    orange: 'text-orange-400 dark:text-orange-600',
  };

  return (
    <div className="features-screenshot-frame">
      <div className="features-screenshot-topbar">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>
      </div>
      {src ? (
        <>
          <Image
            src={src}
            alt={alt}
            width={800}
            height={500}
            className={`w-full h-auto ${darkSrc ? 'dark:hidden' : ''}`}
          />
          {darkSrc && (
            <Image
              src={darkSrc}
              alt={alt}
              width={800}
              height={500}
              className="w-full h-auto hidden dark:block"
            />
          )}
        </>
      ) : (
        <div
          className={`features-screenshot-placeholder bg-gradient-to-br ${placeholderGradients[accentColor] || placeholderGradients.amber}`}
        >
          <Camera
            className={`w-10 h-10 ${iconColors[accentColor] || iconColors.amber}`}
          />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
            {placeholderLabel}
          </span>
        </div>
      )}
    </div>
  );
}
