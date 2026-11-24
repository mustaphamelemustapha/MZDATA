import { LandingPage } from '@/components/landing-page';
import { resolveServerBrand } from '@/lib/server-brand';

export function generateMetadata() {
  const brand = resolveServerBrand();
  return {
    title: `${brand.name} | ${brand.tagline}`,
    description: brand.description,
    alternates: {
      canonical: brand.url,
    },
    openGraph: {
      title: brand.name,
      description: brand.description,
      url: brand.url,
      siteName: brand.name,
      type: 'website',
    },
  };
}

export default function Page() {
  return <LandingPage />;
}
