import { SignUpSuccess } from '@/components/sign-up-success';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up Success – Wrong Question Notebook',
};

export default function Page() {
  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <SignUpSuccess />
      </div>
    </div>
  );
}
