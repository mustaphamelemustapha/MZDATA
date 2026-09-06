import { Suspense } from 'react';
import { ResetPasswordPage } from '@/components/reset-password-page';

export const metadata = {
  title: 'Reset Password | MZDATA',
  description: 'Create a new password for your MZDATA account.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
