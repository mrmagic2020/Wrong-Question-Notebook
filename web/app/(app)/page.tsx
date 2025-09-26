// web/src/app/(app)/page.tsx
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-gray-600">Start by creating a subject.</p>
      <Link
        href="/subjects"
        className="inline-block rounded-md bg-black px-4 py-2 text-white"
      >
        Go to Subjects
      </Link>
    </div>
  );
}
