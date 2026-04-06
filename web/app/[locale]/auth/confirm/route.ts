import { createClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

function isRelativePath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('://');
}

function extractLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|zh-CN)\//);
  return match ? match[1] : 'en';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';
  const safePath = isRelativePath(next) ? next : '/';
  const locale = extractLocale(request.nextUrl.pathname);

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = safePath;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(redirectTo);
    } else {
      const errorUrl = request.nextUrl.clone();
      errorUrl.pathname = `/${locale}/auth/error`;
      errorUrl.searchParams.set('error', error.message);
      return NextResponse.redirect(errorUrl);
    }
  }

  const errorUrl = request.nextUrl.clone();
  errorUrl.pathname = `/${locale}/auth/error`;
  return NextResponse.redirect(errorUrl);
}
