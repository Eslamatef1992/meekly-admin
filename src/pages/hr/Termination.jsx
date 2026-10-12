import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Calculator, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney, fmtDate } from '../../lib/format';

export default function Termination() {
  const [params] = useSearchParams();
  const initialEmpId = params.get('employee_id');
  const [employeeId, setEmployeeId] = useState(initialEmpId || '');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('termination');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);

  const { data: employees } = useQuery({ queryKey: ['employees-lite'], queryFn: () => api.get('/api/hr/employees', { params: { page_size: 500 } }).then(r => r.data?.data || r.data) });
  const { data: emp } = useQuery({
    queryKey: ['emp-for-eos', employeeId],
    queryFn: () => employeeId ? api.get(`/api/hr/employees/${employeeId}`).then(r => r.data) : null,
    enabled: !!employeeId,
  });

  // Live EOS preview as parameters change
  const { data: preview, refetch } = useQuery({
    queryKey: ['eos-preview', employeeId, endDate, reason],
    queryFn: () => employeeId
      ? api.get(`/api/hr/employees/${employeeId}/eos`, { params: { end_date: endDate, reason } }).then(r => r.data)
      : null,
    enabled: !!employeeId,
  });

  const terminateMut = useMutation({
    mutationFn: () => api.post(`/api/hr/employees/${employeeId}/terminate`, { end_date: endDate, reason, notes }).then(r => r.data),
    onSuccess: (data) => { setResult(data); toast.success('Termination processed'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Termination / End-of-Service</h1>
        <p className="text-sm text-gray-500">Kuwait Labor Law Article 51 — End-of-Service Indemnity calculation and final settlement.</p>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="font-semibold">Parameters</h3></div>
        <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="label">Employee *</label>
            <select className="input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">Select employee...</option>
              {(employees || []).map(e => <option key={e.id} value={e.id}>{e.employee_no} — {e.full_name} ({e.status})</option>)}
            </select>
          </div>
          <div>
            <label className="label">End Date *</label>
            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Reason</label>
            <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
              <option value="termination">Termination by employer</option>
              <option value="resignation">Resignation</option>
              <option value="death">Death</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="label">Notes</label>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason details, handover notes..." />
          </div>
        </div>
      </div>

      {emp && preview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Employee Snapshot</h3></div>
            <div className="card-body space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span>{emp.full_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Hire Date</span><span>{fmtDate(emp.hire_date)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Service</span><span>{preview.years?.toFixed(2)} years ({preview.total_days} days)</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Contract Type</span><span>{emp.contract_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Basic Salary</span><span className="font-mono">{fmtMoney(emp.basic_salary)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Daily Wage</span><span className="font-mono">{fmtMoney(preview.daily_wage)}</span></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="font-semibold">EOS Breakdown (Article 51)</h3></div>
            <div className="card-body space-y-2 text-sm">
              <div className="flex justify-between"><span>First 5 years × 15 days × daily wage</span><span className="font-mono">{fmtMoney(preview.first_5y_amount)}</span></div>
              <div className="flex justify-between"><span>After 5 years × 26 days × daily wage</span><span className="font-mono">{fmtMoney(preview.after_5y_amount)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-2"><span>Gross EOS</span><span className="font-mono">{fmtMoney(preview.gross)}</span></div>
              {preview.reduction_factor !== 1 && (
                <div className="text-yellow-700 inline-flex items-center gap-1">
                  <AlertTriangle size={14}/>
                  Reduction: ×{preview.reduction_factor} ({preview.reduction_reason})
                </div>
              )}
              {preview.capped && <div className="text-yellow-700">Capped at 18 months</div>}
              <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2"><span>Final EOS</span><span className="font-mono text-brand-700">{fmtMoney(preview.eos)}</span></div>
            </div>
          </div>
        </div>
      )}

      {emp && (
        <div className="card border-red-200 bg-red-50">
          <div className="card-body">
            <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Confirm Termination</h3>
            <p className="text-sm text-red-700 mb-3">
              This will set the employee's status to <strong>{reason === 'resignation' ? 'resigned' : 'terminated'}</strong> and record the end date.
              The EOS amount will be available to post as a JV against EOS Expense (5210) and Accrued Salaries (2102).
            </p>
            <button className="btn-danger" disabled={!emp || terminateMut.isPending} onClick={() => { if (confirm(`Terminate ${emp.full_name}?`)) terminateMut.mutate(); }}>
              <Calculator size={14}/> Process Termination & Calculate Final Settlement
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="card border-green-300 bg-green-50">
          <div className="card-header"><h3 className="font-semibold text-green-800">Final Settlement</h3></div>
          <div className="card-body space-y-2 text-sm">
            <div className="flex justify-between"><span>End-of-Service Indemnity</span><span className="font-mono">{fmtMoney(result.eos.eos)}</span></div>
            <div className="flex justify-between"><span>Leave Encashment ({result.leave_balance.balance} days)</span><span className="font-mono">{fmtMoney(result.leave_encashment)}</span></div>
            <div className="flex justify-between text-lg font-semibold border-t border-green-300 pt-2 text-green-800">
              <span>Total Final Settlement</span><span className="font-mono">{fmtMoney(result.final_settlement)}</span>
            </div>
            <div className="text-xs text-green-700 mt-2">Employee status updated. Create a Payment Voucher in Finance to disburse this amount.</div>
          </div>
        </div>
      )}
    </div>
  );
}
