import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function FilterBar({ children, searchValue = '', onSearchChange, searchPlaceholder = 'Search' }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-11"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
