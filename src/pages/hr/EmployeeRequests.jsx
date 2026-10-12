import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Check, X } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate, fmtMoney } from '../../lib/format';

const REQUEST_TYPES = [
  { code: 'leave', label: 'Leave' },
  { code: 'sick_leave', label: 'Sick Leave' },
  { code: 'salary_advance', label: 'Salary Advance' },
  { code: 'loan', label: 'Loan' },
  { code: 'salary_certificate', label: 'Salary Certificate' },
  { code: 'noc', label: 'NOC (No-Objection)' },
  { code: 'iqama_renewal', label: 'Iqama Renewal' },
  { code: 'passport_renewal', label: 'Passport Renewal' },
  { code: 'business_card', label: 'Business Card' },
  { code: 'other', label: 'Other' },
];

function NewRequestModal({ open, onClose, onSubmit, employees }) {
  const [form, setForm] = useState({ employee_id: '', request_type: 'leave', subject: '', description: '', amount: 0, from_date: '', to_date: '' });
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl">
        <div className="card-header"><h3 className="font-semibold">New Request</h3><button onClick={onClose}><X size={18}/></button></div>
        <div className="card-body grid grid-cols-2 gap-3">
          <div><label className="label">Employee *</label>
            <select className="input" value={form.employee_id} onChange={e => set('employee_id', Number(e.target.value))}>
              <option value="">Select...</option>
              {(employees || []).map(e => <option key={e.id} value={e.id}>{e.employee_no} — {e.full_name}</option>)}
            </select>
          </div>
          <div><label className="label">Type *</label>
            <select className="input" value={form.request_type} onChange={e => set('request_type', e.target.value)}>
              {REQUEST_TYPES.map(rt => <option key={rt.code} value={rt.code}>{rt.label}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Subject *</label><input className="input" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Brief subject line" /></div>
          <div className="col-span-2"><label className="label">Description</label><textarea className="input" rows="3" value={form.description} onChange={e => set('description', e.target.value)} /></div>
          {(['salary_advance','loan'].includes(form.request_type)) && (
            <div><label className="label">Amount (KWD)</label><input type="number" step="0.001" className="input text-end font-mono" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
          )}
          {(['leave','sick_leave','iqama_renewal','passport_renewal'].includes(form.request_type)) && (
            <>
              <div><label className="label">From</label><input type="date" className="input" value={form.from_date} onChange={e => set('from_date', e.target.value)} /></div>
              <div><label className="label">To</label><input type="date" className="input" value={form.to_date} onChange={e => set('to_date', e.target.value)} /></div>
            </>
          )}
        </div>
        <div className="card-header !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => form.employee_id && form.subject ? onSubmit(form) : toast.error('Employee and subject required')}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeRequests() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState({ status: '', type: '' });

  const { data } = useQuery({
    queryKey: ['employee-requests', filter],
    queryFn: () => api.get('/api/hr/requests', { params: filter }).then(r => r.data),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees-lite'],
    queryFn: () => api.get('/api/hr/employees', { params: { page_size: 500 } }).then(r => r.data?.data || r.data),
  });

  const saveMut = useMutation({
    mutationFn: (p) => api.post('/api/hr/requests', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee-requests'] }); toast.success('Created'); setModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });
  const approveMut = useMutation({
    mutationFn: (id) => api.post(`/api/hr/requests/${id}/approve`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee-requests'] }); toast.success('Approved'); },
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => api.post(`/api/hr/requests/${id}/reject`, { reason }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee-requests'] }); toast.success('Rejected'); },
  });
  const completeMut = useMutation({
    mutationFn: (id) => api.post(`/api/hr/requests/${id}/complete`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee-requests'] }); toast.success('Marked complete'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Employee Requests</h1>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16}/> New Request</button>
      </div>
      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <select className="input max-w-xs" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="completed">Completed</option>
          </select>
          <select className="input max-w-xs" value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
            <option value="">All types</option>
            {REQUEST_TYPES.map(rt => <option key={rt.code} value={rt.code}>{rt.label}</option>)}
          </select>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Req #</th><th>Employee</th><th>Type</th><th>Subject</th><th>From</th><th>To</th><th className="text-end">Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data?.data || []).map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.request_no}</td>
                <td>{r.Employee?.full_name}<div className="text-xs text-gray-500">{r.Employee?.employee_no}</div></td>
                <td className="text-xs">{REQUEST_TYPES.find(t => t.code === r.request_type)?.label || r.request_type}</td>
                <td>{r.subject}</td>
                <td>{fmtDate(r.from_date)}</td>
                <td>{fmtDate(r.to_date)}</td>
                <td className="text-end font-mono">{r.amount > 0 ? fmtMoney(r.amount) : '-'}</td>
                <td>
                  <span className={
                    r.status === 'approved' ? 'badge-green' :
                    r.status === 'rejected' ? 'badge-red' :
                    r.status === 'completed' ? 'badge-blue' : 'badge-gray'
                  }>{r.status}</span>
                </td>
                <td className="text-end">
                  <div className="inline-flex gap-1">
                    {r.status === 'pending' && (
                      <>
                        <button className="text-green-600" onClick={() => approveMut.mutate(r.id)}><Check size={14}/></button>
                        <button className="text-red-600" onClick={() => { const reason = prompt('Rejection reason?'); if (reason !== null) rejectMut.mutate({ id: r.id, reason }); }}><X size={14}/></button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button className="text-blue-600 text-xs hover:underline" onClick={() => completeMut.mutate(r.id)}>Complete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!data?.data?.length && <tr><td colSpan={9} className="text-center text-gray-500 py-6">No requests</td></tr>}
          </tbody>
        </table>
      </div>
      <NewRequestModal open={modal} onClose={() => setModal(false)} onSubmit={(p) => saveMut.mutate(p)} employees={employees} />
    </div>
  );
}
