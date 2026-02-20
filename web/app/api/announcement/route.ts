import { NextResponse } from 'next/server';
import { getAnnouncement } from '@/lib/user-management';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const announcement = await getAnnouncement();
    return NextResponse.json({ announcement });
  } catch {
    return NextResponse.json({ announcement: null });
  }
}
