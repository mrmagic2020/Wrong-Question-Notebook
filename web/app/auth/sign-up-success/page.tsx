import { SignUpSuccess } from '@/components/sign-up-success';
import { AuthNav } from '@/components/auth-nav';

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AuthNav />
      <div className="flex flex-1 w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <SignUpSuccess />
        </div>
      </div>
    </main>
  );
}
