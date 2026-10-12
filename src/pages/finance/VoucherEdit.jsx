import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Send, Ban, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';
import { useAuthStore } from '../../lib/auth';

const emptyLine = () => ({ account_id: '', description: '', debit: 0, credit: 0 });

export default function VoucherEdit() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = !!id;
  const currentBranchId = useAuthStore(s => s.currentBranchId);
  const branches = useAuthStore(s => s.branches);
  const [voucher, setVoucher] = useState({
    voucher_type: 'journal',
    voucher_date: new Date().toISOString().slice(0, 10),
    branch_id: currentBranchId,
    currency_id: 1,
    reference: '',
    narration: '',
    lines: [emptyLine(), emptyLine()],
    status: 'draft',
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts-list'],
    queryFn: () => api.get('/api/finance/accounts', { params: { is_group: false } }).then(r => r.data),
  });
  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => api.get('/api/lookups/currencies').then(r => r.data),
  });

  useEffect(() => {
    if (editing) {
      api.get(`/api/finance/vouchers/${id}`).then(r => {
        const v = r.data;
        setVoucher({
          ...v,
          lines: (v.lines || []).map(l => ({
            id: l.id, account_id: l.account_id, description: l.description, debit: Number(l.debit), credit: Number(l.credit),
          })),
        });
      });
    }
  }, [id, editing]);

  const setLine = (i, k, val) => setVoucher(v => {
    const lines = [...v.lines];
    lines[i] = { ...lines[i], [k]: val };
    if (k === 'debit' && Number(val) > 0) lines[i].credit = 0;
    if (k === 'credit' && Number(val) > 0) lines[i].debit = 0;
    return { ...v, lines };
  });
  const addLine = () => setVoucher(v => ({ ...v, lines: [...v.lines, emptyLine()] }));
  const removeLine = (i) => setVoucher(v => ({ ...v, lines: v.lines.filter((_, idx) => idx !== i) }));

  const totals = useMemo(() => {
    let d = 0, c = 0;
    voucher.lines.forEach(l => { d += Number(l.debit || 0); c += Number(l.credit || 0); });
    return { d: Math.round(d * 1000) / 1000, c: Math.round(c * 1000) / 1000, diff: Math.round((d - c) * 1000) / 1000 };
  }, [voucher.lines]);

  const save = async () => {
    if (totals.diff !== 0) return toast.error(`Unbalanced: ${totals.diff}`);
    try {
      if (editing) {
        toast.error('Editing posted/draft vouchers — re-create instead in this build');
      } else {
        const { data } = await api.post('/api/finance/vouchers', voucher);
        toast.success('Voucher saved as draft: ' + data.voucher_no);
        navigate(`/finance/vouchers/${data.id}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  const post = async () => {
    try {
      await api.post(`/api/finance/vouchers/${id}/post`);
      toast.success('Posted');
      const fresh = await api.get(`/api/finance/vouchers/${id}`);
      setVoucher(v => ({ ...v, status: fresh.data.status, posted_at: fresh.data.posted_at }));
    } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const cancelV = async () => {
    if (!confirm('Cancel this voucher?')) return;
    try {
      await api.post(`/api/finance/vouchers/${id}/cancel`);
      toast.success('Cancelled');
      setVoucher(v => ({ ...v, status: 'cancelled' }));
    } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const isLocked = voucher.status === 'posted' || voucher.status === 'cancelled';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded hover:bg-gray-100"><ArrowLeft size={18}/></button>
          <h1 className="text-2xl font-semibold">
            {editing ? voucher.voucher_no : t('finance.voucher.new')}
          </h1>
          {editing && (
            <span className={voucher.status === 'posted' ? 'badge-green' : voucher.status === 'cancelled' ? 'badge-red' : 'badge-gray'}>
              {voucher.status}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {editing && voucher.status === 'draft' && <button className="btn-primary" onClick={post}><Send size={14}/> {t('finance.voucher.post')}</button>}
          {editing && voucher.status === 'posted' && <button className="btn-danger" onClick={cancelV}><Ban size={14}/> {t('finance.voucher.cancel_voucher')}</button>}
          {!editing && <button className="btn-primary" onClick={save}>{t('common.save')}</button>}
        </div>
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="label">{t('finance.voucher.type')}</label>
            <select className="input" disabled={isLocked || editing} value={voucher.voucher_type} onChange={e => setVoucher(v => ({ ...v, voucher_type: e.target.value }))}>
              <option value="receipt">Receipt</option>
              <option value="payment">Payment</option>
              <option value="journal">Journal</option>
              <option value="contra">Contra</option>
              <option value="sales">Sales</option>
              <option value="purchase">Purchase</option>
            </select>
          </div>
          <div>
            <label className="label">Branch</label>
            <select className="input" disabled={isLocked || editing} value={voucher.branch_id || ''} onChange={e => setVoucher(v => ({ ...v, branch_id: Number(e.target.value) }))}>
              {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('finance.voucher.date')}</label>
            <input type="date" disabled={isLocked} className="input" value={voucher.voucher_date?.slice(0,10) || ''} onChange={e => setVoucher(v => ({ ...v, voucher_date: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t('finance.voucher.currency')}</label>
            <select className="input" disabled={isLocked || editing} value={voucher.currency_id} onChange={e => setVoucher(v => ({ ...v, currency_id: Number(e.target.value) }))}>
              {(currencies || []).map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('finance.voucher.reference')}</label>
            <input className="input" disabled={isLocked} value={voucher.reference || ''} onChange={e => setVoucher(v => ({ ...v, reference: e.target.value }))} />
          </div>
          <div className="md:col-span-4">
            <label className="label">{t('finance.voucher.narration')}</label>
            <input className="input" disabled={isLocked} value={voucher.narration || ''} onChange={e => setVoucher(v => ({ ...v, narration: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">{t('finance.voucher.lines')}</h3>
          {!isLocked && <button className="btn-secondary !py-1 text-xs" onClick={addLine}><Plus size={14}/> Line</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>{t('finance.voucher.account')}</th>
                <th>{t('finance.voucher.narration')}</th>
                <th className="w-32 text-end">{t('finance.voucher.debit')}</th>
                <th className="w-32 text-end">{t('finance.voucher.credit')}</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {voucher.lines.map((ln, i) => (
                <tr key={i}>
                  <td className="text-gray-500">{i+1}</td>
                  <td>
                    <select className="input" disabled={isLocked} value={ln.account_id || ''} onChange={e => setLine(i, 'account_id', Number(e.target.value))}>
                      <option value="">—</option>
                      {(accounts || []).map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                    </select>
                  </td>
                  <td><input className="input" disabled={isLocked} value={ln.description || ''} onChange={e => setLine(i, 'description', e.target.value)} /></td>
                  <td><input type="number" step="0.001" className="input text-end" disabled={isLocked} value={ln.debit  || 0} onChange={e => setLine(i, 'debit',  e.target.value)} /></td>
                  <td><input type="number" step="0.001" className="input text-end" disabled={isLocked} value={ln.credit || 0} onChange={e => setLine(i, 'credit', e.target.value)} /></td>
                  <td className="text-end">
                    {!isLocked && voucher.lines.length > 2 && (
                      <button className="p-1 text-gray-400 hover:text-red-600" onClick={() => removeLine(i)}><Trash2 size={14}/></button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td colSpan={3} className="text-end">{t('finance.voucher.totals')}</td>
                <td className="text-end font-mono">{fmtMoney(totals.d)}</td>
                <td className="text-end font-mono">{fmtMoney(totals.c)}</td>
                <td></td>
              </tr>
              {totals.diff !== 0 && (
                <tr className="bg-red-50">
                  <td colSpan={3} className="text-end text-red-700">Difference</td>
                  <td colSpan={2} className="text-end text-red-700 font-mono">{fmtMoney(totals.diff)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
