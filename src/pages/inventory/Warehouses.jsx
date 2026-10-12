import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, X, Warehouse as WarehouseIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

function WarehouseFormModal({ open, onClose, initial, onSubmit, branches }) {
  const [form, setForm] = useState(initial || { is_active: 1 });
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg">
        <div className="card-header"><h3 className="font-semibold">{initial?.id ? 'Edit' : 'New'} Warehouse</h3><button onClick={onClose}><X size={18}/></button></div>
        <div className="card-body grid grid-cols-2 gap-3">
          <div><label className="label">Code *</label><input className="input" value={form.code || ''} onChange={e => set('code', e.target.value.toUpperCase())} disabled={!!initial?.id} placeholder="WH-MAIN" /></div>
          <div className="flex items-end"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_active !== 0} onChange={e => set('is_active', e.target.checked ? 1 : 0)} /><span>Active</span></label></div>
          <div><label className="label">Name (EN) *</label><input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div><label className="label">Name (AR)</label><input className="input" dir="rtl" value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} /></div>
          <div className="col-span-2"><label className="label">Branch *</label>
            <select className="input" value={form.branch_id || ''} onChange={e => set('branch_id', Number(e.target.value))}>
              <option value="">Select...</option>
              {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address || ''} onChange={e => set('address', e.target.value)} /></div>
        </div>
        <div className="card-header !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => form.name && form.branch_id ? onSubmit(form) : toast.error('Name + branch required')}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Warehouses() {
  const qc = useQueryClient();
  const branches = useAuthStore(s => s.branches);
  const [modal, setModal] = useState({ open: false });
  const { data } = useQuery({ queryKey: ['warehouses-all'], queryFn: () => api.get('/api/inventory/stock/warehouses').then(r => r.data) });

  const saveMut = useMutation({
    mutationFn: (p) => p.id
      ? api.put(`/api/inventory/stock/warehouses/${p.id}`, p).then(r => r.data)
      : api.post('/api/inventory/stock/warehouses', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses-all'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Warehouses</h1>
        <button className="btn-primary" onClick={() => setModal({ open: true, initial: { is_active: 1 } })}><Plus size={16}/> Create</button>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Branch</th><th>Address</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data || []).map(w => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="font-mono text-xs">{w.code}</td>
                <td><div className="font-medium">{w.name}</div><div className="text-xs text-gray-500" dir="rtl">{w.name_ar}</div></td>
                <td className="text-sm">{(branches || []).find(b => b.id === w.branch_id)?.name || '—'}</td>
                <td className="text-xs text-gray-500">{w.address}</td>
                <td>{w.is_active ? <span className="badge-green">active</span> : <span className="badge-gray">inactive</span>}</td>
                <td className="text-end"><button className="p-1 text-gray-500 hover:text-brand-600" onClick={() => setModal({ open: true, initial: { ...w } })}><Pencil size={14}/></button></td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={6} className="text-center py-6 text-gray-500">No warehouses yet</td></tr>}
          </tbody>
        </table>
      </div>
      <WarehouseFormModal open={modal.open} initial={modal.initial} branches={branches}
        onClose={() => setModal({ open: false })} onSubmit={(p) => saveMut.mutate(p)} />
    </div>
  );
}
