import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate, fmtMoney } from '../../lib/format';

export default function Payslip() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => api.get(`/api/hr/payroll/payslips/${id}`).then(r => r.data),
  });
  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (!data) return <div className="text-center py-8 text-gray-500">Not found</div>;

  const allowances = (data.lines || []).filter(l => l.kind === 'allowance');
  const overtimes = (data.lines || []).filter(l => l.kind === 'overtime');
  const deductions = (data.lines || []).filter(l => l.kind === 'deduction' || l.kind === 'pifss');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 print:hidden">
        <Link to={`/hr/payroll/${data.payroll_run_id}`} className="p-2 rounded hover:bg-gray-100"><ArrowLeft size={18}/></Link>
        <h1 className="text-xl font-semibold">Payslip</h1>
        <button className="btn-secondary ms-auto" onClick={() => window.print()}><Printer size={14}/> Print</button>
      </div>

      <div className="card max-w-3xl mx-auto print:shadow-none print:border-0">
        <div className="card-body">
          <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img src="/mekky-logo.svg" alt="MEKKY" className="h-14 w-auto" />
              <div>
                <div className="font-semibold text-lg">Mekky International</div>
                <div className="text-xs text-gray-500">General Trading & Contracting Co. — Kuwait</div>
              </div>
            </div>
            <div className="text-end">
              <div className="text-2xl font-semibold">PAYSLIP</div>
              <div className="text-sm text-gray-500">{data.period_year}-{String(data.period_month).padStart(2, '0')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-gray-500">Employee:</span> <span className="font-medium">{data.Employee?.full_name}</span></div>
            <div><span className="text-gray-500">Employee #:</span> <span className="font-mono">{data.Employee?.employee_no}</span></div>
            <div><span className="text-gray-500">Job Title:</span> {data.Employee?.job_title || '—'}</div>
            <div><span className="text-gray-500">Civil ID:</span> <span className="font-mono">{data.Employee?.civil_id_no || '—'}</span></div>
            <div><span className="text-gray-500">Nationality:</span> {data.Employee?.nationality || '—'}</div>
            <div><span className="text-gray-500">Working Days:</span> {data.working_days} ({data.paid_days} paid)</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-700 border-b border-green-200 pb-1 mb-2">Earnings</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="py-1">Basic Salary</td><td className="text-end font-mono">{fmtMoney(data.basic_salary)}</td></tr>
                  {allowances.map(l => <tr key={l.id}><td className="py-1">{l.label}</td><td className="text-end font-mono">{fmtMoney(l.amount)}</td></tr>)}
                  {overtimes.map(l => <tr key={l.id}><td className="py-1 text-blue-600">{l.label}</td><td className="text-end font-mono text-blue-600">{fmtMoney(l.amount)}</td></tr>)}
                  <tr className="border-t border-gray-200 font-semibold"><td className="py-2">Gross Pay</td><td className="text-end font-mono">{fmtMoney(data.gross_pay)}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="font-semibold text-red-700 border-b border-red-200 pb-1 mb-2">Deductions</h3>
              <table className="w-full text-sm">
                <tbody>
                  {deductions.length === 0 && <tr><td className="py-1 text-gray-500">No deductions</td><td></td></tr>}
                  {deductions.map(l => <tr key={l.id}><td className="py-1">{l.label}</td><td className="text-end font-mono">{fmtMoney(l.amount)}</td></tr>)}
                  <tr className="border-t border-gray-200 font-semibold"><td className="py-2">Total Deductions</td><td className="text-end font-mono">{fmtMoney(data.total_deductions)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
            <div className="text-lg font-semibold">Net Pay</div>
            <div className="text-2xl font-bold font-mono text-green-700">{fmtMoney(data.net_pay)}</div>
          </div>

          {data.Employee?.bank_iban && (
            <div className="mt-4 text-xs text-gray-600">
              <span className="text-gray-500">Bank:</span> {data.Employee.bank_name} • <span className="text-gray-500">IBAN:</span> <span className="font-mono">{data.Employee.bank_iban}</span>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>This is a computer-generated payslip and does not require a signature.</div>
            <div className="text-end">Generated {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
