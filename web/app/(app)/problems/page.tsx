import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ProblemsChooser() {
  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Problems by Subject</h1>
      <ul className="list-disc pl-5">
        {(subjects ?? []).map((s: any) => (
          <li key={s.id}>
            <Link
              className="text-blue-600 underline"
              href={`/subjects/${s.id}/problems`}
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-gray-600">
        Tip: add a subject first on the{' '}
        <Link href="/subjects" className="underline">
          Subjects
        </Link>{' '}
        page.
      </p>
    </div>
  );
}
