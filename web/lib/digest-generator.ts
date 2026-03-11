/**
 * Core digest generation logic for the insights system.
 *
 * Aggregates error-categorisation data, scores weak spots, calls Gemini for
 * narrative generation, and persists the resulting InsightDigest.
 */

import { GoogleGenAI } from '@google/genai';
import { createServiceClient } from '@/lib/supabase-utils';
import { INSIGHT_CONSTANTS, ERROR_CATEGORY_VALUES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type {
  ErrorAggregationRow,
  ErrorBroadCategory,
  InsightDigest,
  TopicCluster,
  UncategorisedAttempt,
  WeakSpot,
} from '@/lib/types';

// =====================================================
// Types local to the generator
// =====================================================

interface ClusterAccumulator {
  topic_label: string;
  topic_label_normalised: string;
  subject_id: string;
  subject_name: string;
  rows: ErrorAggregationRow[];
  problem_ids: Set<string>;
  wrong_count: number;
  needs_review_count: number;
  mastered_count: number;
  error_type_counts: Record<string, number>;
}

interface WeakSpotCandidate extends ClusterAccumulator {
  score: number;
  trend_phrase: string;
  dominant_error_type: string;
}

interface GeminiNarrativeResponse {
  headline: string;
  error_pattern_summary: string;
  subject_health: Record<string, string>;
  weak_spot_trends: Array<{
    topic_label_normalised: string;
    trend_phrase: string;
    dominant_error_type: string;
  }>;
  topic_cluster_narratives: Record<
    string,
    Array<{ topic_label_normalised: string; narrative: string }>
  >;
  progress_narratives: Record<string, string>;
}

// =====================================================
// Main entry point
// =====================================================

/**
 * Generate a full insight digest for a user.
 *
 * Returns `null` when the user has fewer than
 * `MIN_PROBLEMS_FOR_INSIGHTS` categorised attempts.
 */
export async function generateDigestForUser(
  userId: string
): Promise<InsightDigest | null> {
  const supabase = createServiceClient();

  // 1. Fetch aggregation data via RPC
  const { data: rows, error: rpcError } = await supabase.rpc(
    'get_error_aggregation_data',
    { p_user_id: userId }
  );

  if (rpcError) {
    logger.error('Failed to fetch error aggregation data', rpcError, {
      component: 'DigestGenerator',
      action: 'generateDigestForUser',
      userId,
    });
    throw new Error(`RPC error: ${rpcError.message}`);
  }

  const aggregationRows = (rows ?? []) as ErrorAggregationRow[];

  // 2. Check minimum data threshold
  if (aggregationRows.length < INSIGHT_CONSTANTS.MIN_PROBLEMS_FOR_INSIGHTS) {
    return null;
  }

  // 3. Aggregate data
  const clusters = buildClusters(aggregationRows);
  const clustersBySubject = groupClustersBySubject(clusters);
  const errorDistribution = computeErrorDistribution(aggregationRows);
  const errorDistributionBySubject =
    computeErrorDistributionBySubject(aggregationRows);

  // 4. Rank weak spots
  const weakSpotCandidates = rankWeakSpots(clusters);
  const topWeakSpots = weakSpotCandidates.slice(
    0,
    INSIGHT_CONSTANTS.MAX_WEAK_SPOTS_OVERVIEW
  );

  // 5. Build raw aggregation data for AI context
  const rawAggregationData: Record<string, unknown> = {
    total_categorisations: aggregationRows.length,
    unique_problems: new Set(aggregationRows.map(r => r.problem_id)).size,
    clusters_count: clusters.length,
    subjects: Object.keys(clustersBySubject),
    error_distribution: errorDistribution,
    error_distribution_by_subject: errorDistributionBySubject,
    weak_spots: topWeakSpots.map(ws => ({
      topic_label: ws.topic_label,
      subject_name: ws.subject_name,
      problem_count: ws.problem_ids.size,
      wrong_count: ws.wrong_count,
      needs_review_count: ws.needs_review_count,
      mastered_count: ws.mastered_count,
      score: ws.score,
      dominant_error_type: ws.dominant_error_type,
    })),
    clusters_by_subject: Object.fromEntries(
      Object.entries(clustersBySubject).map(([subjectId, subjectClusters]) => [
        subjectId,
        subjectClusters.map(c => ({
          topic_label: c.topic_label,
          problem_count: c.problem_ids.size,
          wrong_count: c.wrong_count,
          needs_review_count: c.needs_review_count,
          mastered_count: c.mastered_count,
        })),
      ])
    ),
  };

  // 6. Call Gemini for narrative generation
  const narratives = await generateNarratives(rawAggregationData);

  // 7. Merge AI narratives with computed data
  const weakSpots: WeakSpot[] = topWeakSpots.map(ws => {
    const aiTrend = narratives.weak_spot_trends.find(
      t => t.topic_label_normalised === ws.topic_label_normalised
    );
    return {
      topic_label: ws.topic_label,
      subject_id: ws.subject_id,
      subject_name: ws.subject_name,
      problem_count: ws.problem_ids.size,
      trend_phrase: aiTrend?.trend_phrase ?? ws.trend_phrase,
      dominant_error_type:
        aiTrend?.dominant_error_type ?? ws.dominant_error_type,
      problem_ids: Array.from(ws.problem_ids),
    };
  });

  const topicClusters: Record<string, TopicCluster[]> = {};
  for (const [subjectId, subjectClusters] of Object.entries(
    clustersBySubject
  )) {
    const aiNarratives = narratives.topic_cluster_narratives[subjectId] ?? [];
    topicClusters[subjectId] = subjectClusters.map(c => {
      const aiNarrative = aiNarratives.find(
        n => n.topic_label_normalised === c.topic_label_normalised
      );
      return {
        label: c.topic_label,
        problem_count: c.problem_ids.size,
        wrong_count: c.wrong_count,
        needs_review_count: c.needs_review_count,
        mastered_count: c.mastered_count,
        narrative: aiNarrative?.narrative ?? '',
        problem_ids: Array.from(c.problem_ids),
      };
    });
  }

  const now = new Date().toISOString();

  // 8. Insert digest into the database
  const { data: inserted, error: insertError } = await supabase
    .from('insight_digests')
    .insert({
      user_id: userId,
      generated_at: now,
      headline: narratives.headline,
      error_pattern_summary: narratives.error_pattern_summary,
      subject_health: narratives.subject_health,
      weak_spots: weakSpots,
      topic_clusters: topicClusters,
      progress_narratives: narratives.progress_narratives,
      raw_aggregation_data: rawAggregationData,
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Failed to insert insight digest', insertError, {
      component: 'DigestGenerator',
      action: 'insertDigest',
      userId,
    });
    throw new Error(`Insert error: ${insertError.message}`);
  }

  // 9. Clean up old digests
  await pruneOldDigests(userId);

  return inserted as InsightDigest;
}

// =====================================================
// Backfill categorisation for uncategorised attempts
// =====================================================

/**
 * Categorise uncategorised attempts for a user using Gemini.
 * Returns the number of successfully categorised attempts.
 */
export async function categoriseUncategorisedAttempts(
  userId: string,
  limit: number = INSIGHT_CONSTANTS.BACKFILL_BATCH_SIZE
): Promise<number> {
  const supabase = createServiceClient();

  const { data: attempts, error } = await supabase.rpc(
    'get_uncategorised_attempts',
    { p_user_id: userId, p_limit: limit }
  );

  if (error) {
    logger.error('Failed to fetch uncategorised attempts', error, {
      component: 'DigestGenerator',
      action: 'categoriseUncategorisedAttempts',
      userId,
    });
    return 0;
  }

  const uncategorised = (attempts ?? []) as UncategorisedAttempt[];
  if (uncategorised.length === 0) return 0;

  let successCount = 0;

  for (const attempt of uncategorised) {
    try {
      const result = await categoriseSingleAttempt(userId, attempt);
      if (result) successCount++;
    } catch (err) {
      logger.error('Failed to categorise attempt', err, {
        component: 'DigestGenerator',
        action: 'categoriseSingleAttempt',
        userId,
        attemptId: attempt.attempt_id,
      });
    }
  }

  return successCount;
}

/**
 * Categorise a single attempt using Gemini and insert the result.
 */
export async function categoriseSingleAttempt(
  userId: string,
  attempt: UncategorisedAttempt
): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY not configured, skipping categorisation', {
      component: 'DigestGenerator',
      action: 'categoriseSingleAttempt',
    });
    return null;
  }

  const genai = new GoogleGenAI({ apiKey });

  const userPrompt = buildCategorisationPrompt(attempt);

  const categorisationSchema = {
    type: 'object' as const,
    properties: {
      broad_category: {
        type: 'string' as const,
        enum: [...ERROR_CATEGORY_VALUES],
      },
      granular_tag: { type: 'string' as const },
      topic_label: { type: 'string' as const },
      confidence: { type: 'number' as const },
      reasoning: { type: 'string' as const },
    },
    required: [
      'broad_category',
      'granular_tag',
      'topic_label',
      'confidence',
      'reasoning',
    ] as const,
  };

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: CATEGORISATION_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: categorisationSchema,
    },
  });

  const text = response.text;
  if (!text) return null;

  const parsed = JSON.parse(text) as {
    broad_category: ErrorBroadCategory;
    granular_tag: string;
    topic_label: string;
    confidence: number;
    reasoning: string;
  };

  // Normalise topic label: lowercase, trim, collapse whitespace
  const topicLabelNormalised = parsed.topic_label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  const supabase = createServiceClient();

  const { data: inserted, error: insertError } = await supabase
    .from('error_categorisations')
    .upsert(
      {
        attempt_id: attempt.attempt_id,
        problem_id: attempt.problem_id,
        subject_id: attempt.subject_id,
        user_id: userId,
        broad_category: parsed.broad_category,
        granular_tag: parsed.granular_tag,
        topic_label: parsed.topic_label,
        topic_label_normalised: topicLabelNormalised,
        ai_confidence: parsed.confidence,
        ai_reasoning: parsed.reasoning,
        is_user_override: false,
      },
      { onConflict: 'attempt_id', ignoreDuplicates: true }
    )
    .select()
    .maybeSingle();

  if (insertError) {
    logger.error('Failed to insert error categorisation', insertError, {
      component: 'DigestGenerator',
      action: 'insertCategorisation',
      userId,
      attemptId: attempt.attempt_id,
    });
    return null;
  }

  // If null, the attempt was already categorised (duplicate ignored)
  return (inserted as Record<string, unknown>) ?? {};
}

// =====================================================
// Aggregation helpers
// =====================================================

function buildClusters(rows: ErrorAggregationRow[]): ClusterAccumulator[] {
  const clusterMap = new Map<string, ClusterAccumulator>();

  for (const row of rows) {
    const key = row.topic_label_normalised;
    let cluster = clusterMap.get(key);

    if (!cluster) {
      cluster = {
        topic_label: row.topic_label,
        topic_label_normalised: row.topic_label_normalised,
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        rows: [],
        problem_ids: new Set(),
        wrong_count: 0,
        needs_review_count: 0,
        mastered_count: 0,
        error_type_counts: {},
      };
      clusterMap.set(key, cluster);
    }

    cluster.rows.push(row);
    cluster.problem_ids.add(row.problem_id);

    switch (row.problem_status) {
      case 'wrong':
        cluster.wrong_count++;
        break;
      case 'needs_review':
        cluster.needs_review_count++;
        break;
      case 'mastered':
        cluster.mastered_count++;
        break;
    }

    cluster.error_type_counts[row.broad_category] =
      (cluster.error_type_counts[row.broad_category] ?? 0) + 1;
  }

  return Array.from(clusterMap.values());
}

function groupClustersBySubject(
  clusters: ClusterAccumulator[]
): Record<string, ClusterAccumulator[]> {
  const grouped: Record<string, ClusterAccumulator[]> = {};
  for (const cluster of clusters) {
    if (!grouped[cluster.subject_id]) {
      grouped[cluster.subject_id] = [];
    }
    grouped[cluster.subject_id].push(cluster);
  }
  return grouped;
}

function computeErrorDistribution(
  rows: ErrorAggregationRow[]
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const row of rows) {
    dist[row.broad_category] = (dist[row.broad_category] ?? 0) + 1;
  }
  return dist;
}

function computeErrorDistributionBySubject(
  rows: ErrorAggregationRow[]
): Record<string, Record<string, number>> {
  const dist: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!dist[row.subject_id]) {
      dist[row.subject_id] = {};
    }
    dist[row.subject_id][row.broad_category] =
      (dist[row.subject_id][row.broad_category] ?? 0) + 1;
  }
  return dist;
}

// =====================================================
// Weak spot scoring
// =====================================================

function rankWeakSpots(clusters: ClusterAccumulator[]): WeakSpotCandidate[] {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  return clusters
    .map(cluster => {
      const total =
        cluster.wrong_count +
        cluster.needs_review_count +
        cluster.mastered_count;
      if (total === 0) return null;

      // Recency score (weight 0.3): proportion of attempts in last 7 days
      const recentCount = cluster.rows.filter(r => {
        const attemptTime = new Date(r.attempt_created_at).getTime();
        return now - attemptTime < sevenDaysMs;
      }).length;
      const recencyScore = total > 0 ? recentCount / total : 0;

      // Severity score (weight 0.35): proportion of wrong status
      const severityScore = cluster.wrong_count / total;

      // Volume score (weight 0.15): log-scaled problem count
      const volumeScore = Math.log2(cluster.problem_ids.size + 1) / 5;

      // Trend score (weight 0.2): are recent attempts worse than older ones?
      const trendScore = computeTrendScore(cluster);

      const score =
        recencyScore * 0.3 +
        severityScore * 0.35 +
        Math.min(volumeScore, 1) * 0.15 +
        trendScore * 0.2;

      // Determine dominant error type
      const dominantErrorType = getDominantErrorType(cluster.error_type_counts);

      // Generate trend phrase
      const trendPhrase = generateTrendPhrase(trendScore, recencyScore);

      return {
        ...cluster,
        score,
        trend_phrase: trendPhrase,
        dominant_error_type: dominantErrorType,
      } as WeakSpotCandidate;
    })
    .filter((c): c is WeakSpotCandidate => c !== null)
    .sort((a, b) => b.score - a.score);
}

function computeTrendScore(cluster: ClusterAccumulator): number {
  const sorted = [...cluster.rows].sort(
    (a, b) =>
      new Date(a.attempt_created_at).getTime() -
      new Date(b.attempt_created_at).getTime()
  );

  if (sorted.length < 2) return 0.5;

  const midpoint = Math.floor(sorted.length / 2);
  const olderHalf = sorted.slice(0, midpoint);
  const newerHalf = sorted.slice(midpoint);

  const statusToScore = (status: string): number => {
    switch (status) {
      case 'mastered':
        return 1;
      case 'needs_review':
        return 0.5;
      case 'wrong':
        return 0;
      default:
        return 0.5;
    }
  };

  const olderAvg =
    olderHalf.reduce((sum, r) => sum + statusToScore(r.problem_status), 0) /
    olderHalf.length;
  const newerAvg =
    newerHalf.reduce((sum, r) => sum + statusToScore(r.problem_status), 0) /
    newerHalf.length;

  // If newer average is worse (lower), trend score is higher (indicating decline)
  const decline = olderAvg - newerAvg;
  // Normalise to 0-1 range: -1 (big improvement) -> 0, +1 (big decline) -> 1
  return Math.max(0, Math.min(1, (decline + 1) / 2));
}

function getDominantErrorType(errorTypeCounts: Record<string, number>): string {
  let maxCount = 0;
  let dominant = 'unknown';
  for (const [type, count] of Object.entries(errorTypeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = type;
    }
  }
  return dominant;
}

function generateTrendPhrase(trendScore: number, recencyScore: number): string {
  if (trendScore > 0.7) return 'declining — recent attempts are worse';
  if (trendScore > 0.55) return 'slightly declining';
  if (trendScore < 0.3) return 'improving';
  if (trendScore < 0.45) return 'slightly improving';
  if (recencyScore > 0.5) return 'active but stalled';
  return 'stable';
}

// =====================================================
// Gemini narrative generation
// =====================================================

const NARRATIVE_SYSTEM_PROMPT = `You are a study advisor for a high school student. Based on the following data about their recent study performance, write a concise, specific, and actionable study briefing. Use a warm but direct tone — be honest about weaknesses while acknowledging progress. Do not use generic advice. Every observation should reference specific topics and specific patterns from their data.`;

const NARRATIVE_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    headline: { type: 'string' as const },
    error_pattern_summary: { type: 'string' as const },
    subject_health: {
      type: 'object' as const,
      additionalProperties: { type: 'string' as const },
    },
    weak_spot_trends: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          topic_label_normalised: { type: 'string' as const },
          trend_phrase: { type: 'string' as const },
          dominant_error_type: { type: 'string' as const },
        },
        required: [
          'topic_label_normalised',
          'trend_phrase',
          'dominant_error_type',
        ] as const,
      },
    },
    topic_cluster_narratives: {
      type: 'object' as const,
      additionalProperties: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            topic_label_normalised: { type: 'string' as const },
            narrative: { type: 'string' as const },
          },
          required: ['topic_label_normalised', 'narrative'] as const,
        },
      },
    },
    progress_narratives: {
      type: 'object' as const,
      additionalProperties: { type: 'string' as const },
    },
  },
  required: [
    'headline',
    'error_pattern_summary',
    'subject_health',
    'weak_spot_trends',
    'topic_cluster_narratives',
    'progress_narratives',
  ] as const,
};

async function generateNarratives(
  rawAggregationData: Record<string, unknown>
): Promise<GeminiNarrativeResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY not configured, returning empty narratives', {
      component: 'DigestGenerator',
      action: 'generateNarratives',
    });
    return {
      headline: 'Study insights generated',
      error_pattern_summary: '',
      subject_health: {},
      weak_spot_trends: [],
      topic_cluster_narratives: {},
      progress_narratives: {},
    };
  }

  const genai = new GoogleGenAI({ apiKey });

  const userPrompt = `Here is the student's aggregated study performance data:\n\n${JSON.stringify(rawAggregationData, null, 2)}\n\nGenerate a study briefing based on this data. The headline must be at most 200 characters. Be specific about topics and patterns — avoid generic advice.`;

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: NARRATIVE_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: NARRATIVE_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    logger.warn('Gemini returned empty narrative response', {
      component: 'DigestGenerator',
      action: 'generateNarratives',
    });
    return {
      headline: 'Study insights generated',
      error_pattern_summary: '',
      subject_health: {},
      weak_spot_trends: [],
      topic_cluster_narratives: {},
      progress_narratives: {},
    };
  }

  return JSON.parse(text) as GeminiNarrativeResponse;
}

// =====================================================
// Categorisation prompt
// =====================================================

const CATEGORISATION_SYSTEM_PROMPT = `You are an expert education analyst. Given a student's attempt at a problem, categorise the error they made.

You must classify the error into one of these broad categories:
- conceptual_misunderstanding: The student does not understand the underlying concept
- procedural_error: The student understands the concept but makes a mistake in the steps
- knowledge_gap: The student lacks specific knowledge needed to solve the problem
- misread_question: The student misinterpreted what the question was asking
- careless_mistake: The student knows how to solve it but made a small slip
- time_pressure: The student ran out of time or rushed
- incomplete_answer: The student's answer was partially correct but missing key parts

Also provide:
- granular_tag: A short, specific tag for the exact sub-skill (e.g. "fraction_division", "quadratic_formula_sign_error")
- topic_label: A human-readable topic label (e.g. "Fraction Operations", "Quadratic Formula")
- confidence: Your confidence in this categorisation from 0.0 to 1.0
- reasoning: Brief explanation of why you chose this category`;

function buildCategorisationPrompt(attempt: UncategorisedAttempt): string {
  const parts: string[] = [
    `Subject: ${attempt.subject_name}`,
    `Problem title: ${attempt.problem_title}`,
    `Problem type: ${attempt.problem_type}`,
  ];

  if (attempt.problem_content) {
    // Truncate very long content
    const content =
      attempt.problem_content.length > 2000
        ? attempt.problem_content.slice(0, 2000) + '...'
        : attempt.problem_content;
    parts.push(`Problem content: ${content}`);
  }

  if (attempt.correct_answer) {
    parts.push(`Correct answer: ${attempt.correct_answer}`);
  }

  const submittedStr =
    typeof attempt.submitted_answer === 'object'
      ? JSON.stringify(attempt.submitted_answer)
      : String(attempt.submitted_answer ?? '');
  parts.push(`Student's answer: ${submittedStr}`);
  parts.push(
    `Was correct: ${attempt.is_correct === null ? 'unknown' : attempt.is_correct}`
  );

  if (attempt.cause) {
    parts.push(`Student's self-reported cause: ${attempt.cause}`);
  }

  if (attempt.reflection_notes) {
    parts.push(`Student's reflection: ${attempt.reflection_notes}`);
  }

  parts.push(`Status after attempt: ${attempt.selected_status}`);

  return parts.join('\n');
}

// =====================================================
// Old digest cleanup
// =====================================================

async function pruneOldDigests(userId: string): Promise<void> {
  const supabase = createServiceClient();

  // Fetch all digest IDs for user, ordered newest first
  const { data: digests, error } = await supabase
    .from('insight_digests')
    .select('id')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false });

  if (error || !digests) return;

  if (digests.length > INSIGHT_CONSTANTS.MAX_DIGESTS_RETAINED) {
    const idsToDelete = digests
      .slice(INSIGHT_CONSTANTS.MAX_DIGESTS_RETAINED)
      .map(d => d.id);

    const { error: deleteError } = await supabase
      .from('insight_digests')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      logger.error('Failed to prune old digests', deleteError, {
        component: 'DigestGenerator',
        action: 'pruneOldDigests',
        userId,
      });
    }
  }
}
