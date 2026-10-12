import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, X } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

function ComponentFormModal({ open, onClose, initial, onSubmit }) {
  const [form, setForm] = useState(initial || { kind: 'allowance', calculation: 'fixed', is_active: 1 });
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl">
        <div className="card-header">
          <h3 className="font-semibold">{initial?.id ? 'Edit' : 'Create'} Salary Component</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18}/></button>
        </div>
        <div className="card-body grid grid-cols-2 gap-3">
          <div><label className="label">Code *</label><input className="input" value={form.code || ''} onChange={e => set('code', e.target.value.toUpperCase())} disabled={!!initial?.id} placeholder="MOBILE, FOOD..." /></div>
          <div><label className="label">Kind *</label>
            <select className="input" value={form.kind || 'allowance'} onChange={e => set('kind', e.target.value)}>
              <option value="allowance">Allowance (+)</option><option value="deduction">Deduction (−)</option>
            </select>
          </div>
          <div><label className="label">Name (English) *</label><input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div><label className="label">Name (Arabic)</label><input className="input" dir="rtl" value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} /></div>
          <div><label className="label">Calculation</label>
            <select className="input" value={form.calculation || 'fixed'} onChange={e => set('calculation', e.target.value)}>
              <option value="fixed">Fixed Amount</option><option value="percent_of_basic">% of Basic</option>
            </select>
          </div>
          <div><label className="label">Default Amount (KWD)</label><input type="number" step="0.001" className="input text-end font-mono" value={form.default_amount || 0} onChange={e => set('default_amount', e.target.value)} /></div>
          <div><label className="label">Default %</label><input type="number" step="0.01" className="input text-end font-mono" value={form.default_percent || 0} onChange={e => set('default_percent', e.target.value)} /></div>
          <div className="flex items-end"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.affects_eos === 1} onChange={e => set('affects_eos', e.target.checked ? 1 : 0)} /><span>Affects EOS calculation</span></label></div>
          <div className="col-span-2"><label className="label">Notes</label><input className="input" value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
        </div>
        <div className="card-header !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSubmit(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function SalaryComponents() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false });
  const { data, isLoading } = useQuery({
    queryKey: ['salary-components'],
    queryFn: () => api.get('/api/hr/salary-components').then(r => r.data),
  });
  const saveMut = useMutation({
    mutationFn: (p) => p.id ? api.put(`/api/hr/salary-components/${p.id}`, p).then(r => r.data) : api.post('/api/hr/salary-components', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-components'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Salary Components</h1>
        <button className="btn-primary" onClick={() => setModal({ open: true, initial: { kind: 'allowance', is_active: 1 } })}><Plus size={16}/> Create</button>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Kind</th><th>Calculation</th><th className="text-end">Default Amount</th><th className="text-end">Default %</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className="text-center py-6">Loading...</td></tr>}
            {!isLoading && (data?.data || data || []).map(c => (
              <tr key={c.id}>
                <td className="font-mono">{c.code}</td>
                <td>{c.name} <div className="text-xs text-gray-500" dir="rtl">{c.name_ar}</div></td>
                <td><span className={c.kind === 'allowance' ? 'badge-green' : 'badge-red'}>{c.kind}</span></td>
                <td className="text-xs">{c.calculation}</td>
                <td className="text-end font-mono">{fmtMoney(c.default_amount)}</td>
                <td className="text-end font-mono">{Number(c.default_percent) || '-'}</td>
                <td>{c.is_active ? <span className="badge-green">active</span> : <span className="badge-gray">inactive</span>}</td>
                <td className="text-end"><button className="p-1 text-gray-500 hover:text-brand-600" onClick={() => setModal({ open: true, initial: { ...c } })}><Pencil size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ComponentFormModal open={modal.open} initial={modal.initial} onClose={() => setModal({ open: false })} onSubmit={(p) => saveMut.mutate(p)} />
    </div>
  );
}
