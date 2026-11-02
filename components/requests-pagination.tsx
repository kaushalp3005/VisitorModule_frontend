import { Button } from '@/components/ui/button';

interface RequestsPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}

// First page, last page and the current page's neighbours; null marks a gap
function getPageItems(page: number, lastPage: number): (number | null)[] {
  const items: (number | null)[] = [];
  for (let item = 1; item <= lastPage; item++) {
    if (item === 1 || item === lastPage || Math.abs(item - page) <= 1) {
      items.push(item);
    } else if (items[items.length - 1] !== null) {
      items.push(null);
    }
  }
  return items;
}

export function RequestsPagination({ page, pageSize, total, onChange, className = '' }: RequestsPaginationProps) {
  const lastPage = Math.ceil(total / pageSize);
  if (lastPage <= 1) return null;

  const firstShown = (page - 1) * pageSize + 1;
  const lastShown = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className={`bg-white rounded-xl md:rounded-2xl shadow-professional-lg border border-gray-200 p-3 md:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-3 ${className}`}
    >
      <p className="text-xs md:text-sm text-gray-600">
        Showing <strong className="text-gray-900">{firstShown}–{lastShown}</strong> of{' '}
        <strong className="text-gray-900">{total}</strong>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        {getPageItems(page, lastPage).map((item, index) =>
          item === null ? (
            <span key={`gap-${index}`} className="hidden sm:inline px-1 text-xs md:text-sm text-gray-400">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? 'default' : 'outline'}
              size="sm"
              aria-current={item === page ? 'page' : undefined}
              className={`text-xs md:text-sm h-8 md:h-9 min-w-8 md:min-w-9 px-2 ${
                item === page ? 'bg-blue-600 text-white hover:bg-blue-700' : 'hidden sm:inline-flex'
              }`}
              onClick={() => item !== page && onChange(item)}
            >
              {item}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
          disabled={page >= lastPage}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
