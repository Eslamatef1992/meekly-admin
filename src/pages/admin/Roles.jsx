import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, X, Shield, Lock, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';

const PROTECTED_ROLES = ['super_admin', 'finance_manager', 'accountant', 'hr_manager', 'inventory_manager', 'sales', 'viewer'];

function PermissionsMatrix({ permissions, selected, onToggle, onToggleModule, disabled }) {
  if (!permissions) return null;
  const modules = Object.keys(permissions);
  return (
    <div className="border border-gray-200 rounded p-3 max-h-[60vh] overflow-y-auto">
      {modules.map(m => {
        const all = permissions[m];
        const selectedInModule = all.filter(p => selected.has(p.id)).length;
        const isAll = selectedInModule === all.length;
        const isPartial = selectedInModule > 0 && selectedInModule < all.length;
        return (
          <div key={m} className="mb-4">
            <label className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100 cursor-pointer">
              <input
                type="checkbox" disabled={disabled}
                checked={isAll} ref={el => { if (el) el.indeterminate = isPartial; }}
                onChange={() => onToggleModule(m, !isAll)}
              />
              <span className="font-semibold uppercase text-xs text-gray-700 tracking-wider">{m}</span>
              <span className="text-xs text-gray-400">{selectedInModule}/{all.length}</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 pl-6">
              {all.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm hover:bg-gray-50 px-2 py-1 rounded cursor-pointer">
                  <input type="checkbox" disabled={disabled} checked={selected.has(p.id)} onChange={() => onToggle(p.id)} />
                  <span>{p.name}</span>
                  <span className="text-xs text-gray-400 ms-auto font-mono">{p.code}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoleFormModal({ open, onClose, initial, onSubmit, permissions, isProtected }) {
  const [form, setForm] = useState(initial || {});
  const [selected, setSelected] = useState(new Set(initial?.permission_ids || []));

  useEffect(() => {
    setForm(initial || {});
    setSelected(new Set(initial?.permission_ids || []));
  }, [initial]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (id) => setSelected(s => { const ns = new Set(s); ns.has(id) ? ns.delete(id) : ns.add(id); return ns; });
  const toggleModule = (m, on) => {
    setSelected(s => {
      const ns = new Set(s);
      (permissions[m] || []).forEach(p => on ? ns.add(p.id) : ns.delete(p.id));
      return ns;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="card w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="card-header"><h3 className="font-semibold">{initial?.id ? 'Edit Role' : 'Create Role'}</h3><button onClick={onClose}><X size={18}/></button></div>
        <div className="card-body grid grid-cols-2 gap-3 overflow-y-auto">
          <div><label className="label">Code *</label><input className="input" disabled={!!initial?.id} value={form.code || ''} onChange={e => set('code', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} placeholder="custom_role" /></div>
          <div><label className="label">Name (EN) *</label><input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} disabled={isProtected} /></div>
          <div><label className="label">Name (AR)</label><input className="input" dir="rtl" value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} disabled={isProtected} /></div>
          <div><label className="label">Description</label><input className="input" value={form.description || ''} onChange={e => set('description', e.target.value)} disabled={isProtected} /></div>
          <div className="col-span-2">
            <label className="label">Permissions ({selected.size} selected)</label>
            <PermissionsMatrix
              permissions={permissions}
              selected={selected}
              onToggle={toggle}
              onToggleModule={toggleModule}
              disabled={isProtected && initial?.code === 'super_admin'}
            />
            {isProtected && initial?.code === 'super_admin' && (
              <p className="text-xs text-yellow-700 mt-2"><Lock size={12} className="inline mr-1"/> Super-admin has all permissions by definition.</p>
            )}
          </div>
        </div>
        <div className="card-header !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSubmit({ ...form, permission_ids: [...selected] })}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Roles() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false });

  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => api.get('/api/roles').then(r => r.data) });
  const { data: permissions } = useQuery({ queryKey: ['permissions-grouped'], queryFn: () => api.get('/api/roles/_/permissions').then(r => r.data) });

  const saveMut = useMutation({
    mutationFn: (p) => p.id ? api.put(`/api/roles/${p.id}`, p).then(r => r.data) : api.post('/api/roles', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/api/roles/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const openEdit = (role) => setModal({
    open: true,
    initial: { ...role, permission_ids: (role.Permissions || []).map(p => p.id) },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Roles &amp; Permissions</h1>
        <button className="btn-primary" onClick={() => setModal({ open: true, initial: { permission_ids: [] } })}><Plus size={16}/> Create Role</button>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Description</th><th className="text-end">Permissions</th><th>Type</th><th></th></tr></thead>
          <tbody>
            {(roles || []).map(r => {
              const isProtected = PROTECTED_ROLES.includes(r.code);
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="font-mono text-xs">{r.code}</td>
                  <td>{r.name}<div className="text-xs text-gray-500" dir="rtl">{r.name_ar}</div></td>
                  <td className="text-xs text-gray-500">{r.description}</td>
                  <td className="text-end font-mono">{r.Permissions?.length || 0}</td>
                  <td>{isProtected ? <span className="badge-yellow inline-flex items-center gap-1"><Shield size={11}/>built-in</span> : <span className="badge-gray">custom</span>}</td>
                  <td className="text-end">
                    <div className="inline-flex gap-1">
                      <button className="p-1 text-gray-500 hover:text-brand-600" onClick={() => openEdit(r)}><Pencil size={14}/></button>
                      {!isProtected && (
                        <button className="p-1 text-gray-500 hover:text-red-600" onClick={() => { if (confirm(`Delete role "${r.name}"?`)) delMut.mutate(r.id); }}><Trash2 size={14}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!roles?.length && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No roles</td></tr>}
          </tbody>
        </table>
      </div>

      <RoleFormModal
        open={modal.open}
        initial={modal.initial}
        onClose={() => setModal({ open: false })}
        onSubmit={(p) => saveMut.mutate(p)}
        permissions={permissions || {}}
        isProtected={PROTECTED_ROLES.includes(modal.initial?.code)}
      />
    </div>
  );
}
