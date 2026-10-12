import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, X } from 'lucide-react';
import { api } from '../../lib/api';

function CategoryFormModal({ open, onClose, initial, onSubmit }) {
  const [form, setForm] = useState(initial || {});
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="card-header"><h3 className="font-semibold">{initial?.id ? 'Edit Category' : 'New Category'}</h3><button onClick={onClose}><X size={18}/></button></div>
        <div className="card-body grid grid-cols-1 gap-3">
          <div><label className="label">Code</label><input className="input" value={form.code || ''} onChange={e => set('code', e.target.value)} placeholder="LIVING, BED, OFFICE..." /></div>
          <div><label className="label">Name (EN) *</label><input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div><label className="label">Name (AR)</label><input className="input" dir="rtl" value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} /></div>
        </div>
        <div className="card-header !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => form.name ? onSubmit(form) : toast.error('Name required')}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Categories() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false });
  const { data } = useQuery({ queryKey: ['item-categories'], queryFn: () => api.get('/api/inventory/items/_/categories').then(r => r.data) });

  const saveMut = useMutation({
    mutationFn: (p) => p.id
      ? api.put(`/api/inventory/items/_/categories/${p.id}`, p).then(r => r.data)
      : api.post('/api/inventory/items/_/categories', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['item-categories'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Item Categories</h1>
        <button className="btn-primary" onClick={() => setModal({ open: true, initial: {} })}><Plus size={16}/> Create</button>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th></th></tr></thead>
          <tbody>
            {(data || []).map(c => (
              <tr key={c.id}>
                <td className="font-mono text-xs">{c.code}</td>
                <td>{c.name}<div className="text-xs text-gray-500" dir="rtl">{c.name_ar}</div></td>
                <td className="text-end"><button className="p-1 text-gray-500 hover:text-brand-600" onClick={() => setModal({ open: true, initial: { ...c } })}><Pencil size={14}/></button></td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={3} className="text-center py-6 text-gray-500">No categories yet</td></tr>}
          </tbody>
        </table>
      </div>
      <CategoryFormModal open={modal.open} initial={modal.initial} onClose={() => setModal({ open: false })} onSubmit={(p) => saveMut.mutate(p)} />
    </div>
  );
}
