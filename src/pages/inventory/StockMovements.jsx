import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, X, ArrowDownToLine, ArrowUpFromLine, Settings2 } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney, fmtDate } from '../../lib/format';

function MovementForm({ open, onClose, onSubmit, items, warehouses }) {
  const [form, setForm] = useState({
    movement_type: 'in',
    movement_date: new Date().toISOString().slice(0, 10),
    item_id: '', warehouse_id: '',
    quantity: 1, unit_cost: 0, reference: '', notes: '',
  });
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const validate = () => {
    if (!form.item_id) return toast.error('Pick an item');
    if (!form.warehouse_id) return toast.error('Pick a warehouse');
    if (!Number(form.quantity)) return toast.error('Quantity required');
    onSubmit(form);
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg">
        <div className="card-header"><h3 className="font-semibold">New Stock Movement</h3><button onClick={onClose}><X size={18}/></button></div>
        <div className="card-body grid grid-cols-2 gap-3">
          <div><label className="label">Type *</label>
            <select className="input" value={form.movement_type} onChange={e => set('movement_type', e.target.value)}>
              <option value="in">Receive (in)</option>
              <option value="out">Issue / Loss (out)</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div><label className="label">Date *</label><input type="date" className="input" value={form.movement_date} onChange={e => set('movement_date', e.target.value)} /></div>
          <div className="col-span-2"><label className="label">Item *</label>
            <select className="input" value={form.item_id} onChange={e => set('item_id', Number(e.target.value))}>
              <option value="">Select...</option>
              {(items || []).map(i => <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Warehouse *</label>
            <select className="input" value={form.warehouse_id} onChange={e => set('warehouse_id', Number(e.target.value))}>
              <option value="">Select...</option>
              {(warehouses || []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div><label className="label">Quantity *</label><input type="number" step="0.001" className="input text-end font-mono" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></div>
          {form.movement_type === 'in' && (
            <div><label className="label">Unit Cost (KWD)</label><input type="number" step="0.001" className="input text-end font-mono" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} /></div>
          )}
          <div className="col-span-2"><label className="label">Reference</label><input className="input" value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="PO number, supplier invoice, etc." /></div>
          <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        </div>
        <div className="card-header !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={validate}>Record</button>
        </div>
      </div>
    </div>
  );
}

export default function StockMovements() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState({ warehouse_id: '', item_id: '', type: '', from: '', to: '' });

  const { data } = useQuery({
    queryKey: ['stock-movements', filter],
    queryFn: () => api.get('/api/inventory/stock/movements', { params: filter }).then(r => r.data),
  });
  const { data: items } = useQuery({ queryKey: ['items-lite'], queryFn: () => api.get('/api/inventory/items', { params: { page_size: 500, active: 1 } }).then(r => r.data?.data || r.data) });
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => api.get('/api/inventory/stock/warehouses').then(r => r.data) });

  const saveMut = useMutation({
    mutationFn: (p) => api.post('/api/inventory/stock/movements', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-movements'] }); qc.invalidateQueries({ queryKey: ['stock-balances'] }); toast.success('Recorded'); setModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Stock Movements</h1>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16}/> New Movement</button>
      </div>

      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <select className="input max-w-[200px]" value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
            <option value="">All types</option>
            <option value="in">In</option><option value="out">Out</option><option value="adjustment">Adjustment</option><option value="transfer">Transfer</option>
          </select>
          <select className="input max-w-[200px]" value={filter.warehouse_id} onChange={e => setFilter(f => ({ ...f, warehouse_id: e.target.value }))}>
            <option value="">All warehouses</option>
            {(warehouses || []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input type="date" className="input max-w-[160px]" value={filter.from} onChange={e => setFilter(f => ({ ...f, from: e.target.value }))} />
          <input type="date" className="input max-w-[160px]" value={filter.to} onChange={e => setFilter(f => ({ ...f, to: e.target.value }))} />
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Date</th><th>Type</th><th>Item</th><th>Warehouse</th><th className="text-end">Qty</th><th className="text-end">Unit Cost</th><th>Reference</th><th>Notes</th></tr></thead>
          <tbody>
            {(data?.data || []).map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td>{fmtDate(m.movement_date)}</td>
                <td>
                  <span className={
                    m.movement_type === 'in' ? 'badge-green inline-flex items-center gap-1' :
                    m.movement_type === 'out' ? 'badge-red inline-flex items-center gap-1' :
                    m.movement_type === 'transfer' ? 'badge-blue inline-flex items-center gap-1' :
                    'badge-yellow inline-flex items-center gap-1'
                  }>
                    {m.movement_type === 'in' ? <ArrowDownToLine size={11}/> : m.movement_type === 'out' ? <ArrowUpFromLine size={11}/> : <Settings2 size={11}/>}
                    {m.movement_type}
                  </span>
                </td>
                <td><div className="font-mono text-xs">{m.Item?.sku}</div><div className="text-sm">{m.Item?.name}</div></td>
                <td>{m.Warehouse?.name}</td>
                <td className="text-end font-mono">{Number(m.quantity).toLocaleString()}</td>
                <td className="text-end font-mono">{fmtMoney(m.unit_cost)}</td>
                <td className="text-xs font-mono">{m.reference}</td>
                <td className="text-xs text-gray-500 max-w-[200px] truncate">{m.notes}</td>
              </tr>
            ))}
            {!data?.data?.length && <tr><td colSpan={8} className="text-center py-8 text-gray-500">No movements</td></tr>}
          </tbody>
        </table>
      </div>

      <MovementForm open={modal} items={items} warehouses={warehouses} onClose={() => setModal(false)} onSubmit={(p) => saveMut.mutate(p)} />
    </div>
  );
}
