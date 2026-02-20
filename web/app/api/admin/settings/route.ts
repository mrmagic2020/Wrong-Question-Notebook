import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isCurrentUserSuperAdmin,
  getAdminSettings,
} from '@/lib/user-management';
import { CreateAdminSettingsDto } from '@/lib/schemas';

export async function GET() {
  try {
    const isSuperAdmin = await isCurrentUserSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getAdminSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    // Check if user is super admin
    const isSuperAdmin = await isCurrentUserSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await _request.json();
    const validatedData = CreateAdminSettingsDto.parse(body);

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('admin_settings')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ setting: data });
  } catch (error) {
    console.error('Error creating setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
