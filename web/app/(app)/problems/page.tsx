import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ProblemsChooser() {
  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="section-container">
      <div className="page-header">
        <h1 className="page-title">Problems by Subject</h1>
      </div>

      <Card className="card-section">
        <CardContent className="card-section-content pt-6">
          <ul className="space-y-2">
            {(subjects ?? []).map((s: any) => (
              <li key={s.id}>
                <Link
                  className="text-primary underline hover:text-primary/80 transition-colors"
                  href={`/subjects/${s.id}/problems`}
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t">
            <p className="text-body-sm text-muted-foreground">
              Tip: add a subject first on the{' '}
              <Link
                href="/subjects"
                className="underline text-primary hover:text-primary/80 transition-colors"
              >
                Subjects
              </Link>{' '}
              page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
