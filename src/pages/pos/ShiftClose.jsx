import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Power } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

export default function ShiftClose() {
  const { id } = useParams();
  const nav = useNavigate();
  const [counted, setCounted] = useState(0);
  const [notes, setNotes] = useState('');

  const { data: xrep } = useQuery({
    queryKey: ['x-report', id],
    queryFn: () => api.get(`/api/pos/shifts/${id}/x-report`).then(r => r.data),
  });

  const closeMut = useMutation({
    mutationFn: () => api.post(`/api/pos/shifts/${id}/close`, { counted_cash: counted, notes }).then(r => r.data),
    onSuccess: () => { toast.success('Shift closed'); nav('/pos'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  if (!xrep) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  const variance = Number(counted || 0) - Number(xrep.expected_cash || 0);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/pos" className="btn-secondary !px-2"><ArrowLeft size={16}/></Link>
        <h1 className="text-2xl font-semibold">Close Shift</h1>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="font-semibold">X-Report (current shift)</h3></div>
        <div className="card-body space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Shift #</span><span className="font-mono">{xrep.shift_no}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Opened</span><span>{new Date(xrep.opened_at).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Sales</span><span>{xrep.sale_count}</span></div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold"><span>Total sales</span><span className="font-mono">{fmtMoney(xrep.total_sales)}</span></div>
          <div className="pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Payment breakdown</div>
            {Object.entries(xrep.payment_breakdown || {}).map(([k, v]) => Number(v) > 0 && (
              <div key={k} className="flex justify-between text-sm"><span className="capitalize">{k.replace('_', ' ')}</span><span className="font-mono">{fmtMoney(v)}</span></div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="text-gray-500">Opening cash</span><span className="font-mono">{fmtMoney(xrep.opening_cash)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Expected cash in drawer</span><span className="font-mono">{fmtMoney(xrep.expected_cash)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="font-semibold">Close — Z-Report</h3></div>
        <div className="card-body space-y-3">
          <div>
            <label className="label">Counted cash in drawer (KWD)</label>
            <input type="number" step="0.001" className="input text-end font-mono text-lg" value={counted} onChange={e => setCounted(Number(e.target.value))} />
          </div>
          <div className={`p-3 rounded ${variance === 0 ? 'bg-green-50 text-green-700' : Math.abs(variance) > 1 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
            <div className="flex justify-between font-semibold"><span>Variance</span><span className="font-mono">{variance >= 0 ? '+' : ''}{fmtMoney(variance)}</span></div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows="2" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for variance, handover notes..." />
          </div>
          <button className="btn-danger w-full !py-3" onClick={() => closeMut.mutate()} disabled={closeMut.isPending}>
            <Power size={16}/> Close Shift & Generate Z-Report
          </button>
        </div>
      </div>
    </div>
  );
}
