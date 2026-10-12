import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Building, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

function CompanyFormModal({ open, onClose, initial, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial || {});
  useEffect(() => { if (open) setForm(initial || {}); }, [open, initial]);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name) return toast.error(t('common.name_en') + ' *');
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg">
        <div className="card-header">
          <h3 className="font-semibold">{initial?.id ? t('common.edit') : t('common.create')} — {t('nav.company')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18}/></button>
        </div>
        <div className="card-body grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">{t('common.name_en')} *</label>
            <input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="MEKKY FURNITURE" />
          </div>
          <div className="col-span-2">
            <label className="label">{t('common.name_ar')}</label>
            <input className="input" dir="rtl" value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} placeholder="مكي للأثاث" />
          </div>
          <div>
            <label className="label">{t('common.code')}</label>
            <input
              className="input font-mono"
              value={form.code || ''}
              onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              disabled={!!initial?.id}
            />
          </div>
        </div>
        <div className="card-header !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={save}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
}

export default function Companies() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/api/companies').then(r => r.data),
  });

  const saveMut = useMutation({
    mutationFn: (p) => p.id ? api.put(`/api/companies/${p.id}`, p).then(r => r.data) : api.post('/api/companies', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });
  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/api/companies/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); toast.success('Deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cannot delete'),
  });

  const rows = data || [];
  const totalEmployees = rows.reduce((s, r) => s + Number(r.employee_count || 0), 0);
  const totalMonthlyGross = rows.reduce((s, r) => s + Number(r.total_monthly_gross || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{t('nav.companies')}</h1>
          <p className="text-sm text-gray-500">{i18n.language === 'ar' ? 'الكيانات القانونية / الأقسام التجارية لمكي إنترناشيونال.' : 'Legal entities / business divisions of Mekky International.'}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ open: true, initial: {} })}><Plus size={16}/> {t('common.create')} {t('nav.company')}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi bg-surface-violet">
          <div className="kpi-icon bg-white/70 text-brand-700"><Building size={20}/></div>
          <div>
            <div className="text-xs text-gray-600">{t('nav.companies')}</div>
            <div className="text-2xl font-bold">{rows.length}</div>
          </div>
        </div>
        <div className="kpi bg-surface-sky">
          <div className="kpi-icon bg-white/70 text-accent-700"><Users size={20}/></div>
          <div>
            <div className="text-xs text-gray-600">{t('common.employees_count')}</div>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </div>
        </div>
        <div className="kpi bg-surface-mint">
          <div className="kpi-icon bg-white/70 text-emerald-700"><Building size={20}/></div>
          <div>
            <div className="text-xs text-gray-600">{t('common.monthly_gross')}</div>
            <div className="text-xl font-bold font-mono">{fmtMoney(totalMonthlyGross)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t('common.code')}</th>
              <th>{t('common.name_en')}</th>
              <th>{t('common.name_ar')}</th>
              <th className="text-end">{t('common.employees_count')}</th>
              <th className="text-end">{t('common.active')}</th>
              <th className="text-end">{t('common.monthly_gross')} (KWD)</th>
              <th className="text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-6 text-gray-500">{t('common.loading')}</td></tr>}
            {rows.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="font-mono text-xs">{c.code}</td>
                <td className="font-medium">{c.name}</td>
                <td dir="rtl" className="text-gray-600">{c.name_ar || '—'}</td>
                <td className="text-end font-mono">{c.employee_count}</td>
                <td className="text-end font-mono">{c.active_count}</td>
                <td className="text-end font-mono">{fmtMoney(c.total_monthly_gross)}</td>
                <td className="text-end">
                  <div className="inline-flex gap-1">
                    <button className="p-1 text-gray-500 hover:text-brand-600" onClick={() => setModal({ open: true, initial: { ...c } })}><Pencil size={14}/></button>
                    <button className="p-1 text-gray-500 hover:text-red-600" onClick={() => { if (confirm(`${t('common.delete')} "${c.name}"?`)) delMut.mutate(c.id); }}><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !rows.length && <tr><td colSpan={7} className="text-center py-8 text-gray-500">{t('common.no_data')}</td></tr>}
          </tbody>
        </table>
      </div>

      <CompanyFormModal open={modal.open} initial={modal.initial} onClose={() => setModal({ open: false })} onSubmit={(p) => saveMut.mutate(p)} />
    </div>
  );
}
