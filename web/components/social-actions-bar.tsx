'use client';

import { useTranslations } from 'next-intl';
import { Eye, Copy, Share2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { LikeButton } from './like-button';
import { FavouriteButton } from './favourite-button';
import { useSocialActions } from '@/lib/hooks/useSocialActions';
import type { ProblemSetStats, UserSocialState } from '@/lib/types';
import { toast } from 'sonner';
import { useState } from 'react';
import { ReportDialog } from './report-dialog';

interface SocialActionsBarProps {
  problemSetId: string;
  isShared: boolean;
  isAuthenticated: boolean;
  initialStats?: ProblemSetStats | null;
  initialSocialState?: UserSocialState | null;
  isOwner?: boolean;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function SocialActionsBar({
  problemSetId,
  isShared,
  isAuthenticated,
  initialStats,
  initialSocialState,
  isOwner,
}: SocialActionsBarProps) {
  const t = useTranslations('Social');
  const {
    stats,
    liked,
    favourited,
    toggleLike,
    toggleFavourite,
    likeLoading,
    favouriteLoading,
  } = useSocialActions({
    problemSetId,
    initialStats,
    initialSocialState,
    isAuthenticated,
    trackView: isShared,
  });

  const [reportOpen, setReportOpen] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/problem-sets/${problemSetId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('failedToCopyLink'));
    }
  };

  if (!isShared) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 rounded-xl bg-amber-50/50 px-2 py-1 dark:bg-gray-800/30">
        {/* View count */}
        <Tooltip content={t('views')}>
          <div className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="text-sm tabular-nums">
              {formatCount(stats.view_count)}
            </span>
          </div>
        </Tooltip>

        <div className="h-4 w-px bg-border" />

        {/* Like button */}
        <LikeButton
          liked={liked}
          count={stats.like_count}
          onToggle={toggleLike}
          isAuthenticated={isAuthenticated}
          loading={likeLoading}
        />

        <div className="h-4 w-px bg-border" />

        {/* Copy count */}
        <Tooltip content={t('copies')}>
          <div className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground">
            <Copy className="h-4 w-4" />
            <span className="text-sm tabular-nums">
              {formatCount(stats.copy_count)}
            </span>
          </div>
        </Tooltip>

        <div className="h-4 w-px bg-border" />

        {/* Favourite button */}
        <FavouriteButton
          favourited={favourited}
          onToggle={toggleFavourite}
          isAuthenticated={isAuthenticated}
          loading={favouriteLoading}
        />

        <div className="h-4 w-px bg-border" />

        {/* Share button */}
        <Tooltip content={t('copyLink')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-muted-foreground hover:bg-amber-100/60 hover:text-foreground dark:hover:bg-amber-900/20"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </Tooltip>

        {/* Report button (not for owner) */}
        {isAuthenticated && !isOwner && (
          <>
            <div className="h-4 w-px bg-border" />
            <Tooltip content={t('reportThisSet')}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReportOpen(true)}
                className="text-muted-foreground hover:bg-amber-100/60 hover:text-destructive dark:hover:bg-amber-900/20"
              >
                <Flag className="h-4 w-4" />
              </Button>
            </Tooltip>
          </>
        )}
      </div>

      {/* Report dialog */}
      {isAuthenticated && !isOwner && (
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          problemSetId={problemSetId}
        />
      )}
    </>
  );
}
