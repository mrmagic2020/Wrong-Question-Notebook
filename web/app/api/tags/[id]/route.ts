import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { UpdateTagDto } from '@/lib/schemas';
import { revalidateUserData } from '@/lib/cache-invalidation';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateTagDto.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from('tags')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Invalidate cache after successful update
  await revalidateUserData(user.id);

  return NextResponse.json({ data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id } = await params;

  // Also clears links via ON DELETE CASCADE on problem_tag.tag_id
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Invalidate cache after successful deletion
  await revalidateUserData(user.id);

  return NextResponse.json({ ok: true });
}
