'use client';

import { useTranslations } from 'next-intl';
import { Eye, Heart, Copy } from 'lucide-react';
import { ProfileAvatar } from '@/components/profile-avatar';
import { DiscoveryCard } from '@/components/discovery-card';
import type { ProblemSetCard } from '@/lib/types';
import { formatCount } from '@/lib/format-utils';

interface CreatorProfile {
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface AggregateStats {
  total_views: number;
  total_likes: number;
  total_copies: number;
}

interface CreatorProfileClientProps {
  profile: CreatorProfile;
  sets: ProblemSetCard[];
  aggregateStats: AggregateStats;
}

export default function CreatorProfileClient({
  profile,
  sets,
  aggregateStats,
}: CreatorProfileClientProps) {
  const t = useTranslations('Creator');
  return (
    <div className="section-container">
      {/* Profile header */}
      <div className="mb-8 rounded-2xl border border-purple-200/40 bg-gradient-to-br from-purple-50/50 to-amber-50/30 p-6 dark:border-purple-800/30 dark:from-gray-800/60 dark:to-gray-800/30">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <ProfileAvatar
            avatarUrl={profile.avatar_url}
            firstName={profile.display_name}
            size="lg"
          />

          <div className="min-w-0 flex-1">
            <h1 className="heading-lg">{profile.display_name}</h1>
            {profile.username && (
              <p className="text-sm text-purple-600 dark:text-purple-400">
                @{profile.username}
              </p>
            )}
            {profile.bio && (
              <p className="mt-2 text-body-sm text-muted-foreground">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Aggregate stats */}
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="font-medium tabular-nums">
              {formatCount(aggregateStats.total_views)}
            </span>
            <span>{t('views')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="font-medium tabular-nums">
              {formatCount(aggregateStats.total_likes)}
            </span>
            <span>{t('likes')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Copy className="h-4 w-4" />
            <span className="font-medium tabular-nums">
              {formatCount(aggregateStats.total_copies)}
            </span>
            <span>{t('copies')}</span>
          </div>
        </div>
      </div>

      {/* Listed sets */}
      <h2 className="heading-sm mb-4">
        {t('listedSets', { count: sets.length })}
      </h2>

      {sets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sets.map(set => (
            <DiscoveryCard
              key={set.id}
              set={set}
              fromHref={`/creators/${profile.username}`}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">{t('noListedSets')}</p>
        </div>
      )}
    </div>
  );
}
