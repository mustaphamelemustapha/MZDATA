'use client';

import { useEffect } from 'react';

export function LegacyCacheCleanup() {
  useEffect(() => {
    let cancelled = false;

    const cleanup = async () => {
      try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }
      } catch {
        // Ignore legacy service worker cleanup failures.
      }

      try {
        if (typeof window !== 'undefined' && 'caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch {
        // Ignore cache cleanup failures.
      }

      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('mzdata_legacy_shell');
          window.sessionStorage.removeItem('mzdata_legacy_shell');
        }
      } catch {
        // Ignore storage cleanup failures.
      }

      if (!cancelled && typeof window !== 'undefined') {
        window.__MZDATA_LEGACY_CLEANED__ = true;
      }
    };

    cleanup();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
