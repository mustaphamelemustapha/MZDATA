import { LandingPage } from '@/components/landing-page';

export const metadata = {
  title: 'MZDATA',
  description: 'Fast, reliable VTU payments for data, airtime, wallet funding, and everyday utility services.',
  alternates: {
    canonical: 'https://mzdata.com',
  },
  openGraph: {
    title: 'MZDATA',
    description: 'MZDATA helps users buy data, buy airtime, fund wallets, and track transactions from one secure workspace.',
    url: 'https://mzdata.com',
    siteName: 'MZDATA',
    type: 'website',
  },
};

export default function Page() {
  return <LandingPage />;
}
