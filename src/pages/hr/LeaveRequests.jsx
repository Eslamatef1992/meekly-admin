import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Check, X, Search, Calendar, Filter, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import Pagination from '../../components/Pagination';

// Searchable employee combobox — typeahead + click select
function EmployeePicker({ employees = [], value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef(null);
  const selected = employees.find(e => e.id === value);

  // close on outside click
  useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return employees.slice(0, 50);
    return employees.filter(e =>
      String(e.employee_no || '').toLowerCase().includes(ql) ||
      String(e.full_name || '').toLowerCase().includes(ql) ||
      String(e.full_name_ar || '').toLowerCase().includes(ql)
    ).slice(0, 50);
  }, [q, employees]);

  return (
    <div ref={wrapRef} className="relative">
      <div
        onClick={() => setOpen(o => !o)}
        className="input cursor-pointer flex items-center justify-between min-h-[42px]"
      >
        {selected ? (
          <span><span className="font-mono text-xs text-gray-500 me-2">{selected.employee_no}</span>{selected.full_name}</span>
        ) : <span className="text-gray-400">Search employee by name or number…</span>}
        <Search size={14} className="text-gray-400" />
      </div>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-72 overflow-hidden flex flex-col">
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Type to search…"
            className="px-4 py-2.5 border-b border-gray-100 outline-none text-sm"
          />
          <div className="overflow-y-auto">
            {filtered.length === 0 && <div className="text-center text-xs text-gray-400 py-4">No matches</div>}
            {filtered.map(e => (
              <button key={e.id} type="button"
                onClick={() => { onChange(e.id); setOpen(false); setQ(''); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${e.id === value ? 'bg-brand-50 text-brand-900' : ''}`}>
                <span className="font-mono text-xs text-gray-400 w-16 shrink-0">{e.employee_no}</span>
                <span className="flex-1">{e.full_name}</span>
                {e.full_name_ar && <span className="text-xs text-gray-500 truncate max-w-[40%]" dir="rtl">{e.full_name_ar}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NewLeaveModal({ open, onClose, onSubmit, employees, leaveTypes }) {
  const [form, setForm] = useState({ employee_id: '', leave_type_id: '', start_date: '', end_date: '', days: 0, reason: '' });

  useEffect(() => { if (open) setForm({ employee_id: '', leave_type_id: '', start_date: '', end_date: '', days: 0, reason: '' }); }, [open]);

  // Auto-calc days whenever start or end date changes
  useEffect(() => {
    if (form.start_date && form.end_date) {
      const s = new Date(form.start_date), e = new Date(form.end_date);
      const d = Math.floor((e - s) / 86400000) + 1;
      setForm(f => ({ ...f, days: d > 0 ? d : 0 }));
    }
  }, [form.start_date, form.end_date]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.employee_id)   return toast.error('Pick an employee');
    if (!form.leave_type_id) return toast.error('Pick a leave type');
    if (!form.start_date || !form.end_date) return toast.error('Pick start and end dates');
    if (form.days <= 0)      return toast.error('Days must be at least 1');
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg">
        <div className="card-header"><h3 className="font-semibold">New Leave Request</h3><button onClick={onClose}><X size={18}/></button></div>
        <div className="card-body grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Employee *</label>
            <EmployeePicker employees={employees || []} value={form.employee_id} onChange={(id) => set('employee_id', id)} />
          </div>
          <div className="col-span-2">
            <label className="label">Leave Type *</label>
            <select className="input" value={form.leave_type_id} onChange={e => set('leave_type_id', Number(e.target.value))}>
              <option value="">Select…</option>
              {(leaveTypes || []).map(l => (
                <option key={l.id} value={l.id}>{l.name} {l.is_paid ? '(paid)' : '(unpaid)'}</option>
              ))}
            </select>
          </div>
          <div><label className="label">Start Date *</label><input type="date" className="input" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
          <div><label className="label">End Date *</label><input type="date" className="input" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
          <div className="col-span-2">
            <label className="label">Days (auto-calculated)</label>
            <input type="number" step="0.5" className="input text-end font-mono font-semibold text-lg" value={form.days} onChange={e => set('days', Number(e.target.value))} />
            <p className="text-xs text-gray-500 mt-1">Calculated from start ↔ end. You can adjust manually if needed (e.g. half-day).</p>
          </div>
          <div className="col-span-2"><label className="label">Reason</label><textarea className="input" rows="2" value={form.reason} onChange={e => set('reason', e.target.value)} /></div>
        </div>
        <div className="card-header !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function LeaveRequests() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => { setPage(1); }, [q, statusFilter, typeFilter, pageSize]);

  const { data } = useQuery({
    queryKey: ['leaves', q, statusFilter, typeFilter, page, pageSize],
    queryFn: () => api.get('/api/hr/leaves', { params: { q, status: statusFilter, leave_type_id: typeFilter, page, page_size: pageSize } }).then(r => r.data),
    keepPreviousData: true,
  });
  const { data: employees } = useQuery({
    queryKey: ['employees-lite'],
    queryFn: () => api.get('/api/hr/employees', { params: { page_size: 1000 } }).then(r => r.data?.data || r.data),
  });
  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => api.get('/api/lookups/leave-types').then(r => r.data).catch(() => []),
  });

  const saveMut = useMutation({
    mutationFn: (p) => api.post('/api/hr/leaves', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaves'] }); toast.success('Created'); setModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });
  const approveMut = useMutation({
    mutationFn: (id) => api.post(`/api/hr/leaves/${id}/approve`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaves'] }); toast.success('Approved'); },
  });
  const rejectMut = useMutation({
    mutationFn: (id) => api.post(`/api/hr/leaves/${id}/reject`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaves'] }); toast.success('Rejected'); },
  });

  const rows = data?.data || [];
  const total = Number(data?.total || rows.length);
  const pendingCount = Number(data?.pending_count || 0);
  const isAr = i18n.language === 'ar';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{isAr ? 'طلبات الإجازة' : 'Leave Requests'}</h1>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 rounded-full px-3 py-1 text-xs font-semibold">
              <Clock size={12}/> {pendingCount} pending
            </span>
          )}
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16}/> {isAr ? 'طلب جديد' : 'New Leave'}</button>
      </div>

      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder={isAr ? 'بحث بالاسم أو رقم الموظف...' : 'Search by name or employee #...'} value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="input max-w-[200px]" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">{isAr ? 'كل الأنواع' : 'All leave types'}</option>
            {(leaveTypes || []).map(l => <option key={l.id} value={l.id}>{isAr && l.name_ar ? l.name_ar : l.name}</option>)}
          </select>
          <select className="input max-w-[160px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{isAr ? 'كل الحالات' : 'All statuses'}</option>
            <option value="pending">{isAr ? 'قيد المراجعة' : 'Pending'}</option>
            <option value="approved">{isAr ? 'معتمد' : 'Approved'}</option>
            <option value="rejected">{isAr ? 'مرفوض' : 'Rejected'}</option>
            <option value="cancelled">{isAr ? 'ملغي' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{isAr ? 'الموظف' : 'Employee'}</th>
              <th>{isAr ? 'نوع الإجازة' : 'Leave Type'}</th>
              <th>{isAr ? 'من' : 'From'}</th>
              <th>{isAr ? 'إلى' : 'To'}</th>
              <th className="text-end">{isAr ? 'الأيام' : 'Days'}</th>
              <th>{isAr ? 'السبب' : 'Reason'}</th>
              <th>{isAr ? 'الحالة' : 'Status'}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td>
                  <div className="flex items-center gap-2">
                    {r.Employee?.image_url
                      ? <img src={r.Employee.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center text-xs font-semibold">{(r.Employee?.full_name || '?').charAt(0)}</div>
                    }
                    <div>
                      <div className="font-medium text-sm">{r.Employee?.full_name || `Emp #${r.employee_id}`}</div>
                      <div className="text-xs text-gray-500 font-mono">{r.Employee?.employee_no}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${r.LeaveType?.is_paid ? 'badge-blue' : 'badge-gray'}`}>
                    {isAr && r.LeaveType?.name_ar ? r.LeaveType.name_ar : (r.LeaveType?.name || '—')}
                  </span>
                </td>
                <td>{fmtDate(r.start_date)}</td>
                <td>{fmtDate(r.end_date)}</td>
                <td className="text-end font-mono font-semibold">{r.days}</td>
                <td className="text-xs truncate max-w-[200px]" title={r.reason}>{r.reason}</td>
                <td>
                  <span className={
                    r.status === 'approved'  ? 'badge-green' :
                    r.status === 'rejected'  ? 'badge-red' :
                    r.status === 'cancelled' ? 'badge-gray' :
                                                'badge-yellow'
                  }>
                    {isAr
                      ? (r.status === 'approved' ? 'معتمد' : r.status === 'rejected' ? 'مرفوض' : r.status === 'cancelled' ? 'ملغي' : 'قيد المراجعة')
                      : r.status}
                  </span>
                </td>
                <td className="text-end no-print">
                  {r.status === 'pending' && (
                    <div className="inline-flex gap-1">
                      <button className="text-green-600 hover:text-green-800" title="Approve" onClick={() => approveMut.mutate(r.id)}><Check size={16}/></button>
                      <button className="text-red-600 hover:text-red-800" title="Reject" onClick={() => rejectMut.mutate(r.id)}><X size={16}/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="text-center text-gray-500 py-8">{isAr ? 'لا توجد طلبات' : 'No leave requests'}</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

      <NewLeaveModal open={modal} onClose={() => setModal(false)} onSubmit={(p) => saveMut.mutate(p)} employees={employees} leaveTypes={leaveTypes} />
    </div>
  );
}
