import './globals.css';
import { LegacyCacheCleanup } from '@/components/legacy-cache-cleanup';

export const metadata = {
  title: {
    default: 'MZDATA',
    template: '%s | MZDATA',
  },
  description: 'Premium fintech dashboard for MZDATA',
  applicationName: 'MZDATA',
  metadataBase: new URL('https://mzdata.com'),
  icons: {
    icon: '/brand/mzdata-icon.png',
    shortcut: '/brand/mzdata-icon.png',
    apple: '/brand/mzdata-icon.png',
  },
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
