import { NextRequest, NextResponse } from 'next/server';
import {
  isCurrentUserSuperAdmin,
  setUserQuotaOverride,
  removeUserQuotaOverride,
} from '@/lib/user-management';
import { getQuotaUsage } from '@/lib/usage-quota';
import { USAGE_QUOTA_CONSTANTS } from '@/lib/constants';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isSuperAdmin = await isCurrentUserSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const quota = await getQuotaUsage(id);
    return NextResponse.json({ quota });
  } catch (error) {
    console.error('Error fetching quota:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isSuperAdmin = await isCurrentUserSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { daily_limit } = body;

    const resourceType = USAGE_QUOTA_CONSTANTS.RESOURCE_TYPES.AI_EXTRACTION;

    if (daily_limit === null) {
      const success = await removeUserQuotaOverride(id, resourceType);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to remove quota override' },
          { status: 500 }
        );
      }
    } else {
      const limit = parseInt(daily_limit);
      if (isNaN(limit) || limit < 0) {
        return NextResponse.json(
          { error: 'Invalid daily limit' },
          { status: 400 }
        );
      }
      const success = await setUserQuotaOverride(id, resourceType, limit);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to set quota override' },
          { status: 500 }
        );
      }
    }

    const quota = await getQuotaUsage(id);
    return NextResponse.json({ quota });
  } catch (error) {
    console.error('Error updating quota:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
