'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Eye, Heart, Copy } from 'lucide-react';
import { ProfileAvatar } from '@/components/profile-avatar';
import type { ProblemSetCard } from '@/lib/types';
import { stripHtml } from '@/lib/html-sanitizer';
import { cn } from '@/lib/utils';

// Color mapping for subject badges
const SUBJECT_COLORS: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  purple:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  orange:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface DiscoveryCardProps {
  set: ProblemSetCard;
  fromHref?: string;
}

export function DiscoveryCard({
  set,
  fromHref = '/discover',
}: DiscoveryCardProps) {
  const router = useRouter();
  const t = useTranslations('Discover');
  const subjectColorClass =
    SUBJECT_COLORS[set.subject_color || 'amber'] || SUBJECT_COLORS.amber;
  const plain = set.description ? stripHtml(set.description) : null;
  const descriptionPreview = plain
    ? plain.substring(0, 120) + (plain.length > 120 ? '...' : '')
    : null;

  const cardHref = `/problem-sets/${set.id}?from=${encodeURIComponent(fromHref)}`;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(cardHref)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(cardHref);
        }
      }}
      className="group flex h-[220px] cursor-pointer flex-col rounded-2xl border border-amber-200/40 bg-gradient-to-br from-white to-amber-50/30 p-5 transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 dark:border-gray-700/40 dark:from-gray-800/60 dark:to-gray-800/30"
    >
      {/* Top: subject badge, title, description (grows to fill) */}
      <div className="flex-1">
        <div className="mb-3 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              subjectColorClass
            )}
          >
            {set.subject_name}
          </span>
        </div>

        <h3 className="mb-1 text-lg font-semibold text-gray-900 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-400">
          {set.name}
        </h3>

        {descriptionPreview && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {descriptionPreview}
          </p>
        )}
      </div>

      {/* Bottom: owner + stats (always pinned to bottom) */}
      <div className="mt-auto pt-3">
        <div className="mb-3 flex items-center gap-2">
          <ProfileAvatar
            avatarUrl={set.owner.avatar_url}
            firstName={set.owner.display_name}
            size="xs"
          />
          {set.owner.username ? (
            <Link
              href={`/creators/${set.owner.username}`}
              onClick={e => e.stopPropagation()}
              className="text-xs text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 transition-colors"
            >
              @{set.owner.username}
            </Link>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {set.owner.display_name}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {t('problemCount', { count: set.problem_count })}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatCount(set.stats.view_count)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {formatCount(set.stats.like_count)}
          </span>
          <span className="flex items-center gap-1">
            <Copy className="h-3.5 w-3.5" />
            {formatCount(set.stats.copy_count)}
          </span>
        </div>
      </div>
    </div>
  );
}
