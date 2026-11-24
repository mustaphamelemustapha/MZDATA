import './globals.css';
import { LegacyCacheCleanup } from '@/components/legacy-cache-cleanup';
import { resolveServerBrand } from '@/lib/server-brand';

export function generateMetadata() {
  const brand = resolveServerBrand();
  return {
    title: {
      default: `${brand.name} | ${brand.tagline}`,
      template: `%s | ${brand.name}`,
    },
    description: brand.description,
    applicationName: brand.name,
    metadataBase: new URL(brand.url),
    icons: {
      icon: brand.icon,
      shortcut: brand.icon,
      apple: brand.icon,
    },
  };
}

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
      try {
        const h = (window.location && window.location.hostname || '').toLowerCase();
        let name = null;
        let tagline = null;
        let icon = null;
        if (h.includes('kulloma')) {
          name = 'KULLOMA DATA';
          tagline = 'Fast, Reliable Airtime & Utility Top-Ups';
          icon = '/brand/kullomadata-icon.png';
        } else if (h.includes('mzdata')) {
          name = 'MZ DATA';
          tagline = 'Next-Gen SME Telecom & Digital Bill Hub';
          icon = '/brand/mzdata-icon.png';
        }
        if (name && icon) {
          if (!document.title || document.title.includes('MELE DATA')) {
            document.title = document.title
              ? document.title.replace(/MELE DATA.*$/i, name + (document.title.startsWith('MELE DATA') ? ' | ' + tagline : ''))
              : name + ' | ' + tagline;
          }
          const links = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
          links.forEach((el) => { el.href = icon; });
        }
      } catch {}
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
