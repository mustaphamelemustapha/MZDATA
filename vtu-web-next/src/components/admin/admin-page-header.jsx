import { cn } from '@/lib/utils';

export function AdminPageHeader({ eyebrow = 'Admin', title, description, actions, className }) {
  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between animate-fade-up', className)}>
      <div className="space-y-3">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary/90">
          {eyebrow}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
          {title}
        </h1>
        {description ? <p className="max-w-3xl text-[15px] leading-relaxed text-muted-foreground/90 font-medium">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div> : null}
    </div>
  );
}
