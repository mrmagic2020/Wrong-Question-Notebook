'use client';

import Link from 'next/link';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Badge } from '@/components/ui/badge';
import { OwnerProfile } from '@/lib/types';

interface UserProfileCardProps {
  profile: OwnerProfile;
}

function getGenderLabel(gender: string | null): string | null {
  if (!gender || gender === 'prefer_not_to_say') return null;
  switch (gender) {
    case 'male':
      return 'Male';
    case 'female':
      return 'Female';
    case 'other':
      return 'Other';
    default:
      return null;
  }
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.username ||
    'Anonymous';
  const genderLabel = getGenderLabel(profile.gender);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link
          href={`/creators/${profile.username}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 pl-1 pr-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:border-amber-300/60 dark:hover:border-amber-700/50 transition-colors"
        >
          <ProfileAvatar
            avatarUrl={profile.avatar_url}
            firstName={profile.first_name || profile.username}
            lastName={profile.last_name}
            size="sm"
          />
          <span className="font-medium">@{profile.username}</span>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 rounded-2xl border-amber-200/40 dark:border-amber-800/30">
        <div className="flex gap-3">
          <ProfileAvatar
            avatarUrl={profile.avatar_url}
            firstName={profile.first_name || profile.username}
            lastName={profile.last_name}
            size="md"
          />
          <div className="space-y-1 flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground">
              {displayName}
            </h4>
            {profile.username && (
              <p className="text-xs text-muted-foreground">
                @{profile.username}
              </p>
            )}
            {profile.bio && (
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {profile.bio}
              </p>
            )}
            {genderLabel && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1">
                {genderLabel}
              </Badge>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
