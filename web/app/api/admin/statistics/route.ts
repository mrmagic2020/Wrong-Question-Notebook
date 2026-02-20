import { NextResponse } from 'next/server';
import {
  isCurrentUserSuperAdmin,
  getUserStatistics,
  getContentStatistics,
  getTotalStorageUsage,
} from '@/lib/user-management';

export const dynamic = 'force-dynamic';
export const revalidate = 900; // 15 minutes

export async function GET() {
  try {
    const isSuperAdmin = await isCurrentUserSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [statistics, contentStats, storageStats] = await Promise.all([
      getUserStatistics(),
      getContentStatistics(),
      getTotalStorageUsage(),
    ]);

    if (!statistics) {
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      statistics,
      contentStats,
      storageStats,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
