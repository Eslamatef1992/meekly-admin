import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Ban, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate, fmtMoney } from '../../lib/format';

export default function PayrollRunDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: run, isLoading } = useQuery({
    queryKey: ['payroll-run', id],
    queryFn: () => api.get(`/api/hr/payroll/runs/${id}`).then(r => r.data),
  });

  const postMut = useMutation({
    mutationFn: () => api.post(`/api/hr/payroll/runs/${id}/post`).then(r => r.data),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ['payroll-run', id] }); toast.success(`Posted as ${d.voucher_no}`); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });
  const cancelMut = useMutation({
    mutationFn: () => api.post(`/api/hr/payroll/runs/${id}/cancel`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll-run', id] }); toast.success('Cancelled'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (!run) return <div className="text-center py-8 text-gray-500">Not found</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/hr/payroll" className="p-2 rounded hover:bg-gray-100"><ArrowLeft size={18}/></Link>
        <div>
          <h1 className="text-2xl font-semibold">{run.run_no}</h1>
          <p className="text-sm text-gray-500">Period {run.period_year}-{String(run.period_month).padStart(2, '0')} • {run.Branch?.name} • Pay date {fmtDate(run.pay_date)}</p>
        </div>
        <div className="ms-auto flex gap-2">
          {run.status === 'calculated' && (
            <>
              <button className="btn-primary" onClick={() => { if (confirm('Post payroll to Finance? This creates a JV and cannot be undone without cancelling.')) postMut.mutate(); }}><Send size={14}/> Post to Finance</button>
              <button className="btn-danger" onClick={() => { if (confirm('Cancel this run?')) cancelMut.mutate(); }}><Ban size={14}/> Cancel</button>
            </>
          )}
          {run.status === 'posted' && (
            <>
              <span className="badge-green">Posted to JV #{run.voucher_id}</span>
              <button className="btn-danger" onClick={() => { if (confirm('Cancel posted payroll? This will reverse the GL entries.')) cancelMut.mutate(); }}><Ban size={14}/> Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="card"><div className="card-body"><div className="text-xs text-gray-500">Employees</div><div className="text-xl font-semibold">{run.employee_count}</div></div></div>
        <div className="card"><div className="card-body"><div className="text-xs text-gray-500">Total Gross</div><div className="text-xl font-semibold font-mono">{fmtMoney(run.total_gross)}</div></div></div>
        <div className="card"><div className="card-body"><div className="text-xs text-gray-500">Total Deductions</div><div className="text-xl font-semibold font-mono text-red-600">{fmtMoney(run.total_deductions)}</div></div></div>
        <div className="card"><div className="card-body"><div className="text-xs text-gray-500">Total Net Pay</div><div className="text-xl font-semibold font-mono text-green-700">{fmtMoney(run.total_net)}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="font-semibold">Payslips</h3></div>
        <table className="table">
          <thead><tr><th>Emp #</th><th>Name</th><th className="text-end">Basic</th><th className="text-end">Allowances</th><th className="text-end">Overtime</th><th className="text-end">Gross</th><th className="text-end">Deductions</th><th className="text-end">PIFSS</th><th className="text-end">Net</th><th></th></tr></thead>
          <tbody>
            {(run.payslips || []).map(p => (
              <tr key={p.id}>
                <td className="font-mono">{p.Employee?.employee_no}</td>
                <td>{p.Employee?.full_name}<div className="text-xs text-gray-500" dir="rtl">{p.Employee?.full_name_ar}</div></td>
                <td className="text-end font-mono">{fmtMoney(p.basic_salary)}</td>
                <td className="text-end font-mono">{fmtMoney(p.total_allowances)}</td>
                <td className="text-end font-mono">{fmtMoney(p.total_overtime)}</td>
                <td className="text-end font-mono font-semibold">{fmtMoney(p.gross_pay)}</td>
                <td className="text-end font-mono text-red-600">{fmtMoney(p.total_deductions - (Number(p.pifss_employee) || 0))}</td>
                <td className="text-end font-mono text-red-600">{fmtMoney(p.pifss_employee)}</td>
                <td className="text-end font-mono font-semibold text-green-700">{fmtMoney(p.net_pay)}</td>
                <td className="text-end"><Link to={`/hr/payslips/${p.id}`} className="text-brand-600 hover:underline text-xs inline-flex items-center gap-1"><FileText size={12}/>Payslip</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
