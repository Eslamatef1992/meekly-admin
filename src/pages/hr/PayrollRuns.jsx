import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { fmtDate, fmtMoney } from '../../lib/format';

function NewRunModal({ open, onClose, onSubmit, branches }) {
  const today = new Date();
  const [form, setForm] = useState({
    branch_id: '',
    period_year: today.getFullYear(),
    period_month: today.getMonth() + 1,
    pay_date: today.toISOString().slice(0, 10),
    notes: '',
  });
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg">
        <div className="card-header"><h3 className="font-semibold">New Payroll Run</h3><button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18}/></button></div>
        <div className="card-body grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Branch *</label>
            <select className="input" value={form.branch_id} onChange={e => set('branch_id', Number(e.target.value))}>
              <option value="">Select...</option>
              {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div><label className="label">Year *</label><input type="number" className="input" value={form.period_year} onChange={e => set('period_year', Number(e.target.value))} /></div>
          <div><label className="label">Month *</label>
            <select className="input" value={form.period_month} onChange={e => set('period_month', Number(e.target.value))}>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Pay Date *</label><input type="date" className="input" value={form.pay_date} onChange={e => set('pay_date', e.target.value)} /></div>
          <div className="col-span-2"><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          <div className="col-span-2 text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-200">
            This will calculate payslips for all <strong>active</strong> employees in the selected branch. You can review the calculated run and post it (creates GL entry) when ready.
          </div>
        </div>
        <div className="card-header !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => form.branch_id ? onSubmit(form) : toast.error('Branch required')}>Calculate Payroll</button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollRuns() {
  const qc = useQueryClient();
  const branches = useAuthStore(s => s.branches);
  const currentBranchId = useAuthStore(s => s.currentBranchId);
  const [modal, setModal] = useState(false);
  const [branchFilter, setBranchFilter] = useState(currentBranchId);

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-runs', branchFilter],
    queryFn: () => api.get('/api/hr/payroll/runs', { params: { branch_id: branchFilter } }).then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (payload) => api.post('/api/hr/payroll/runs', payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll-runs'] }); toast.success('Payroll calculated'); setModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Payroll Runs</h1>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16}/> New Run</button>
      </div>
      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <select className="input max-w-xs" value={branchFilter || ''} onChange={e => setBranchFilter(e.target.value ? Number(e.target.value) : null)}>
            <option value="">All branches</option>
            {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Run #</th><th>Period</th><th>Branch</th><th>Pay Date</th><th>Status</th><th className="text-end">Employees</th><th className="text-end">Total Gross</th><th className="text-end">Total Net</th><th></th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="text-center py-6">Loading...</td></tr>}
            {(data?.data || []).map(r => (
              <tr key={r.id}>
                <td className="font-mono">{r.run_no}</td>
                <td>{r.period_year}-{String(r.period_month).padStart(2, '0')}</td>
                <td>{r.Branch?.name || r.branch_id}</td>
                <td>{fmtDate(r.pay_date)}</td>
                <td>
                  <span className={
                    r.status === 'posted' ? 'badge-green' :
                    r.status === 'calculated' ? 'badge-blue' :
                    r.status === 'cancelled' ? 'badge-red' : 'badge-gray'
                  }>{r.status}</span>
                </td>
                <td className="text-end font-mono">{r.employee_count}</td>
                <td className="text-end font-mono">{fmtMoney(r.total_gross)}</td>
                <td className="text-end font-mono font-semibold">{fmtMoney(r.total_net)}</td>
                <td className="text-end"><Link to={`/hr/payroll/${r.id}`} className="text-brand-600 hover:underline text-xs">Open →</Link></td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && <tr><td colSpan={9} className="text-center py-8 text-gray-500">No payroll runs yet</td></tr>}
          </tbody>
        </table>
      </div>
      <NewRunModal open={modal} onClose={() => setModal(false)} onSubmit={(p) => createMut.mutate(p)} branches={branches} />
    </div>
  );
}
