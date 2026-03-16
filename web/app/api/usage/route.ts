import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/requireUser';
import { getAllContentLimits } from '@/lib/content-limits';
import { getQuotaUsage } from '@/lib/usage-quota';
import { USAGE_QUOTA_CONSTANTS } from '@/lib/constants';
import { createApiSuccessResponse } from '@/lib/common-utils';
import { getUserTimezone } from '@/lib/timezone-utils';

export async function GET() {
  try {
    const { user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userTimezone = await getUserTimezone(user.id);

    const [contentLimits, aiExtraction, aiCategorisation] = await Promise.all([
      getAllContentLimits(user.id),
      getQuotaUsage(
        user.id,
        USAGE_QUOTA_CONSTANTS.RESOURCE_TYPES.AI_EXTRACTION,
        userTimezone
      ),
      getQuotaUsage(
        user.id,
        USAGE_QUOTA_CONSTANTS.RESOURCE_TYPES.AI_CATEGORISATION,
        userTimezone
      ),
    ]);

    return NextResponse.json(
      createApiSuccessResponse({
        content_limits: contentLimits,
        daily_quotas: {
          ai_extraction: aiExtraction,
          ai_categorisation: aiCategorisation,
        },
      })
    );
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
