import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id: problemId } = await params;
  const body = await req.json().catch(() => ({}));

  // Validate the request body
  const { status, last_reviewed_date } = body;

  if (!status && !last_reviewed_date) {
    return NextResponse.json(
      { error: 'Either status or last_reviewed_date must be provided' },
      { status: 400 }
    );
  }

  if (status && !['wrong', 'needs_review', 'mastered'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status value' },
      { status: 400 }
    );
  }

  // Build update object with only provided fields
  const updateData: any = {};
  if (status !== undefined) {
    updateData.status = status;
  }
  if (last_reviewed_date !== undefined) {
    updateData.last_reviewed_date = last_reviewed_date;
  }

  // Update only the status and/or last_reviewed_date fields
  const { data, error } = await supabase
    .from('problems')
    .update(updateData)
    .eq('id', problemId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}
