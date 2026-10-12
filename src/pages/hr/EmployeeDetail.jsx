import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Calculator } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate, fmtMoney } from '../../lib/format';

const TABS = ['summary', 'compensation', 'leaves', 'payslips', 'requests'];

function CompensationTab({ employeeId }) {
  const qc = useQueryClient();
  const { data: lines } = useQuery({
    queryKey: ['emp-comp', employeeId],
    queryFn: () => api.get(`/api/hr/salary-components/employee/${employeeId}`).then(r => r.data),
  });
  const { data: components } = useQuery({
    queryKey: ['salary-components'],
    queryFn: () => api.get('/api/hr/salary-components').then(r => r.data),
  });
  const [add, setAdd] = useState({ salary_component_id: '', amount: 0, percent: 0, effective_from: new Date().toISOString().slice(0,10) });

  const addMut = useMutation({
    mutationFn: (payload) => api.post(`/api/hr/salary-components/employee/${employeeId}`, payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emp-comp', employeeId] }); toast.success('Added'); setAdd({ salary_component_id: '', amount: 0, percent: 0, effective_from: new Date().toISOString().slice(0,10) }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });
  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/api/hr/salary-components/employee/${employeeId}/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emp-comp', employeeId] }); toast.success('Removed'); },
  });

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header"><h3 className="font-semibold">Additional Salary Components</h3></div>
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Kind</th><th className="text-end">Amount</th><th className="text-end">%</th><th>From</th><th>To</th><th></th></tr></thead>
          <tbody>
            {(lines || []).map(l => (
              <tr key={l.id}>
                <td className="font-mono">{l.SalaryComponent?.code}</td>
                <td>{l.SalaryComponent?.name}</td>
                <td><span className={l.SalaryComponent?.kind === 'allowance' ? 'badge-green' : 'badge-red'}>{l.SalaryComponent?.kind}</span></td>
                <td className="text-end font-mono">{fmtMoney(l.amount)}</td>
                <td className="text-end font-mono">{Number(l.percent) || ''}</td>
                <td>{fmtDate(l.effective_from)}</td>
                <td>{fmtDate(l.effective_to)}</td>
                <td className="text-end"><button className="text-red-500 hover:text-red-700" onClick={() => delMut.mutate(l.id)}><Trash2 size={14}/></button></td>
              </tr>
            ))}
            {(!lines || !lines.length) && <tr><td colSpan={8} className="text-center text-gray-500 py-4">No additional components</td></tr>}
          </tbody>
        </table>
        <div className="card-body bg-gray-50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-6 gap-2">
          <select className="input md:col-span-2" value={add.salary_component_id} onChange={e => setAdd(a => ({ ...a, salary_component_id: Number(e.target.value) }))}>
            <option value="">Select component...</option>
            {(components || []).map(c => <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.kind})</option>)}
          </select>
          <input type="number" step="0.001" className="input text-end" placeholder="Amount" value={add.amount} onChange={e => setAdd(a => ({ ...a, amount: e.target.value }))} />
          <input type="number" step="0.001" className="input text-end" placeholder="% of basic" value={add.percent} onChange={e => setAdd(a => ({ ...a, percent: e.target.value }))} />
          <input type="date" className="input" value={add.effective_from} onChange={e => setAdd(a => ({ ...a, effective_from: e.target.value }))} />
          <button className="btn-primary" onClick={() => add.salary_component_id ? addMut.mutate(add) : toast.error('Select component')}>
            <Plus size={14}/> Add
          </button>
        </div>
      </div>
    </div>
  );
}

function LeavesTab({ employeeId }) {
  const { data: annual } = useQuery({
    queryKey: ['emp-leave-balance', employeeId],
    queryFn: () => api.get(`/api/hr/employees/${employeeId}/leave-balance`).then(r => r.data),
  });
  const { data: sick } = useQuery({
    queryKey: ['emp-sick-balance', employeeId],
    queryFn: () => api.get(`/api/hr/employees/${employeeId}/sick-leave`).then(r => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Annual Leave (Article 70)</h3></div>
          <div className="card-body">
            {annual ? (
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Entitled</span><span className="font-mono">{annual.entitled} days</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Used</span><span className="font-mono">{annual.used} days</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold"><span>Remaining</span><span className="font-mono">{annual.balance} days</span></div>
                {!annual.eligible && <div className="text-xs text-yellow-700 mt-2">Not yet eligible (requires 9 months of service)</div>}
              </div>
            ) : <div className="text-gray-500">Loading...</div>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Sick Leave This Year (Article 69)</h3></div>
          <div className="card-body">
            {sick ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Total entitlement</span><span className="font-mono">{sick.total_annual_entitlement} days</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Used</span><span className="font-mono">{sick.used_so_far} days</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-600">Remaining</span><span className="font-mono">{sick.remaining_total} days</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Next-day pay rate</span><span className="font-mono">{Math.round(sick.next_day_pay_rate * 100)}%</span></div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Tier breakdown:</div>
                  {sick.tiers.map(t => (
                    <div key={t.tier} className="flex justify-between text-xs">
                      <span>{t.tier} ({Math.round(t.pay_rate * 100)}%)</span>
                      <span className="font-mono">{t.used}/{t.tier_days}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="text-gray-500">Loading...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function PayslipsTab({ employeeId }) {
  const { data } = useQuery({
    queryKey: ['emp-payslips', employeeId],
    queryFn: async () => {
      // Get all payslips for this employee — we'll filter from the payroll runs (alternatively add a dedicated endpoint)
      const r = await api.get('/api/hr/payroll/runs', { params: { page_size: 200 } });
      return r.data;
    },
  });
  return (
    <div className="card">
      <table className="table">
        <thead><tr><th>Period</th><th>Run #</th><th>Status</th><th className="text-end">Gross</th><th className="text-end">Deductions</th><th className="text-end">Net</th><th></th></tr></thead>
        <tbody>
          {data?.data?.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-4">No payslips yet</td></tr>}
          {(data?.data || []).slice(0, 12).map(r => (
            <tr key={r.id}>
              <td>{r.period_year}-{String(r.period_month).padStart(2, '0')}</td>
              <td className="font-mono text-xs">{r.run_no}</td>
              <td><span className={r.status === 'posted' ? 'badge-green' : 'badge-gray'}>{r.status}</span></td>
              <td className="text-end font-mono">{fmtMoney(r.total_gross)}</td>
              <td className="text-end font-mono">{fmtMoney(r.total_deductions)}</td>
              <td className="text-end font-mono">{fmtMoney(r.total_net)}</td>
              <td className="text-end"><Link to={`/hr/payroll/${r.id}`} className="text-brand-600 hover:underline text-xs">View →</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RequestsTab({ employeeId }) {
  const { data } = useQuery({
    queryKey: ['emp-requests', employeeId],
    queryFn: () => api.get('/api/hr/requests', { params: { employee_id: employeeId } }).then(r => r.data),
  });
  return (
    <div className="card">
      <table className="table">
        <thead><tr><th>Req #</th><th>Type</th><th>Subject</th><th>From</th><th>To</th><th className="text-end">Amount</th><th>Status</th></tr></thead>
        <tbody>
          {(data?.data || []).map(r => (
            <tr key={r.id}>
              <td className="font-mono text-xs">{r.request_no}</td>
              <td>{r.request_type}</td>
              <td>{r.subject}</td>
              <td>{fmtDate(r.from_date)}</td>
              <td>{fmtDate(r.to_date)}</td>
              <td className="text-end font-mono">{r.amount > 0 ? fmtMoney(r.amount) : '-'}</td>
              <td><span className={r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-gray'}>{r.status}</span></td>
            </tr>
          ))}
          {!data?.data?.length && <tr><td colSpan={7} className="text-center text-gray-500 py-4">No requests</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('summary');
  const { data: emp, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/api/hr/employees/${id}`).then(r => r.data),
  });
  const { data: summary } = useQuery({
    queryKey: ['emp-summary', id],
    queryFn: () => api.get(`/api/hr/employees/${id}/summary`).then(r => r.data),
  });

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading...</div>;
  if (!emp) return <div className="text-center py-8 text-gray-500">Employee not found</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/hr/employees" className="p-2 rounded hover:bg-gray-100"><ArrowLeft size={18}/></Link>
        <div>
          <h1 className="text-2xl font-semibold">{emp.full_name}</h1>
          <p className="text-sm text-gray-500">{emp.employee_no} • {emp.job_title || '—'} • <span className={emp.status === 'active' ? 'badge-green' : 'badge-gray'}>{emp.status}</span></p>
        </div>
        <div className="ms-auto">
          <Link to={`/hr/termination?employee_id=${emp.id}`} className="btn-danger"><Calculator size={14}/> EOS / Terminate</Link>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {TABS.map(tname => (
          <button key={tname} onClick={() => setTab(tname)}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize ${tab === tname ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tname}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Personal Info</h3></div>
            <div className="card-body grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Civil ID</div><div className="font-mono">{emp.civil_id_no || '-'} <span className="text-xs text-gray-400">exp {fmtDate(emp.civil_id_expiry)}</span></div>
              <div className="text-gray-500">Passport</div><div>{emp.passport_no || '-'} <span className="text-xs text-gray-400">exp {fmtDate(emp.passport_expiry)}</span></div>
              <div className="text-gray-500">Iqama Expiry</div><div>{fmtDate(emp.residency_expiry) || '-'}</div>
              <div className="text-gray-500">Nationality</div><div>{emp.nationality || '-'}</div>
              <div className="text-gray-500">Date of Birth</div><div>{fmtDate(emp.date_of_birth)}</div>
              <div className="text-gray-500">Phone</div><div>{emp.phone || '-'}</div>
              <div className="text-gray-500">Email</div><div>{emp.email || '-'}</div>
              <div className="text-gray-500">Hire Date</div><div>{fmtDate(emp.hire_date)}</div>
              <div className="text-gray-500">Contract</div><div>{emp.contract_type}</div>
              <div className="text-gray-500">Bank</div><div>{emp.bank_name}</div>
              <div className="text-gray-500">IBAN</div><div className="font-mono text-xs">{emp.bank_iban}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Compensation & EOS Estimate</h3></div>
            <div className="card-body space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Basic Salary</span><span className="font-mono">{fmtMoney(emp.basic_salary)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Housing Allowance</span><span className="font-mono">{fmtMoney(emp.housing_allowance)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Transport Allowance</span><span className="font-mono">{fmtMoney(emp.transport_allowance)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold"><span>Gross</span><span className="font-mono">{fmtMoney((Number(emp.basic_salary)||0)+(Number(emp.housing_allowance)||0)+(Number(emp.transport_allowance)||0)+(Number(emp.other_allowance)||0))}</span></div>
              {summary?.eos && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">EOS estimate (as if terminated today):</div>
                  <div className="flex justify-between text-base font-semibold"><span>End-of-Service</span><span className="font-mono">{fmtMoney(summary.eos.eos)}</span></div>
                  <div className="text-xs text-gray-500">{summary.eos.years} years • {summary.eos.total_days} days</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'compensation' && <CompensationTab employeeId={emp.id} />}
      {tab === 'leaves' && <LeavesTab employeeId={emp.id} />}
      {tab === 'payslips' && <PayslipsTab employeeId={emp.id} />}
      {tab === 'requests' && <RequestsTab employeeId={emp.id} />}
    </div>
  );
}
