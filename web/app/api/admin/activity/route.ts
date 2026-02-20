import { NextRequest, NextResponse } from 'next/server';
import {
  isCurrentUserSuperAdmin,
  getFilteredActivity,
} from '@/lib/user-management';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const isSuperAdmin = await isCurrentUserSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const userId = searchParams.get('user_id') || undefined;
    const action = searchParams.get('action') || undefined;
    const fromDate = searchParams.get('from') || undefined;
    const toDate = searchParams.get('to') || undefined;
    const offset = (page - 1) * limit;

    const { activities, total_count } = await getFilteredActivity({
      limit,
      offset,
      userId,
      action,
      fromDate,
      toDate,
    });

    return NextResponse.json({
      activities,
      total_count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
