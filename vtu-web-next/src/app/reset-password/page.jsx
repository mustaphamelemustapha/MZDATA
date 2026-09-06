import { Suspense } from 'react';
import { ResetPasswordPage } from '@/components/reset-password-page';

export const metadata = {
  title: 'Reset Password | Mele Data',
  description: 'Create a new password for your Mele Data account.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
