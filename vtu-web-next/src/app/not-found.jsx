import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="axis-label">Mele Data</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
