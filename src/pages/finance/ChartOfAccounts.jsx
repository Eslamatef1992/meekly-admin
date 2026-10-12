import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';

function AccountRow({ node, depth = 0, onEdit, onAddChild, onDelete, expanded, toggle }) {
  const isOpen = !!expanded[node.id];
  const hasChildren = (node.children || []).length > 0;
  return (
    <>
      <tr className="hover:bg-gray-50">
        <td>
          <div className="flex items-center" style={{ paddingInlineStart: depth * 18 }}>
            {hasChildren ? (
              <button onClick={() => toggle(node.id)} className="me-1 text-gray-500 rtl:rotate-180">
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : <span className="inline-block w-4 me-1" />}
            <span className="font-mono">{node.code}</span>
            <span className="mx-2 text-gray-300">·</span>
            <span>{node.name}</span>
            {node.name_ar && <span className="text-gray-400 ms-2 text-xs">{node.name_ar}</span>}
            {node.is_group ? <span className="ms-2 badge badge-gray">group</span> : null}
          </div>
        </td>
        <td>{node.account_type}</td>
        <td>{node.normal_balance}</td>
        <td className="text-end">
          <div className="inline-flex gap-1">
            <button onClick={() => onAddChild(node)} className="p-1 text-gray-500 hover:text-brand-600" title="Add child"><Plus size={14}/></button>
            <button onClick={() => onEdit(node)} className="p-1 text-gray-500 hover:text-brand-600" title="Edit"><Pencil size={14}/></button>
            <button onClick={() => onDelete(node)} className="p-1 text-gray-500 hover:text-red-600" title="Delete"><Trash2 size={14}/></button>
          </div>
        </td>
      </tr>
      {isOpen && (node.children || []).map(c => (
        <AccountRow key={c.id} node={c} depth={depth + 1} onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete} expanded={expanded} toggle={toggle} />
      ))}
    </>
  );
}

function AccountFormModal({ open, onClose, initial, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial || {});
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg">
        <div className="card-header">
          <h3 className="font-semibold">{initial?.id ? t('common.edit') : t('common.create')} — {t('nav.chart_of_accounts')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={16}/></button>
        </div>
        <div className="card-body grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('finance.account.code')}</label>
            <input className="input" value={form.code || ''} onChange={e => set('code', e.target.value)} disabled={!!initial?.id} />
          </div>
          <div>
            <label className="label">{t('finance.account.type')}</label>
            <select className="input" value={form.account_type || 'asset'} onChange={e => set('account_type', e.target.value)}>
              <option value="asset">asset</option>
              <option value="liability">liability</option>
              <option value="equity">equity</option>
              <option value="income">income</option>
              <option value="expense">expense</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">{t('finance.account.name')}</label>
            <input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">{t('finance.account.name_ar')}</label>
            <input className="input" value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} dir="rtl" />
          </div>
          <div>
            <label className="label">Normal Balance</label>
            <select className="input" value={form.normal_balance || 'debit'} onChange={e => set('normal_balance', e.target.value)}>
              <option value="debit">debit</option>
              <option value="credit">credit</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={!!form.is_group} onChange={e => set('is_group', e.target.checked ? 1 : 0)} />
              <span>{t('finance.account.is_group')}</span>
            </label>
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

export default function ChartOfAccounts() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState({ open: false, initial: null });

  const { data, isLoading } = useQuery({
    queryKey: ['coa-tree'],
    queryFn: () => api.get('/api/finance/accounts/tree').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (payload) => api.post('/api/finance/accounts', payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coa-tree'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/api/finance/accounts/${id}`, payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coa-tree'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/api/finance/accounts/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coa-tree'] }); toast.success('Deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cannot delete'),
  });

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('nav.chart_of_accounts')}</h1>
        <button className="btn-primary" onClick={() => setModal({ open: true, initial: { account_type: 'asset', normal_balance: 'debit', is_group: 0 } })}>
          <Plus size={16}/> {t('common.create')}
        </button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <table className="table">
            <thead>
              <tr>
                <th>{t('finance.account.code')} / {t('finance.account.name')}</th>
                <th>{t('finance.account.type')}</th>
                <th>Normal</th>
                <th className="text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={4} className="text-center text-gray-500 py-6">{t('common.loading')}</td></tr>}
              {!isLoading && (data || []).map(n => (
                <AccountRow key={n.id} node={n} expanded={expanded} toggle={toggle}
                  onEdit={(node) => setModal({ open: true, initial: { ...node } })}
                  onAddChild={(parent) => setModal({ open: true, initial: { parent_id: parent.id, account_type: parent.account_type, normal_balance: parent.normal_balance, level: (parent.level || 1) + 1, is_group: 0 } })}
                  onDelete={(node) => { if (confirm('Delete ' + node.code + ' ' + node.name + '?')) deleteMut.mutate(node.id); }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AccountFormModal open={modal.open} initial={modal.initial} onClose={() => setModal({ open: false })}
        onSubmit={(payload) => { if (payload.id) updateMut.mutate(payload); else createMut.mutate(payload); }} />
    </div>
  );
}
