import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PremiumDataTable({ 
  data = [], 
  columns = [], 
  searchKey = '', 
  searchPlaceholder = 'Search...', 
  itemsPerPage = 10,
  emptyMessage = 'No data available.',
  headerActions = null,
  serverPagination = false,
  totalItems = 0,
  currentPage = 1,
  onPageChange,
  isLoading = false,
  serverSearchTerm,
  onServerSearchChange,
}) {
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientCurrentPage, setClientCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState(null);

  const activePage = serverPagination ? currentPage : clientCurrentPage;

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    if (serverPagination) return data;

    let result = data;

    // Filter
    if (clientSearchTerm && searchKey) {
      result = result.filter(item => 
        String(item[searchKey] || '').toLowerCase().includes(clientSearchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, clientSearchTerm, searchKey, sortConfig, serverPagination]);

  const totalPages = serverPagination 
    ? Math.ceil(totalItems / itemsPerPage) 
    : Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = serverPagination 
    ? filteredData 
    : filteredData.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  const handlePageChange = (newPage) => {
    if (serverPagination && onPageChange) {
      onPageChange(newPage);
    } else {
      setClientCurrentPage(newPage);
    }
  };

  const actualTotalItems = serverPagination ? totalItems : filteredData.length;

  return (
    <div className="flex flex-col gap-4 relative w-full min-w-0">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        {searchKey && !serverPagination && (
          <div className="relative w-full sm:max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={clientSearchTerm}
              onChange={(e) => {
                setClientSearchTerm(e.target.value);
                setClientCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/50"
            />
          </div>
        )}
        {serverPagination && onServerSearchChange !== undefined && (
          <div className="relative w-full sm:max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={serverSearchTerm || ''}
              onChange={(e) => onServerSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/50"
            />
          </div>
        )}
        <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {headerActions}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                {columns.map((col, i) => (
                  <th key={col.key || i} className="whitespace-nowrap px-4 py-3 font-medium">
                    {col.sortable !== false && !serverPagination ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {col.label}
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, i) => (
                  <tr key={row.id || i} className="group transition-colors hover:bg-secondary/50">
                    {columns.map((col, j) => (
                      <td key={col.key || j} className="whitespace-nowrap px-4 py-3">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{((activePage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-foreground">{Math.min(activePage * itemsPerPage, actualTotalItems)}</span> of <span className="font-medium text-foreground">{actualTotalItems}</span> results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={activePage === 1 || isLoading}
              onClick={() => handlePageChange(activePage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={activePage === totalPages || isLoading}
              onClick={() => handlePageChange(activePage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
