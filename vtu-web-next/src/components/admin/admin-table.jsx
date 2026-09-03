import { cn } from '@/lib/utils';

export function AdminTable({ columns = [], rows = [], rowKey = 'id', empty, className }) {
  return (
    <div className={cn('overflow-hidden rounded-3xl border border-border bg-card', className)}>
      <div className="overflow-auto">
        <table className="min-w-full text-left">
          <thead className="bg-secondary">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[rowKey] ?? JSON.stringify(row)} className="border-t border-border align-top">
                {columns.map((column) => (
                  <td key={`${column.key}-${row[rowKey] ?? ''}`} className="px-4 py-3 text-sm text-foreground">
                    {column.render ? column.render(row) : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <div className="border-t border-border px-4 py-5 text-sm text-muted-foreground">{empty || 'No records found.'}</div> : null}
    </div>
  );
}
