import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, KeyRound, Power, X, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';

function UserFormModal({ open, onClose, initial, onSubmit, roles, branches }) {
  const [form, setForm] = useState({ is_active: 1, role_ids: [], branch_ids: [] });

  // Reset state every time the modal opens with new initial values.
  // Without this, the form keeps the previously-edited user's role_ids/branch_ids.
  useEffect(() => {
    if (open) {
      const init = initial || {};
      setForm({
        is_active: 1,
        role_ids: [],
        branch_ids: [],
        ...init,
        // Normalize the arrays in case they're undefined or come from a different shape
        role_ids: Array.isArray(init.role_ids) ? init.role_ids.map(Number) : [],
        branch_ids: Array.isArray(init.branch_ids) ? init.branch_ids.map(Number) : [],
      });
    }
  }, [open, initial]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleId = (key, id) => {
    const numId = Number(id);
    setForm(f => {
      const arr = (f[key] || []).map(Number);
      return { ...f, [key]: arr.includes(numId) ? arr.filter(x => x !== numId) : [...arr, numId] };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="card w-full max-w-2xl max-h-[95vh] flex flex-col">
        <div className="card-header"><h3 className="font-semibold">{initial?.id ? 'Edit User' : 'Create User'}</h3><button onClick={onClose}><X size={18}/></button></div>
        <div className="card-body grid grid-cols-2 gap-3 overflow-y-auto">
          <div><label className="label">Email *</label><input type="email" className="input" disabled={!!initial?.id} value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
          <div><label className="label">Username</label><input className="input" value={form.username || ''} onChange={e => set('username', e.target.value)} /></div>
          <div><label className="label">Full Name (EN) *</label><input className="input" value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} /></div>
          <div><label className="label">Full Name (AR)</label><input className="input" dir="rtl" value={form.full_name_ar || ''} onChange={e => set('full_name_ar', e.target.value)} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
          <div><label className="label">Default Branch</label>
            <select className="input" value={form.default_branch_id || ''} onChange={e => set('default_branch_id', e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {!initial?.id && (
            <div className="col-span-2"><label className="label">Initial Password</label><input className="input" type="text" value={form.password || ''} onChange={e => set('password', e.target.value)} placeholder="Leave blank for Welcome@123" /></div>
          )}

          <div className="col-span-2">
            <label className="label">Roles</label>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
              {(roles || []).map(r => (
                <label key={r.id} className="flex items-center gap-2 text-sm hover:bg-gray-50 px-2 py-1 rounded cursor-pointer">
                  <input type="checkbox" checked={(form.role_ids || []).map(Number).includes(Number(r.id))} onChange={() => toggleId('role_ids', r.id)} />
                  <span>{r.name}</span>
                  <span className="text-xs text-gray-400 ms-auto font-mono">{r.code}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <label className="label">Accessible Branches</label>
            <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
              {(branches || []).map(b => (
                <label key={b.id} className="flex items-center gap-2 text-sm hover:bg-gray-50 px-2 py-1 rounded cursor-pointer">
                  <input type="checkbox" checked={(form.branch_ids || []).map(Number).includes(Number(b.id))} onChange={() => toggleId('branch_ids', b.id)} />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Super-admins automatically see all branches.</p>
          </div>

          <div className="col-span-2 flex items-end">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.is_active !== 0} onChange={e => set('is_active', e.target.checked ? 1 : 0)} />
              <span>Active</span>
            </label>
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

export default function Users() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false });
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', q],
    queryFn: () => api.get('/api/users', { params: { q } }).then(r => r.data),
  });
  const { data: roles } = useQuery({ queryKey: ['roles-list'], queryFn: () => api.get('/api/users/_/roles').then(r => r.data) });
  const { data: branches } = useQuery({ queryKey: ['branches-list'], queryFn: () => api.get('/api/users/_/branches').then(r => r.data) });

  const loadOne = async (id) => {
    const r = await api.get(`/api/users/${id}`);
    const u = r.data;
    return {
      ...u,
      role_ids: (u.Roles || []).map(r => Number(r.id)),
      branch_ids: (u.branch_ids || []).map(Number),
    };
  };

  const saveMut = useMutation({
    mutationFn: (p) => p.id ? api.put(`/api/users/${p.id}`, p).then(r => r.data) : api.post('/api/users', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const resetMut = useMutation({
    mutationFn: (id) => api.post(`/api/users/${id}/reset-password`).then(r => r.data),
    onSuccess: (d) => toast.success(`New password: ${d.password}`, { duration: 12000 }),
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const toggleMut = useMutation({
    mutationFn: (u) => api.put(`/api/users/${u.id}`, { is_active: u.is_active ? 0 : 1 }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const rows = data?.data || data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Users</h1>
        <button className="btn-primary" onClick={() => setModal({ open: true, initial: { is_active: 1, role_ids: [], branch_ids: [] } })}><Plus size={16}/> Create User</button>
      </div>

      <div className="card">
        <div className="card-body">
          <input className="input max-w-sm" placeholder="Search by name, email, username..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th><th>Name</th><th>Roles</th><th>Last Login</th><th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center py-6">Loading...</td></tr>}
            {rows.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="font-mono text-xs">{u.email}</td>
                <td>{u.full_name}<div className="text-xs text-gray-500" dir="rtl">{u.full_name_ar}</div></td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {(u.Roles || []).map(r => <span key={r.id} className="badge-blue text-xs">{r.code}</span>)}
                  </div>
                </td>
                <td className="text-xs">{u.last_login_at ? fmtDate(u.last_login_at) : '—'}</td>
                <td>{u.is_active ? <span className="badge-green inline-flex items-center gap-1"><Check size={11}/>active</span> : <span className="badge-gray">inactive</span>}</td>
                <td className="text-end">
                  <div className="inline-flex gap-1">
                    <button className="p-1 text-gray-500 hover:text-brand-600" title="Edit"
                      onClick={async () => setModal({ open: true, initial: await loadOne(u.id) })}><Pencil size={14}/></button>
                    <button className="p-1 text-gray-500 hover:text-yellow-600" title="Reset Password"
                      onClick={() => { if (confirm('Reset this user\'s password?')) resetMut.mutate(u.id); }}><KeyRound size={14}/></button>
                    <button className="p-1 text-gray-500 hover:text-red-600" title="Toggle Active"
                      onClick={() => toggleMut.mutate(u)}><Power size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !rows.length && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No users found</td></tr>}
          </tbody>
        </table>
      </div>

      <UserFormModal open={modal.open} initial={modal.initial} roles={roles} branches={branches}
        onClose={() => setModal({ open: false })} onSubmit={(p) => saveMut.mutate(p)} />
    </div>
  );
}
