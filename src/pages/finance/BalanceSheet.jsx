import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Printer, AlertTriangle, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';
import { useAuthStore } from '../../lib/auth';

function Section({ title, rows, total, ar }) {
  return (
    <div className="mt-6">
      <h3 className="font-semibold border-b border-gray-200 pb-1 mb-2">{title}</h3>
      <table className="table">
        <tbody>
          {(rows || []).map((r, i) => (
            <tr key={r.id ?? `ni-${i}`}>
              <td className="font-mono w-24">{r.code}</td>
              <td>{ar && r.name_ar ? r.name_ar : r.name}{r.subtype && <span className="text-xs text-gray-400 ms-2">{r.subtype}</span>}</td>
              <td className="text-end font-mono w-40">{fmtMoney(r.amount)}</td>
            </tr>
          ))}
          <tr className="font-semibold bg-gray-50 border-t">
            <td colSpan={2} className="text-end">Total {title}</td>
            <td className="text-end font-mono">{fmtMoney(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function BalanceSheet() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const [asOf, setAsOf] = useState(today);
  const currentBranchId = useAuthStore(s => s.currentBranchId);
  const branches = useAuthStore(s => s.branches);
  const [branchId, setBranchId] = useState(currentBranchId);

  const { data, isLoading } = useQuery({
    queryKey: ['bs', asOf, branchId],
    queryFn: () => api.get('/api/finance/reports/balance-sheet', { params: { as_of: asOf, branch_id: branchId } }).then(r => r.data),
  });

  const ar = i18n.language === 'ar';
  const balanced = data && Math.abs(Number(data.check)) < 0.005;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">{t('nav.balance_sheet') || 'Balance Sheet'}</h1>
        <button className="btn-secondary" onClick={() => window.print()}><Printer size={14} /> Print</button>
      </div>

      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <div>
            <label className="label">As Of</label>
            <input type="date" className="input" value={asOf} onChange={e => setAsOf(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('common.branch') || 'Branch'}</label>
            <select className="input" value={branchId || ''} onChange={e => setBranchId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t('common.all') || 'All'}</option>
              {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isLoading && <div className="card"><div className="card-body text-center text-gray-500 py-6">{t('common.loading')}</div></div>}

      {!isLoading && data && (
        <div className="card print:shadow-none">
          <div className="card-body">
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <h2 className="text-lg font-semibold">Balance Sheet</h2>
                <p className="text-sm text-gray-500">As at {asOf}</p>
              </div>
              <div className="text-end text-xs text-gray-500">
                Generated {new Date().toLocaleString()}
              </div>
            </div>

            <Section title="Assets" rows={data.asset} total={data.totals?.asset} ar={ar} />
            <Section title="Liabilities" rows={data.liability} total={data.totals?.liability} ar={ar} />
            <Section title="Equity" rows={data.equity} total={data.totals?.equity} ar={ar} />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-500">Total Assets</div>
                <div className="text-2xl font-semibold font-mono">{fmtMoney(data.totals?.asset)}</div>
              </div>
              <div className="rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-500">Total Liabilities + Equity</div>
                <div className="text-2xl font-semibold font-mono">{fmtMoney((data.totals?.liability || 0) + (data.totals?.equity || 0))}</div>
              </div>
            </div>

            <div className={`mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${balanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {balanced
                ? <><Check size={16}/> Balanced (A = L + E)</>
                : <><AlertTriangle size={16}/> Out of balance by {fmtMoney(Math.abs(Number(data.check)))}</>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
