// web/src/app/(app)/page.tsx
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Start by creating a subject.</p>
      <Link
        href="/subjects"
        className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go to Subjects
      </Link>
    </div>
  );
}
