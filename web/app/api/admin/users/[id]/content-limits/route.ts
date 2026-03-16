import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserSuperAdmin } from '@/lib/user-management';
import {
  getAllContentLimits,
  setContentLimitOverride,
  removeContentLimitOverride,
} from '@/lib/content-limits';
import { CONTENT_LIMIT_CONSTANTS } from '@/lib/constants';

const validTypes = new Set(
  Object.values(CONTENT_LIMIT_CONSTANTS.RESOURCE_TYPES)
);

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
    const limits = await getAllContentLimits(id);
    return NextResponse.json({ limits });
  } catch (error) {
    console.error('Error fetching content limits:', error);
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
    const { resource_type, limit_value } = body;

    if (!resource_type || !validTypes.has(resource_type)) {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 }
      );
    }

    if (limit_value === null) {
      const success = await removeContentLimitOverride(id, resource_type);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to remove override' },
          { status: 500 }
        );
      }
    } else {
      const parsed = parseInt(limit_value);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: 'Invalid limit value' },
          { status: 400 }
        );
      }
      const success = await setContentLimitOverride(id, resource_type, parsed);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to set override' },
          { status: 500 }
        );
      }
    }

    const limits = await getAllContentLimits(id);
    return NextResponse.json({ limits });
  } catch (error) {
    console.error('Error updating content limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
