import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { CreateAttemptDto } from '@/lib/schemas';

export async function GET(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { searchParams } = new URL(req.url);
  const problem_id = searchParams.get('problem_id');

  if (!problem_id) {
    return NextResponse.json(
      { error: 'problem_id is required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('problem_id', problem_id)
    .order('created_at', { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const body = await req.json().catch(() => ({}));
  const parsed = CreateAttemptDto.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = {
    ...parsed.data,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('attempts')
    .insert(payload)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
