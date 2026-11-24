import { Suspense } from 'react';
import { ResetPasswordPage } from '@/components/reset-password-page';
import { resolveServerBrand } from '@/lib/server-brand';

export function generateMetadata() {
  const brand = resolveServerBrand();
  return {
    title: `Reset Password | ${brand.name}`,
    description: `Create a new password for your ${brand.name} account.`,
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
