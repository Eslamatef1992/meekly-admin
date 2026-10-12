import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

export default function TrialBalance() {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const yStart = new Date().getFullYear() + '-01-01';
  const [from, setFrom] = useState(yStart);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ['tb', from, to],
    queryFn: () => api.get('/api/finance/reports/trial-balance', { params: { from, to } }).then(r => r.data),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('finance.report.trial_balance')}</h1>
      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <div><label className="label">{t('common.from')}</label><input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div><label className="label">{t('common.to')}</label><input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} /></div>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th><th>Account</th><th>Type</th>
              <th className="text-end">Debit Movement</th>
              <th className="text-end">Credit Movement</th>
              <th className="text-end">Debit Balance</th>
              <th className="text-end">Credit Balance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-6">{t('common.loading')}</td></tr>}
            {!isLoading && (data?.rows || []).map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="font-mono">{r.code}</td>
                <td>{r.name} <span className="text-xs text-gray-400">{r.name_ar}</span></td>
                <td>{r.account_type}</td>
                <td className="text-end font-mono">{fmtMoney(r.debit_sum)}</td>
                <td className="text-end font-mono">{fmtMoney(r.credit_sum)}</td>
                <td className="text-end font-mono">{r.debit_balance ? fmtMoney(r.debit_balance) : ''}</td>
                <td className="text-end font-mono">{r.credit_balance ? fmtMoney(r.credit_balance) : ''}</td>
              </tr>
            ))}
            {data?.totals && (
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={3} className="text-end">{t('common.total')}</td>
                <td className="text-end font-mono">{fmtMoney(data.totals.debit_sum)}</td>
                <td className="text-end font-mono">{fmtMoney(data.totals.credit_sum)}</td>
                <td className="text-end font-mono">{fmtMoney(data.totals.debit_balance)}</td>
                <td className="text-end font-mono">{fmtMoney(data.totals.credit_balance)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
