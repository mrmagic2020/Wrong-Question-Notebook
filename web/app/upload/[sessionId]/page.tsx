import { redirect } from 'next/navigation';
import { isValidUuid } from '@/lib/common-utils';
import { MobileUploader } from './mobile-uploader';

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
  if (!isValidUuid(sessionId) || !token) {
    redirect('/');
  }

  return <MobileUploader sessionId={sessionId} token={token} />;
}
