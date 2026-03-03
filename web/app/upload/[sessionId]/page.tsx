import { redirect } from 'next/navigation';
import { MobileUploader } from './mobile-uploader';

// Validate UUID format without importing Zod (keep server component light)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { sessionId } = await params;
  const { token } = await searchParams;

  // Basic validation — redirect to home if invalid
  if (!UUID_REGEX.test(sessionId) || !token) {
    redirect('/');
  }

  return <MobileUploader sessionId={sessionId} token={token} />;
}
