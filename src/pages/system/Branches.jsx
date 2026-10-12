import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Pencil, Star, Power, X, Check, Building } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

function BranchFormModal({ open, onClose, initial, onSubmit, companies }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial || {});
  useEffect(() => { if (open) setForm(initial || {}); }, [open, initial]);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl">
        <div className="card-header">
          <h3 className="font-semibold">{initial?.id ? t('common.edit') : t('common.create')} — {t('nav.branches') || 'Branch'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={16}/></button>
        </div>
        <div className="card-body grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Company *</label>
            <select
              className="input"
              value={form.company_id || ''}
              onChange={e => set('company_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Select a company —</option>
              {(companies || []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">This branch belongs to which legal entity?</p>
          </div>
          <div>
            <label className="label">Code</label>
            <input className="input" value={form.code || ''} onChange={e => set('code', e.target.value)} placeholder="HQ, SHQ, KW1..." disabled={!!initial?.id} />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.is_active !== 0} onChange={e => set('is_active', e.target.checked ? 1 : 0)} />
              <span>Active</span>
            </label>
          </div>
          <div>
            <label className="label">Name (English)</label>
            <input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Name (Arabic)</label>
            <input className="input" value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} dir="rtl" />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <input className="input" value={form.address || ''} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Address (Arabic)</label>
            <input className="input" value={form.address_ar || ''} onChange={e => set('address_ar', e.target.value)} dir="rtl" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Manager</label>
            <input className="input" value={form.manager_name || ''} onChange={e => set('manager_name', e.target.value)} />
          </div>
          <div>
            <label className="label">CR Number</label>
            <input className="input" value={form.cr_number || ''} onChange={e => set('cr_number', e.target.value)} />
          </div>
          <div>
            <label className="label">Tax Number</label>
            <input className="input" value={form.tax_number || ''} onChange={e => set('tax_number', e.target.value)} />
          </div>
        </div>
        <div className="card-header !justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={() => onSubmit(form)}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
}

export default function Branches() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, initial: null });
  const setBranches = useAuthStore(s => s.setBranches);

  const { data, isLoading } = useQuery({
    queryKey: ['branches-with-stats'],
    queryFn: () => api.get('/api/branches', { params: { with_stats: 1 } }).then(r => {
      // Keep auth store branches in sync with admin-side list
      setBranches(r.data);
      return r.data;
    }),
  });
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/api/companies').then(r => r.data),
  });

  const saveMut = useMutation({
    mutationFn: (payload) => payload.id
      ? api.put(`/api/branches/${payload.id}`, payload).then(r => r.data)
      : api.post('/api/branches', payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const setDefaultMut = useMutation({
    mutationFn: (id) => api.post(`/api/branches/${id}/default`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); toast.success('Default updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const toggleActiveMut = useMutation({
    mutationFn: (b) => api.put(`/api/branches/${b.id}`, { is_active: b.is_active ? 0 : 1 }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); toast.success('Updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('nav.branches') || 'Branches'}</h1>
        <button className="btn-primary" onClick={() => setModal({ open: true, initial: { is_active: 1 } })}>
          <Plus size={16}/> {t('common.create')}
        </button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <table className="table">
            <thead>
              <tr>
                <th>{t('common.code')}</th>
                <th>{t('common.name')}</th>
                <th>{t('common.company')}</th>
                <th className="text-end">{t('common.employees_count')}</th>
                <th className="text-end">{t('common.monthly_gross')}</th>
                <th>{t('common.phone')}</th>
                <th>{t('common.manager')}</th>
                <th>{t('common.status')}</th>
                <th className="text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center text-gray-500 py-6">{t('common.loading')}</td></tr>}
              {!isLoading && (data || []).map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="font-mono">{b.code}</td>
                  <td>
                    <div className="font-medium flex items-center gap-2">
                      {i18n.language === 'ar' && b.name_ar ? b.name_ar : b.name}
                      {b.is_default ? <span className="badge badge-yellow inline-flex items-center gap-1"><Star size={11}/> default</span> : null}
                    </div>
                    {b.address && <div className="text-xs text-gray-500">{b.address}</div>}
                  </td>
                  <td>
                    {b.company_name ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Building size={12} className="text-brand-600"/>
                        {b.company_name}
                      </span>
                    ) : <span className="text-xs text-rose-600">— {t('common.select')} —</span>}
                  </td>
                  <td className="text-end font-mono">
                    {b.employee_count != null ? Number(b.employee_count) : '—'}
                    {b.active_count != null && (
                      <div className="text-[10px] text-emerald-700">{b.active_count} active</div>
                    )}
                  </td>
                  <td className="text-end font-mono">
                    {b.total_monthly_gross != null ? Number(b.total_monthly_gross).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '—'}
                  </td>
                  <td>{b.phone}</td>
                  <td>{b.manager_name}</td>
                  <td>
                    {b.is_active
                      ? <span className="badge badge-green inline-flex items-center gap-1"><Check size={11}/> {t('common.active')}</span>
                      : <span className="badge badge-gray">{t('common.inactive')}</span>}
                  </td>
                  <td className="text-end">
                    <div className="inline-flex gap-1">
                      {!b.is_default && (
                        <button className="p-1 text-gray-500 hover:text-yellow-600" title="Set as default"
                          onClick={() => setDefaultMut.mutate(b.id)}><Star size={14}/></button>
                      )}
                      <button className="p-1 text-gray-500 hover:text-brand-600" title="Edit"
                        onClick={() => setModal({ open: true, initial: { ...b } })}><Pencil size={14}/></button>
                      <button className="p-1 text-gray-500 hover:text-red-600" title="Toggle active"
                        onClick={() => toggleActiveMut.mutate(b)}><Power size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BranchFormModal open={modal.open} initial={modal.initial} companies={companies}
        onClose={() => setModal({ open: false })}
        onSubmit={(payload) => saveMut.mutate(payload)} />
    </div>
  );
}
