import { ForgotPasswordPage } from '@/components/forgot-password-page';
import { resolveServerBrand } from '@/lib/server-brand';

export function generateMetadata() {
  const brand = resolveServerBrand();
  return {
    title: `Forgot Password | ${brand.name}`,
    description: `Reset your ${brand.name} password.`,
  };
}

export default function Page() {
  return <ForgotPasswordPage />;
}
