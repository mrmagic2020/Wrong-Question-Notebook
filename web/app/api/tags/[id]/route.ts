import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { UpdateTagDto } from '@/lib/schemas';
import {
  revalidateUserTags,
  revalidateSubjectTags,
} from '@/lib/cache-invalidation';

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

  // Get the tag first to get subject_id for cache invalidation
  const { data: existingTag } = await supabase
    .from('tags')
    .select('subject_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

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
  if (existingTag?.subject_id) {
    await Promise.all([
      revalidateUserTags(user.id),
      revalidateSubjectTags(existingTag.subject_id),
    ]);
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id } = await params;

  // Get the tag first to get subject_id for cache invalidation
  const { data: existingTag } = await supabase
    .from('tags')
    .select('subject_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  // Also clears links via ON DELETE CASCADE on problem_tag.tag_id
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Invalidate cache after successful deletion
  if (existingTag?.subject_id) {
    await Promise.all([
      revalidateUserTags(user.id),
      revalidateSubjectTags(existingTag.subject_id),
    ]);
  }

  return NextResponse.json({ ok: true });
}
