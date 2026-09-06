import { LandingPage } from '@/components/landing-page';

export const metadata = {
  title: 'Mele Data',
  description: 'Fast, reliable VTU payments for data, airtime, wallet funding, and everyday utility services.',
  alternates: {
    canonical: 'https://mzdata.org',
  },
  openGraph: {
    title: 'Mele Data',
    description: 'Mele Data helps users buy data, buy airtime, fund wallets, and track transactions from one secure workspace.',
    url: 'https://mzdata.org',
    siteName: 'Mele Data',
    type: 'website',
  },
};

export default function Page() {
  return <LandingPage />;
}
