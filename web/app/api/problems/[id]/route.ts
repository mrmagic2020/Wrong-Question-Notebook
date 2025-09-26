import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { UpdateProblemDto } from '@/lib/schemas';
import { deleteProblemFiles } from '@/lib/storage/delete';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateProblemDto.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await params;
  const { tag_ids, ...problem } = parsed.data;

  const { data, error } = await supabase
    .from('problems')
    .update(problem)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Reset tags if provided
  if (tag_ids) {
    await supabase
      .from('problem_tag')
      .delete()
      .eq('problem_id', id)
      .eq('user_id', user.id);
    if (tag_ids.length > 0) {
      const tagLinks = tag_ids.map(tag_id => ({
        user_id: user.id,
        problem_id: id,
        tag_id,
      }));
      await supabase.from('problem_tag').insert(tagLinks);
    }
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

  // Best-effort: remove storage for both subfolders
  await deleteProblemFiles(supabase, user.id, id).catch(() => {});

  const { error } = await supabase
    .from('problems')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
