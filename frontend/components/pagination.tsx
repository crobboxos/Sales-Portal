interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-slate-600">
        Page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevious}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
