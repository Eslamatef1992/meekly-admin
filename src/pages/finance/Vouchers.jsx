import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, RotateCcw } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney, fmtDate } from '../../lib/format';
import { useAuthStore } from '../../lib/auth';
import Pagination from '../../components/Pagination';
import ExportToolbar from '../../components/ExportToolbar';

function StatusBadge({ s, t }) {
  if (s === 'posted')    return <span className="badge-green">{t('finance.voucher.posted')}</span>;
  if (s === 'cancelled') return <span className="badge-red">{t('finance.voucher.cancelled')}</span>;
  return <span className="badge-gray">{t('finance.voucher.draft')}</span>;
}

const VOUCHER_TYPES = ['receipt', 'payment', 'journal', 'contra', 'sales', 'purchase'];

export default function Vouchers() {
  const { t, i18n } = useTranslation();
  const branches = useAuthStore(s => s.branches);

  const [filters, setFilters] = useState({
    q: '', type: '', status: '',
    branch_id: '', fiscal_period_id: '',
    from: '', to: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Reset to page 1 whenever a filter changes
  useEffect(() => { setPage(1); }, [filters, pageSize]);

  const params = { ...filters, page, page_size: pageSize };

  const { data, isLoading } = useQuery({
    queryKey: ['vouchers', filters, page, pageSize],
    queryFn: () => api.get('/api/finance/vouchers', { params }).then(r => r.data),
    keepPreviousData: true,
  });

  // Lazy-load fiscal periods for the filter dropdown
  const { data: fiscalPeriods } = useQuery({
    queryKey: ['fiscal-periods'],
    queryFn: () => api.get('/api/lookups/fiscal-periods').then(r => r.data).catch(() => []),
  });

  // For export: fetch all matching rows in a single call (capped at 5000)
  const { data: exportRows } = useQuery({
    queryKey: ['vouchers-export', filters],
    queryFn: () => api.get('/api/finance/vouchers', { params: { ...filters, page: 1, page_size: 5000 } }).then(r => r.data?.data || []),
    enabled: !!data,
  });

  const rows = data?.data || [];
  const total = Number(data?.total || 0);
  const sumDebit = Number(data?.totals?.sum_debit || 0);
  const sumCredit = Number(data?.totals?.sum_credit || 0);

  const isAr = i18n.language === 'ar';
  const label = (k) => t(`finance.voucher.${k}`) || k;

  const clearFilters = () => setFilters({ q: '', type: '', status: '', branch_id: '', fiscal_period_id: '', from: '', to: '' });
  const hasAnyFilter = Object.values(filters).some(v => v);

  const exportColumns = [
    { key: 'voucher_no',   label: label('no') },
    { key: 'voucher_type', label: label('type') },
    { key: 'voucher_date', label: label('date'),      format: fmtDate },
    { key: 'reference',    label: label('reference') },
    { key: 'narration',    label: label('narration') },
    { key: 'narration_ar', label: isAr ? 'البيان بالعربي' : 'Narration (AR)' },
    { key: 'total_debit',  label: label('debit'),   format: v => Number(v || 0).toFixed(3) },
    { key: 'total_credit', label: label('credit'),  format: v => Number(v || 0).toFixed(3) },
    { key: 'status',       label: t('common.status') },
    { key: 'branch_name',  label: t('common.branch'), format: (_, r) => r.Branch?.name || '' },
    { key: 'period_code',  label: 'FY', format: (_, r) => r.FiscalPeriod?.code || '' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText size={22} className="text-brand-700"/>
            {isAr ? 'قائمة السندات' : 'Voucher List'}
          </h1>
          {total > 0 && (
            <span className="inline-flex items-center bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-xs font-semibold">
              {total.toLocaleString()} {isAr ? 'سند' : 'vouchers'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportToolbar
            name="Mekky-Vouchers"
            rows={exportRows || rows}
            columns={exportColumns}
            title="Mekky International — Voucher List"
            subtitle={`${(exportRows || rows).length} rows${filters.from ? ` · from ${filters.from}` : ''}${filters.to ? ` · to ${filters.to}` : ''}${filters.type ? ` · type: ${filters.type}` : ''}${filters.status ? ` · status: ${filters.status}` : ''}`}
          />
          <Link to="/finance/vouchers/new" className="btn-primary"><Plus size={16}/> {t('finance.voucher.new')}</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="label">{t('common.search')}</label>
            <div className="relative">
              <Search className="absolute top-2.5 start-3 text-gray-400" size={16}/>
              <input
                className="input ps-9"
                placeholder={isAr ? 'رقم السند، المرجع، البيان...' : 'Voucher number, reference, narration...'}
                value={filters.q}
                onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">{label('type')}</label>
            <select className="input" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="">{t('common.all')}</option>
              {VOUCHER_TYPES.map(v => <option key={v} value={v} className="capitalize">{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{label('status')}</label>
            <select className="input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">{t('common.all')}</option>
              <option value="draft">{t('common.draft')}</option>
              <option value="posted">{t('common.posted')}</option>
              <option value="cancelled">{t('common.cancelled')}</option>
            </select>
          </div>

          <div>
            <label className="label">{t('common.from')}</label>
            <input type="date" className="input" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t('common.to')}</label>
            <input type="date" className="input" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t('common.branch')}</label>
            <select className="input" value={filters.branch_id} onChange={e => setFilters(f => ({ ...f, branch_id: e.target.value }))}>
              <option value="">{t('common.all_branches')}</option>
              {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{isAr ? 'السنة المالية' : 'Fiscal Period'}</label>
            <select className="input" value={filters.fiscal_period_id} onChange={e => setFilters(f => ({ ...f, fiscal_period_id: e.target.value }))}>
              <option value="">{t('common.all')}</option>
              {(fiscalPeriods || []).map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
          </div>

          {hasAnyFilter && (
            <div className="md:col-span-4">
              <button className="btn-ghost text-sm" onClick={clearFilters}>
                <RotateCcw size={12}/> {t('common.clear_filters')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Totals bar — always shows sum of debit/credit for the current filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="kpi bg-surface-violet">
          <div className="kpi-icon bg-white/70 text-brand-700"><FileText size={20}/></div>
          <div className="flex-1">
            <div className="text-xs text-gray-600">{isAr ? 'إجمالي السندات' : 'Total vouchers'}</div>
            <div className="text-2xl font-bold font-mono">{total.toLocaleString()}</div>
          </div>
        </div>
        <div className="kpi bg-surface-mint">
          <div className="kpi-icon bg-white/70 text-emerald-700"><FileText size={20}/></div>
          <div className="flex-1">
            <div className="text-xs text-gray-600">{isAr ? 'إجمالي المدين' : 'Total Debit'}</div>
            <div className="text-xl font-bold font-mono">{fmtMoney(sumDebit)}</div>
          </div>
        </div>
        <div className="kpi bg-surface-sky">
          <div className="kpi-icon bg-white/70 text-accent-700"><FileText size={20}/></div>
          <div className="flex-1">
            <div className="text-xs text-gray-600">{isAr ? 'إجمالي الدائن' : 'Total Credit'}</div>
            <div className="text-xl font-bold font-mono">{fmtMoney(sumCredit)}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{label('no')}</th>
                <th>{label('type')}</th>
                <th>{label('date')}</th>
                <th>{t('common.branch')}</th>
                <th>{label('reference')}</th>
                <th>{label('narration')}</th>
                <th className="text-end">{label('debit')}</th>
                <th className="text-end">{label('credit')}</th>
                <th>{label('status')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={9} className="text-center py-6 text-gray-500">{t('common.loading')}</td></tr>}
              {!isLoading && rows.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td>
                    <Link to={`/finance/vouchers/${v.id}`} className="text-brand-700 hover:underline font-mono text-xs">{v.voucher_no}</Link>
                  </td>
                  <td><span className="capitalize text-xs">{v.voucher_type}</span></td>
                  <td className="text-xs">{fmtDate(v.voucher_date)}</td>
                  <td className="text-xs">{v.Branch?.name || '—'}</td>
                  <td className="text-xs font-mono text-gray-500">{v.reference}</td>
                  <td className="max-w-xs truncate text-xs" title={v.narration_ar || v.narration}>
                    {isAr && v.narration_ar ? v.narration_ar : (v.narration || v.narration_ar || '')}
                  </td>
                  <td className="text-end font-mono">{fmtMoney(v.total_debit)}</td>
                  <td className="text-end font-mono">{fmtMoney(v.total_credit)}</td>
                  <td><StatusBadge s={v.status} t={t} /></td>
                </tr>
              ))}
              {!isLoading && !rows.length && <tr><td colSpan={9} className="text-center py-8 text-gray-500">{t('common.no_data')}</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} sizes={[25, 50, 100, 200]} />
      </div>
    </div>
  );
}
