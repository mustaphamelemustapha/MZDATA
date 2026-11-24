import { Suspense } from 'react';
import { ResetPinPage } from '@/components/reset-pin-page';
import { resolveServerBrand } from '@/lib/server-brand';

export function generateMetadata() {
  const brand = resolveServerBrand();
  return {
    title: `Reset Transaction PIN | ${brand.name}`,
    description: `Create a new transaction PIN for your ${brand.name} account.`,
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPinPage />
    </Suspense>
  );
}
