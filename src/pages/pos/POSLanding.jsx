import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Power, Building2, DollarSign } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { fmtMoney } from '../../lib/format';

export default function POSLanding() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const currentBranchId = useAuthStore(s => s.currentBranchId);

  const { data: registers, isLoading } = useQuery({
    queryKey: ['pos-registers', currentBranchId],
    queryFn: () => api.get('/api/pos/registers', { params: { branch_id: currentBranchId } }).then(r => r.data),
  });

  const [opening, setOpening] = useState({ registerId: null, openingCash: 0 });

  const openMut = useMutation({
    mutationFn: ({ register_id, opening_cash }) => api.post('/api/pos/shifts/open', { register_id, opening_cash }).then(r => r.data),
    onSuccess: (s) => { qc.invalidateQueries(); toast.success('Shift opened'); nav(`/pos/sale/${s.id}`); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Point of Sale</h1>
        <Link to="/pos/sales" className="btn-secondary">Sales History</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <div className="text-gray-500">Loading...</div>}
        {(registers || []).map(r => (
          <RegisterCard key={r.id} register={r} onOpen={(opening_cash) => openMut.mutate({ register_id: r.id, opening_cash })} />
        ))}
        {!isLoading && !registers?.length && (
          <div className="card md:col-span-3">
            <div className="card-body text-center text-gray-500">
              No registers configured for this branch yet. Create one in <Link to="/pos/registers" className="text-brand-600 hover:underline">POS → Registers</Link>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RegisterCard({ register, onOpen }) {
  const [openCash, setOpenCash] = useState(0);
  const { data: current } = useQuery({
    queryKey: ['pos-shift-current', register.id],
    queryFn: () => api.get('/api/pos/shifts/current', { params: { register_id: register.id } }).then(r => r.data),
    refetchInterval: 30000,
  });

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-brand-50 text-brand-700 grid place-items-center"><Building2 size={24} /></div>
          <div className="flex-1">
            <div className="font-semibold">{register.name}</div>
            <div className="text-xs text-gray-500">{register.code} • {register.Branch?.name} • {register.Warehouse?.name || 'no warehouse!'}</div>
          </div>
          {register.is_active
            ? <span className="badge-green">active</span>
            : <span className="badge-gray">inactive</span>}
        </div>

        {current ? (
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <div className="text-xs text-green-700 font-medium">Shift open — {current.shift_no}</div>
            <div className="text-xs text-gray-600 mt-1">Opening cash: {fmtMoney(current.opening_cash)}</div>
            <div className="flex gap-2 mt-3">
              <Link to={`/pos/sale/${current.id}`} className="btn-primary flex-1 text-center"><DollarSign size={14}/> Continue</Link>
              <Link to={`/pos/shifts/${current.id}/close`} className="btn-secondary"><Power size={14}/></Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <label className="label">Opening Cash (KWD)</label>
            <input type="number" step="0.001" className="input text-end font-mono" value={openCash} onChange={e => setOpenCash(Number(e.target.value))} />
            <button className="btn-primary w-full" onClick={() => onOpen(openCash)} disabled={!register.is_active || !register.warehouse_id}>
              <Plus size={14}/> Open Shift
            </button>
            {!register.warehouse_id && <p className="text-xs text-red-600">This register has no warehouse — assign one before opening a shift.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
