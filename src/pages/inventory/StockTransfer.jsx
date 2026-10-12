import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowRightLeft, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

export default function StockTransfer() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    transfer_date: new Date().toISOString().slice(0, 10),
    item_id: params.get('item_id') || '',
    from_warehouse_id: params.get('from') || '',
    to_warehouse_id: '',
    quantity: 1,
    notes: '',
    reference: '',
  });
  const [result, setResult] = useState(null);

  const { data: items } = useQuery({ queryKey: ['items-all'], queryFn: () => api.get('/api/inventory/items', { params: { page_size: 500, active: 1 } }).then(r => r.data?.data || r.data) });
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => api.get('/api/inventory/stock/warehouses').then(r => r.data) });

  // Lookup current stock at source warehouse for the selected item
  const { data: balances } = useQuery({
    queryKey: ['stock-balances-for-transfer', form.item_id, form.from_warehouse_id],
    queryFn: () => api.get('/api/inventory/stock/balances', { params: { item_id: form.item_id, warehouse_id: form.from_warehouse_id } }).then(r => r.data),
    enabled: !!form.item_id && !!form.from_warehouse_id,
  });
  const sourceQty = Number(balances?.[0]?.quantity || 0);

  const transferMut = useMutation({
    mutationFn: () => api.post('/api/inventory/stock/transfer', form).then(r => r.data),
    onSuccess: (r) => { setResult(r); toast.success('Transferred'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-semibold">Stock Transfer</h1>
      <p className="text-sm text-gray-500">Move stock from one warehouse to another. Two movements are created (out from source, in to destination). No GL impact — it's the same legal entity.</p>

      <div className="card">
        <div className="card-body grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Item *</label>
            <select className="input" value={form.item_id} onChange={e => set('item_id', Number(e.target.value))}>
              <option value="">Select an item...</option>
              {(items || []).map(i => <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From Warehouse *</label>
            <select className="input" value={form.from_warehouse_id} onChange={e => set('from_warehouse_id', Number(e.target.value))}>
              <option value="">Select...</option>
              {(warehouses || []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            {form.item_id && form.from_warehouse_id && (
              <div className="text-xs text-gray-500 mt-1">On hand: <span className="font-mono font-semibold">{sourceQty.toLocaleString()}</span></div>
            )}
          </div>
          <div>
            <label className="label">To Warehouse *</label>
            <select className="input" value={form.to_warehouse_id} onChange={e => set('to_warehouse_id', Number(e.target.value))}>
              <option value="">Select...</option>
              {(warehouses || []).filter(w => w.id != form.from_warehouse_id).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity *</label>
            <input type="number" step="0.001" className="input text-end font-mono" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} />
            {Number(form.quantity) > sourceQty && form.item_id && form.from_warehouse_id && (
              <div className="text-xs text-rose-600 mt-1">Exceeds on-hand quantity</div>
            )}
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.transfer_date} onChange={e => set('transfer_date', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Reference / Notes</label>
            <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Reason for transfer, dispatch note, etc." />
          </div>
        </div>
        <div className="card-header !justify-end border-t border-gray-100">
          <button
            className="btn-primary"
            disabled={!form.item_id || !form.from_warehouse_id || !form.to_warehouse_id || Number(form.quantity) <= 0 || Number(form.quantity) > sourceQty || transferMut.isPending}
            onClick={() => transferMut.mutate()}
          >
            <ArrowRightLeft size={16}/> Transfer Stock
          </button>
        </div>
      </div>

      {result && (
        <div className="card border-emerald-300 bg-emerald-50">
          <div className="card-body">
            <h3 className="font-semibold text-emerald-800 flex items-center gap-2"><Check size={16}/> Transfer Complete</h3>
            <div className="mt-3 text-sm space-y-1">
              <div className="font-mono text-xs text-gray-600">Reference: {result.reference}</div>
              <div><strong>{result.item.name}</strong> — {result.quantity.toLocaleString()} units @ {fmtMoney(result.unit_cost)} unit cost</div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-3 bg-white rounded-xl border border-emerald-200">
                  <div className="text-xs text-gray-500">{result.from.warehouse}</div>
                  <div className="font-mono font-semibold">{Number(result.from.on_hand_after).toLocaleString()}</div>
                  <div className="text-xs text-rose-600">remaining</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-200">
                  <div className="text-xs text-gray-500">{result.to.warehouse}</div>
                  <div className="font-mono font-semibold">{Number(result.to.on_hand_after).toLocaleString()}</div>
                  <div className="text-xs text-emerald-700">received</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
