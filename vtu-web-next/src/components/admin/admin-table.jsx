import { cn } from '@/lib/utils';

export function AdminTable({
  columns = [],
  rows,
  data,
  rowKey = 'id',
  empty,
  emptyMessage,
  loading = false,
  className,
}) {
  const tableRows = rows || data || [];
  const displayEmpty = loading
    ? 'Loading records...'
    : (empty || emptyMessage || 'No records found.');

  return (
    <div className={cn('overflow-hidden rounded-3xl border border-border bg-card', className)}>
      <div className="overflow-auto">
        <table className="min-w-full text-left">
          <thead className="bg-secondary">
            <tr>
              {columns.map((column, idx) => {
                const headerText = column.label || column.header || column.title || '';
                const key = column.key || column.accessorKey || column.id || `col-${idx}`;
                return (
                  <th
                    key={key}
                    className={cn(
                      'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {headerText}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, rowIdx) => {
              const rKey = row[rowKey] ?? row.id ?? rowIdx;
              return (
                <tr key={rKey} className="border-t border-border align-top">
                  {columns.map((column, colIdx) => {
                    const colKey = column.key || column.accessorKey || column.id || `col-${colIdx}`;
                    return (
                      <td
                        key={`${colKey}-${rKey}`}
                        className={cn(
                          'px-4 py-3 text-sm text-foreground',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.render ? column.render(row) : row[column.key] ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tableRows.length === 0 ? (
        <div className="border-t border-border px-4 py-5 text-sm text-muted-foreground">
          {displayEmpty}
        </div>
      ) : null}
    </div>
  );
}
