import { NextRequest, NextResponse } from 'next/server';
import {
  isCurrentUserSuperAdmin,
  getAllUsersWithCount,
} from '@/lib/user-management';
import { createApiErrorResponse, handleAsyncError } from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const isSuperAdmin = await isCurrentUserSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const sort = searchParams.get('sort') || 'created_at';
    const dir =
      searchParams.get('dir') === 'asc' ? ('asc' as const) : ('desc' as const);

    const offset = (page - 1) * limit;

    const { users, total_count } = await getAllUsersWithCount(
      limit,
      offset,
      search,
      role,
      sort,
      dir
    );

    return NextResponse.json({
      users,
      total_count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}
