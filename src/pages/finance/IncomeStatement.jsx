import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';
import { useAuthStore } from '../../lib/auth';

export default function IncomeStatement() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const yStart = new Date().getFullYear() + '-01-01';
  const [from, setFrom] = useState(yStart);
  const [to, setTo] = useState(today);
  const currentBranchId = useAuthStore(s => s.currentBranchId);
  const branches = useAuthStore(s => s.branches);
  const [branchId, setBranchId] = useState(currentBranchId);

  const { data, isLoading } = useQuery({
    queryKey: ['pnl', from, to, branchId],
    queryFn: () => api.get('/api/finance/reports/income-statement', { params: { from, to, branch_id: branchId } }).then(r => r.data),
  });

  const ar = i18n.language === 'ar';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">{t('nav.income_statement') || 'Income Statement (P&L)'}</h1>
        <button className="btn-secondary" onClick={() => window.print()}><Printer size={14} /> Print</button>
      </div>

      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <div>
            <label className="label">{t('common.from')}</label>
            <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('common.to')}</label>
            <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
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
            <div className="flex justify-between items-baseline mb-4">
              <div>
                <h2 className="text-lg font-semibold">Income Statement</h2>
                <p className="text-sm text-gray-500">For the period {from} to {to}</p>
              </div>
              <div className="text-end text-xs text-gray-500">
                Generated {new Date().toLocaleString()}
              </div>
            </div>

            {/* INCOME */}
            <div className="mt-4">
              <h3 className="font-semibold border-b border-gray-200 pb-1 mb-2">Revenue / Income</h3>
              <table className="table">
                <tbody>
                  {(data.income || []).map(r => (
                    <tr key={r.id}>
                      <td className="font-mono w-24">{r.code}</td>
                      <td>{ar && r.name_ar ? r.name_ar : r.name}</td>
                      <td className="text-end font-mono w-40">{fmtMoney(r.amount)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-gray-50 border-t">
                    <td colSpan={2} className="text-end">Total Revenue</td>
                    <td className="text-end font-mono">{fmtMoney(data.totalIncome)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* EXPENSE */}
            <div className="mt-6">
              <h3 className="font-semibold border-b border-gray-200 pb-1 mb-2">Expenses</h3>
              <table className="table">
                <tbody>
                  {(data.expense || []).map(r => (
                    <tr key={r.id}>
                      <td className="font-mono w-24">{r.code}</td>
                      <td>{ar && r.name_ar ? r.name_ar : r.name}</td>
                      <td className="text-end font-mono w-40">{fmtMoney(r.amount)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-gray-50 border-t">
                    <td colSpan={2} className="text-end">Total Expenses</td>
                    <td className="text-end font-mono">{fmtMoney(data.totalExpense)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* NET */}
            <div className="mt-6 flex justify-end">
              <div className={`rounded-lg px-6 py-3 text-lg font-semibold ${data.netIncome >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                Net {data.netIncome >= 0 ? 'Income' : 'Loss'}: {fmtMoney(Math.abs(data.netIncome))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
