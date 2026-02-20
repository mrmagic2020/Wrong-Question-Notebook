'use client';

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
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'blob:' ? url : null;
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Profile avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={text}>{initials}</span>
      )}
    </span>
  );
}
