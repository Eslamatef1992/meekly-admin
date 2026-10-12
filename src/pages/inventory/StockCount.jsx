import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Calculator, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

export default function StockCount() {
  const [warehouseId, setWarehouseId] = useState('');
  const [counts, setCounts] = useState({});   // { item_id: counted_quantity }
  const [notes, setNotes] = useState('');

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => api.get('/api/inventory/stock/warehouses').then(r => r.data) });
  const { data: balances, refetch } = useQuery({
    queryKey: ['count-balances', warehouseId],
    queryFn: () => api.get('/api/inventory/stock/balances', { params: { warehouse_id: warehouseId } }).then(r => r.data),
    enabled: !!warehouseId,
  });

  const adjustMut = useMutation({
    mutationFn: ({ item_id, new_quantity }) =>
      api.post('/api/inventory/stock/adjust', { item_id, warehouse_id: Number(warehouseId), new_quantity, notes }).then(r => r.data),
  });

  const submit = async () => {
    const updates = Object.entries(counts).filter(([k, v]) => v !== '' && v !== undefined && v !== null);
    if (!updates.length) return toast.error('Enter at least one count');
    let saved = 0;
    for (const [item_id, new_quantity] of updates) {
      try {
        await adjustMut.mutateAsync({ item_id: Number(item_id), new_quantity: Number(new_quantity) });
        saved += 1;
      } catch (e) { toast.error(`Item ${item_id}: ${e.response?.data?.message || 'failed'}`); }
    }
    if (saved) { toast.success(`${saved} item(s) adjusted`); setCounts({}); refetch(); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Stock Count</h1>
        <p className="text-sm text-gray-500">Pick a warehouse and enter the physical counted quantity for each item. Variance becomes an adjustment movement and updates the balance.</p>
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Warehouse *</label>
            <select className="input" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
              <option value="">Select warehouse...</option>
              {(warehouses || []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason: yearly stock-take, found damage, etc." />
          </div>
        </div>
      </div>

      {warehouseId && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">Items in {warehouses?.find(w => w.id == warehouseId)?.name}</h3>
            <button className="btn-primary" onClick={submit} disabled={!Object.keys(counts).length}><Check size={14}/> Apply Counts</button>
          </div>
          <table className="table">
            <thead><tr><th>SKU</th><th>Item</th><th className="text-end">System Qty</th><th className="text-end">Counted</th><th className="text-end">Variance</th><th className="text-end">Avg Cost</th></tr></thead>
            <tbody>
              {(balances || []).map(s => {
                const counted = counts[s.item_id];
                const variance = counted !== '' && counted !== undefined ? Number(counted) - Number(s.quantity) : null;
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="font-mono text-xs">{s.Item?.sku}</td>
                    <td>{s.Item?.name}</td>
                    <td className="text-end font-mono">{Number(s.quantity).toLocaleString()}</td>
                    <td className="text-end">
                      <input
                        type="number" step="0.001"
                        className="input text-end font-mono w-28 ml-auto"
                        placeholder="—"
                        value={counts[s.item_id] ?? ''}
                        onChange={e => setCounts(c => ({ ...c, [s.item_id]: e.target.value }))}
                      />
                    </td>
                    <td className={`text-end font-mono ${variance == null ? '' : variance > 0 ? 'text-emerald-700' : variance < 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                      {variance == null ? '—' : (variance > 0 ? '+' : '') + variance.toFixed(3)}
                    </td>
                    <td className="text-end font-mono">{fmtMoney(s.avg_cost)}</td>
                  </tr>
                );
              })}
              {warehouseId && !balances?.length && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No items in this warehouse yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
