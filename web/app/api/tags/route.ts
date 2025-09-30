import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { CreateTagDto } from '@/lib/schemas';
import { withSecurity } from '@/lib/security-middleware';

async function getTags(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { searchParams } = new URL(req.url);
  const subject_id = searchParams.get('subject_id');
  if (!subject_id) {
    return NextResponse.json(
      { error: 'subject_id is required' },
      { status: 400 }
    );
  }

  // Validate UUID format
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      subject_id
    )
  ) {
    return NextResponse.json(
      { error: 'Invalid subject ID format' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .eq('subject_id', subject_id)
    .order('name', { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export const GET = withSecurity(getTags, { rateLimitType: 'readOnly' });

async function createTag(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const body = await req.json().catch(() => ({}));
  const parsed = CreateTagDto.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { subject_id, name } = parsed.data;

  const { data, error } = await supabase
    .from('tags')
    .insert({ user_id: user.id, subject_id, name })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export const POST = withSecurity(createTag, { rateLimitType: 'api' });
