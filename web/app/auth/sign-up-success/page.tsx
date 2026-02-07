import { SignUpSuccess } from '@/components/sign-up-success';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up Success – Wrong Question Notebook',
};

export default function Page() {
  return (
    <div className="flex w-full flex-1 items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpSuccess />
      </div>
    </div>
  );
}
