import { ChevronLeft, ChevronRight } from 'lucide-react';

// Reusable pagination control.
// Props: page (1-based), pageSize, total, onPageChange(page), onPageSizeChange(size)
export default function Pagination({ page = 1, pageSize = 25, total = 0, onPageChange, onPageSizeChange, sizes = [10, 25, 50, 100] }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Build a window of page numbers to render (max 7 items including ellipses)
  function buildPages() {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 4) pages.push('…');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 3) pages.push('…');
    pages.push(totalPages);
    return pages;
  }
  const items = buildPages();

  const go = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange?.(p);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
      <div className="text-sm text-gray-600 flex items-center gap-3">
        <span>Showing <span className="font-semibold text-gray-900">{from}</span>–<span className="font-semibold text-gray-900">{to}</span> of <span className="font-semibold text-gray-900">{total}</span></span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-gray-200 text-xs px-2 py-1 outline-none focus:border-accent-400"
            title="Rows per page"
          >
            {sizes.map(s => <option key={s} value={s}>{s} / page</option>)}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="w-9 h-9 grid place-items-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} className="rtl:rotate-180" />
        </button>
        {items.map((p, i) => p === '…' ? (
          <span key={`e-${i}`} className="w-9 h-9 grid place-items-center text-gray-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => go(p)}
            className={`min-w-[36px] h-9 px-2 grid place-items-center rounded-lg text-sm font-medium transition ${p === page ? 'bg-brand-900 text-white shadow-sm' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          className="w-9 h-9 grid place-items-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={16} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
