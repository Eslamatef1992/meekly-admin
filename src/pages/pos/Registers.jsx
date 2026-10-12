import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

function RegisterForm({ open, onClose, initial, onSubmit, branches, warehouses }) {
  const [form, setForm] = useState(initial || { is_active: 1 });
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg">
        <div className="card-header"><h3 className="font-semibold">{initial?.id ? 'Edit' : 'Create'} Register</h3><button onClick={onClose}><X size={18}/></button></div>
        <div className="card-body grid grid-cols-2 gap-3">
          <div><label className="label">Code *</label><input className="input" value={form.code || ''} onChange={e => set('code', e.target.value.toUpperCase())} disabled={!!initial?.id} placeholder="POS-01" /></div>
          <div className="flex items-end"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_active !== 0} onChange={e => set('is_active', e.target.checked ? 1 : 0)} /><span>Active</span></label></div>
          <div><label className="label">Name (EN) *</label><input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div><label className="label">Name (AR)</label><input className="input" dir="rtl" value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} /></div>
          <div><label className="label">Branch *</label>
            <select className="input" value={form.branch_id || ''} onChange={e => set('branch_id', Number(e.target.value))}>
              <option value="">Select...</option>
              {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div><label className="label">Warehouse *</label>
            <select className="input" value={form.warehouse_id || ''} onChange={e => set('warehouse_id', Number(e.target.value))}>
              <option value="">Select...</option>
              {(warehouses || []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        <div className="card-header !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSubmit(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Registers() {
  const qc = useQueryClient();
  const branches = useAuthStore(s => s.branches);
  const [modal, setModal] = useState({ open: false });

  const { data } = useQuery({ queryKey: ['pos-registers-all'], queryFn: () => api.get('/api/pos/registers').then(r => r.data) });
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => api.get('/api/lookups/warehouses').then(r => r.data) });

  const saveMut = useMutation({
    mutationFn: (p) => p.id ? api.put(`/api/pos/registers/${p.id}`, p).then(r => r.data) : api.post('/api/pos/registers', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pos-registers-all'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Registers</h1>
        <button className="btn-primary" onClick={() => setModal({ open: true, initial: { is_active: 1 } })}><Plus size={16}/> Create</button>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Branch</th><th>Warehouse</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data || []).map(r => (
              <tr key={r.id}>
                <td className="font-mono">{r.code}</td>
                <td>{r.name}<div className="text-xs text-gray-500" dir="rtl">{r.name_ar}</div></td>
                <td>{r.Branch?.name}</td>
                <td>{r.Warehouse?.name || <span className="text-red-600 text-xs">— not set —</span>}</td>
                <td>{r.is_active ? <span className="badge-green">active</span> : <span className="badge-gray">inactive</span>}</td>
                <td className="text-end"><button className="p-1 text-gray-500 hover:text-brand-600" onClick={() => setModal({ open: true, initial: { ...r } })}><Pencil size={14}/></button></td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={6} className="text-center text-gray-500 py-6">No registers yet</td></tr>}
          </tbody>
        </table>
      </div>
      <RegisterForm open={modal.open} initial={modal.initial} branches={branches} warehouses={warehouses}
        onClose={() => setModal({ open: false })} onSubmit={(p) => saveMut.mutate(p)} />
    </div>
  );
}
