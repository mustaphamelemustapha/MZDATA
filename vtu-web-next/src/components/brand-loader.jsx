'use client';

import { getActiveBrand } from '@/lib/brand';

export function BrandLoader({ message = 'Loading workspace', subtitle = 'Preparing your secure experience...' }) {
  const brand = getActiveBrand();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4">
      {/* Dynamic ambient radial background glows */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20 blur-3xl transition-all duration-700"
        style={{ backgroundColor: brand.primaryColor || '#5B21B6' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl transition-all duration-700"
        style={{ backgroundColor: brand.secondaryColor || '#F59E0B' }}
      />

      {/* Glassmorphic card */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-border/80 bg-card/90 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        {/* Animated glowing logo ring container */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          {/* Outer continuous spinning gradient ring */}
          <div
            className="absolute inset-0 animate-spin rounded-3xl opacity-75 blur-[2px]"
            style={{
              animationDuration: '3s',
              background: `conic-gradient(from 0deg, transparent, ${brand.primaryColor || '#5B21B6'}, ${brand.secondaryColor || '#F59E0B'}, transparent)`,
            }}
          />

          {/* Pulse aura */}
          <div
            className="absolute inset-1 animate-pulse rounded-2xl opacity-30"
            style={{ backgroundColor: brand.primaryColor || '#5B21B6' }}
          />

          {/* Logo container */}
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-background/95 p-3 shadow-lg">
            <img
              src={brand.icon || brand.logo}
              alt={brand.name}
              className="h-full w-full object-contain animate-in fade-in zoom-in duration-500"
            />
          </div>
        </div>

        {/* Brand badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          {brand.name}
        </div>

        {/* Title & Subtitle */}
        <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">{message}</h2>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{subtitle}</p>

        {/* Sleek animated progress bar */}
        <div className="relative mt-6 h-1.5 w-full overflow-hidden rounded-full bg-secondary/80">
          <div
            className="absolute h-full w-1/2 rounded-full shadow-sm"
            style={{
              backgroundColor: brand.primaryColor || '#5B21B6',
              animation: 'indeterminateProgress 1.6s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite',
            }}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes indeterminateProgress {
          0% {
            left: -50%;
            width: 30%;
          }
          50% {
            left: 25%;
            width: 60%;
          }
          100% {
            left: 100%;
            width: 30%;
          }
        }
      `}</style>
    </div>
  );
}
