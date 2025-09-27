import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin, getUserStatistics, getRecentActivity } from '@/lib/user-management';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statistics = await getUserStatistics();
    if (!statistics) {
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ statistics });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
