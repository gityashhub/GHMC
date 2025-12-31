import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={`${String(column.key)}-${index}`} className={column.className}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)}>
                  {columns.map((column, index) => (
                    <td key={`${String(column.key)}-${index}`} className={column.className}>
                      {column.render
                        ? column.render(item)
                        : String((item as Record<string, unknown>)[column.key as string] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showing page {currentPage} of {totalPages}
            </p>
            {onPageChange && (
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
