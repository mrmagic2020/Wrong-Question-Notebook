import { NextResponse } from 'next/server';
import { getAnnouncement } from '@/lib/user-management';

export const revalidate = 60;

export async function GET() {
  try {
    const announcement = await getAnnouncement();
    return NextResponse.json({ announcement });
  } catch {
    return NextResponse.json({ announcement: null });
  }
}
