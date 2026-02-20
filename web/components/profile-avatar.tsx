'use client';

import Image from 'next/image';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { px: 32, text: 'text-xs' },
  md: { px: 40, text: 'text-sm' },
  lg: { px: 80, text: 'text-xl' },
};

function safeSrc(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'blob:') return null;
    // Return the URL parser's normalized serialization rather than the original
    // string. The URL constructor percent-encodes HTML metacharacters such as
    // `"`, `<`, and `>`, preventing them from reaching any HTML rendering sink.
    return parsed.href;
  } catch {
    return null;
  }
}

export function ProfileAvatar({
  avatarUrl,
  firstName,
  lastName,
  email,
  size = 'sm',
}: ProfileAvatarProps) {
  const { px, text } = sizeMap[size];

  const initials =
    firstName || lastName
      ? `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
      : (email?.[0]?.toUpperCase() ?? '?');

  const src = avatarUrl ? safeSrc(avatarUrl) : null;

  return (
    <span
      className="rounded-full bg-amber-500 dark:bg-amber-600 text-white font-semibold flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: px, height: px }}
    >
      {src ? (
        <Image
          src={src}
          alt="Profile avatar"
          width={px}
          height={px}
          className="object-cover"
          unoptimized={src.startsWith('blob:')}
        />
      ) : (
        <span className={text}>{initials}</span>
      )}
    </span>
  );
}
