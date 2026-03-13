'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  perPage?: number;
  searchFn?: (item: T, term: string) => boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  onRowClick?: (item: T) => void;
  title?: string;
  icon?: string;
  extra?: React.ReactNode;
}

export function DataTable<T extends { id?: string }>({
  data, columns, perPage = 10, searchFn, searchPlaceholder = 'Rechercher...',
  emptyText = 'Aucun élément', onRowClick, title, icon, extra,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search || !searchFn) return data;
    return data.filter((item) => searchFn(item, search.toLowerCase()));
  }, [data, search, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div>
      {title && (
        <div className="font-mono font-bold text-base mb-3.5 flex items-center gap-2.5">
          {icon && <span>{icon}</span>}{title}
          <span className="font-mono text-[0.7rem] font-semibold px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">{filtered.length}</span>
          {extra && <span className="ml-auto">{extra}</span>}
        </div>
      )}
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2.5 gap-3 flex-wrap">
        {searchFn && (
          <input
            type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] text-[0.82rem] min-w-[200px] focus-ring placeholder:text-[var(--text-tertiary)]"
          />
        )}
        <span className="text-[0.75rem] text-[var(--text-tertiary)] font-mono">{filtered.length} / {data.length} élément(s)</span>
      </div>

      {/* Table */}
      {pageItems.length === 0 ? (
        <div className="text-center py-5 text-[var(--text-tertiary)] text-[0.9rem]">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={cn('text-left px-3.5 py-2.5 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-primary)]', col.className)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item, idx) => (
                <tr
                  key={(item as any).id || idx}
                  className={cn('hover:bg-[var(--bg-tertiary)] transition-colors', onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-3.5 py-2.5 text-[0.85rem] border-b border-[var(--border-primary)]', col.className)}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-3">
          <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
            className="min-w-[32px] h-8 px-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md text-[0.78rem] font-mono text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg-card-hover)]">‹</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button key={p} onClick={() => setPage(p)}
                className={cn('min-w-[32px] h-8 px-2 border rounded-md text-[0.78rem] font-mono transition-all',
                  p === currentPage ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]' : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                )}>{p}</button>
            );
          })}
          <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
            className="min-w-[32px] h-8 px-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md text-[0.78rem] font-mono text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg-card-hover)]">›</button>
        </div>
      )}
    </div>
  );
}
