import { AlertCircle } from 'lucide-react';

export function EmptyState({ title = 'No data yet', description = 'Nothing to show right now.', action }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-7 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
