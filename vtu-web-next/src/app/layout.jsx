import './globals.css';
import { LegacyCacheCleanup } from '@/components/legacy-cache-cleanup';

export const metadata = {
  title: {
    default: 'MELE DATA | Instant VTU, Airtime & Utility Bills',
    template: '%s | MELE DATA',
  },
  description: 'Fast, reliable VTU payments for data, airtime, wallet funding, and everyday utility services.',
  applicationName: 'MELE DATA',
  metadataBase: new URL('https://meledata.ng'),
  icons: {
    icon: '/brand/meledata-icon-clean.png',
    shortcut: '/brand/meledata-icon-clean.png',
    apple: '/brand/meledata-icon-clean.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  const themeScript = `
    (() => {
      try {
        const saved = localStorage.getItem('axis-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
      } catch {
        document.documentElement.classList.add('light');
      }
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <LegacyCacheCleanup />
        {children}
      </body>
    </html>
  );
}
