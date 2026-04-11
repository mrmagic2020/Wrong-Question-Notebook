import { createServiceClient } from '@/lib/supabase-utils';
import { notFound } from 'next/navigation';
import CreatorProfileClient from './creator-profile-client';
import type { Metadata } from 'next';
import type { ProblemSetCard } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('first_name, last_name, bio')
    .eq('username', username)
    .maybeSingle();

  if (!profile) return { title: 'Creator Not Found' };

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    username;
  const description = profile.bio
    ? profile.bio.substring(0, 160)
    : `Problem sets by ${displayName}`;

  return {
    title: `@${username} – Wrong Question Notebook`,
    description,
    openGraph: {
      title: `@${username} – Wrong Question Notebook`,
      description,
      url: `https://wqn.magicworks.app/creators/${username}`,
      siteName: 'Wrong Question Notebook',
    },
    alternates: {
      canonical: `https://wqn.magicworks.app/creators/${username}`,
    },
  };
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const serviceClient = createServiceClient();

  // Fetch the user profile
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('id, username, first_name, last_name, avatar_url, bio')
    .eq('username', username)
    .maybeSingle();

  if (!profile) notFound();

  // Fetch their listed public sets with stats
  const { data: rawSets } = await serviceClient
    .from('problem_sets')
    .select(
      `
      id, name, description, is_smart, created_at,
      subjects!inner (name, color, icon),
      problem_set_stats!inner (
        view_count, unique_view_count, like_count, copy_count,
        problem_count, ranking_score
      )
    `
    )
    .eq('user_id', profile.id)
    .eq('sharing_level', 'public')
    .eq('is_listed', true)
    .order('created_at', { ascending: false });

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.username ||
    'Anonymous';

  const sets: ProblemSetCard[] = (rawSets || []).map((set: any) => ({
    id: set.id,
    name: set.name,
    description: set.description,
    subject_name: set.subjects?.name || 'Unknown',
    subject_color: set.subjects?.color || null,
    subject_icon: set.subjects?.icon || null,
    problem_count: set.problem_set_stats?.problem_count || 0,
    is_smart: set.is_smart,
    owner: {
      username: profile.username,
      display_name: displayName,
      avatar_url: profile.avatar_url,
    },
    stats: {
      view_count: set.problem_set_stats?.view_count || 0,
      unique_view_count: set.problem_set_stats?.unique_view_count || 0,
      like_count: set.problem_set_stats?.like_count || 0,
      copy_count: set.problem_set_stats?.copy_count || 0,
      problem_count: set.problem_set_stats?.problem_count || 0,
      ranking_score: set.problem_set_stats?.ranking_score || 0,
    },
    created_at: set.created_at,
  }));

  // Aggregate stats
  const aggregateStats = sets.reduce(
    (acc, s) => ({
      total_views: acc.total_views + s.stats.view_count,
      total_likes: acc.total_likes + s.stats.like_count,
      total_copies: acc.total_copies + s.stats.copy_count,
    }),
    { total_views: 0, total_likes: 0, total_copies: 0 }
  );

  return (
    <CreatorProfileClient
      profile={{
        username: profile.username,
        display_name: displayName,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      }}
      sets={sets}
      aggregateStats={aggregateStats}
    />
  );
}
