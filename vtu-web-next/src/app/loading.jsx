export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card px-6 py-5 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="axis-label">Mele Data</div>
        <div className="mt-3 text-lg font-semibold text-foreground">Loading workspace</div>
        <div className="mt-2 text-sm text-muted-foreground">Preparing the dashboard experience.</div>
      </div>
    </div>
  );
}
