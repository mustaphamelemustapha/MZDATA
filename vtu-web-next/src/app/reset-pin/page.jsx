import { Suspense } from 'react';
import { ResetPinPage } from '@/components/reset-pin-page';

export const metadata = {
  title: 'Reset Transaction PIN | MZDATA',
  description: 'Create a new transaction PIN for your MZDATA account.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPinPage />
    </Suspense>
  );
}
