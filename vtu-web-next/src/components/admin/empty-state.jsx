import { AlertCircle } from 'lucide-react';

export function EmptyState({ title = 'No data yet', description = 'Nothing to show right now.', action }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-border/50 bg-secondary/20 p-8 text-center backdrop-blur-md transition-all hover:bg-secondary/30 hover:border-border">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/5" />
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border/50 bg-card/50 text-muted-foreground shadow-sm mb-4">
        <AlertCircle className="h-6 w-6 opacity-80" />
      </div>
      <h3 className="relative text-base font-bold text-foreground">{title}</h3>
      <p className="relative mt-2 text-[13px] font-medium leading-relaxed text-muted-foreground/90">{description}</p>
      {action ? <div className="relative mt-5">{action}</div> : null}
    </div>
  );
}
