import { PageHeader } from '@/components/page-header';
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
      <PageHeader
        title="Problems"
        description="Pick a subject to browse and review problems."
      />

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

          <div className="mt-6 border-t pt-4">
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
