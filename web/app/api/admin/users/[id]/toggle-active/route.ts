import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin, getUserProfile, getUserProfileWithServiceRole, toggleUserActive } from '@/lib/user-management';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before using
    const { id } = await params;

    // Check if user exists
    const existingUser = await getUserProfileWithServiceRole(id);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent non-super-admins from modifying super-admin users
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserProfile = await getUserProfile(authData.user.id);
    if (existingUser.user_role === 'super_admin' && currentUserProfile?.user_role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot modify super admin users' },
        { status: 403 }
      );
    }

    // Prevent users from deactivating themselves
    if (authData.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 403 }
      );
    }

    const success = await toggleUserActive(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to toggle user status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'User status updated successfully',
      isActive: !existingUser.is_active
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
