import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { fmtMoney, fmtDate } from '../../lib/format';

export default function GeneralLedger() {
  const { t } = useTranslation();
  const yStart = new Date().getFullYear() + '-01-01';
  const today  = new Date().toISOString().slice(0, 10);
  const [accountId, setAccountId] = useState('');
  const [from, setFrom] = useState(yStart);
  const [to, setTo] = useState(today);

  const { data: accounts } = useQuery({
    queryKey: ['accounts-list-gl'],
    queryFn: () => api.get('/api/finance/accounts', { params: { is_group: false } }).then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['gl', accountId, from, to],
    queryFn: () => api.get('/api/finance/reports/general-ledger', { params: { account_id: accountId, from, to } }).then(r => r.data),
    enabled: !!accountId,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('finance.report.general_ledger')}</h1>
      <div className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="label">Account</label>
            <select className="input" value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="">— select —</option>
              {(accounts || []).map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div><label className="label">{t('common.from')}</label><input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div><label className="label">{t('common.to')}</label><input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} /></div>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Voucher</th><th>Narration</th>
              <th className="text-end">Debit</th>
              <th className="text-end">Credit</th>
              <th className="text-end">{t('finance.report.running')}</th>
            </tr>
          </thead>
          <tbody>
            {!accountId && <tr><td colSpan={6} className="text-center py-6 text-gray-500">Select an account</td></tr>}
            {accountId && isLoading && <tr><td colSpan={6} className="text-center py-6">{t('common.loading')}</td></tr>}
            {accountId && data && (
              <>
                <tr className="bg-gray-50 font-medium">
                  <td colSpan={5} className="text-end">{t('finance.report.opening')}</td>
                  <td className="text-end font-mono">{fmtMoney(data.opening)}</td>
                </tr>
                {data.rows.map(r => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.entry_date)}</td>
                    <td className="font-mono">{r.voucher_no}</td>
                    <td>{r.narration}</td>
                    <td className="text-end font-mono">{Number(r.debit) ? fmtMoney(r.debit) : ''}</td>
                    <td className="text-end font-mono">{Number(r.credit) ? fmtMoney(r.credit) : ''}</td>
                    <td className="text-end font-mono">{fmtMoney(r.running_balance)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={5} className="text-end">{t('finance.report.closing')}</td>
                  <td className="text-end font-mono">{fmtMoney(data.closing)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
