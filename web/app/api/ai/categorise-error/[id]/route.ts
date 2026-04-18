import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { UpdateErrorCategorisationDto } from '@/lib/schemas';

async function patchCategorisation(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id } = await params;

  if (!isValidUuid(id)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid categorisation ID', 400),
      { status: 400 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400),
      { status: 400 }
    );
  }

  const parsed = UpdateErrorCategorisationDto.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      createApiErrorResponse(
        'Invalid request body',
        400,
        parsed.error.flatten()
      ),
      { status: 400 }
    );
  }

  try {
    // Fetch existing categorisation owned by user
    const { data: existing, error: fetchError } = await supabase
      .from('error_categorisations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
        { status: 404 }
      );
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      is_user_override: true,
    };

    // If this is the first override, save originals
    if (existing.original_broad_category === null) {
      updatePayload.original_broad_category = existing.broad_category;
      updatePayload.original_granular_tag = existing.granular_tag;
    }

    // Apply new values from request
    if (parsed.data.broad_category !== undefined) {
      updatePayload.broad_category = parsed.data.broad_category;
    }
    if (parsed.data.granular_tag !== undefined) {
      updatePayload.granular_tag = parsed.data.granular_tag;
    }

    const { data: updated, error: updateError } = await supabase
      .from('error_categorisations')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          updateError.message
        ),
        { status: 500 }
      );
    }

    return NextResponse.json(createApiSuccessResponse(updated));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

async function deleteCategorisationOverride(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id } = await params;

  if (!isValidUuid(id)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid categorisation ID', 400),
      { status: 400 }
    );
  }

  try {
    // Fetch existing categorisation owned by user
    const { data: existing, error: fetchError } = await supabase
      .from('error_categorisations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
        { status: 404 }
      );
    }

    if (!existing.is_user_override) {
      return NextResponse.json(
        createApiErrorResponse(
          'No override to reset — categorisation has not been overridden',
          400
        ),
        { status: 400 }
      );
    }

    if (
      !existing.original_broad_category ||
      !existing.original_granular_tag
    ) {
      return NextResponse.json(
        createApiErrorResponse(
          'Cannot reset — original values are missing',
          500
        ),
        { status: 500 }
      );
    }

    // Restore original values
    const { data: restored, error: updateError } = await supabase
      .from('error_categorisations')
      .update({
        is_user_override: false,
        broad_category: existing.original_broad_category,
        granular_tag: existing.original_granular_tag,
        original_broad_category: null,
        original_granular_tag: null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          updateError.message
        ),
        { status: 500 }
      );
    }

    return NextResponse.json(createApiSuccessResponse(restored));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const PATCH = withSecurity(patchCategorisation, {
  rateLimitType: 'api',
});

export const DELETE = withSecurity(deleteCategorisationOverride, {
  rateLimitType: 'api',
});
