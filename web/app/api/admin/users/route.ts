import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isCurrentUserAdmin,
  getAllUsers,
  searchUsers,
} from '@/lib/user-management';
import { CreateUserProfileDto } from '@/lib/schemas';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';

// Cache configuration for this route
export const revalidate = 600; // 10 minutes

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let users;
    if (search) {
      users = await searchUsers(search);
    } else {
      users = await getAllUsers();
    }

    return NextResponse.json(createApiSuccessResponse({ users }));
  } catch (error) {
    console.error('Error fetching users:', error);
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401),
        { status: 401 }
      );
    }

    const body = await request.json();
    CreateUserProfileDto.parse(body);

    const supabase = await createClient();

    // Get current user ID for audit
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401),
        { status: 401 }
      );
    }

    // For now, this would require creating a user in Supabase Auth first
    // This is a placeholder for the actual implementation
    return NextResponse.json(
      createApiErrorResponse('User creation not implemented yet', 501),
      { status: 501 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}
