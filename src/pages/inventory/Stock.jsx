import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, ArrowRightLeft, Plus, Calculator } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

export default function Stock() {
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [q, setQ] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-balances', warehouseFilter, lowOnly, q],
    queryFn: () => api.get('/api/inventory/stock/balances', { params: { warehouse_id: warehouseFilter, low_stock: lowOnly ? 1 : 0, q } }).then(r => r.data),
  });
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/api/inventory/stock/warehouses').then(r => r.data),
  });

  const totalValue = (data || []).reduce((s, r) => s + Number(r.quantity) * Number(r.avg_cost), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Stock Balances</h1>
        <div className="flex gap-2">
          <Link to="/inventory/movements" className="btn-secondary"><Plus size={14}/> New Movement</Link>
          <Link to="/inventory/transfer" className="btn-secondary"><ArrowRightLeft size={14}/> Transfer</Link>
          <Link to="/inventory/count" className="btn-primary"><Calculator size={14}/> Stock Count</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi bg-surface-violet">
          <div className="kpi-icon bg-white/70 text-brand-700"><Calculator size={20}/></div>
          <div>
            <div className="text-xs text-gray-600">Items in stock</div>
            <div className="text-2xl font-bold">{(data || []).length}</div>
          </div>
        </div>
        <div className="kpi bg-surface-mint">
          <div className="kpi-icon bg-white/70 text-emerald-700"><Calculator size={20}/></div>
          <div>
            <div className="text-xs text-gray-600">Total stock value</div>
            <div className="text-2xl font-bold font-mono">{fmtMoney(totalValue)}</div>
          </div>
        </div>
        <div className="kpi bg-surface-rose">
          <div className="kpi-icon bg-white/70 text-rose-700"><AlertTriangle size={20}/></div>
          <div>
            <div className="text-xs text-gray-600">Low-stock alerts</div>
            <div className="text-2xl font-bold">
              {(data || []).filter(r => Number(r.quantity) <= Number(r.Item?.reorder_level || 0) && Number(r.Item?.reorder_level) > 0).length}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search SKU or name..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="input max-w-[200px]" value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)}>
            <option value="">All warehouses</option>
            {(warehouses || []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200">
            <input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} />
            <span className="text-sm">Low stock only</span>
          </label>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Warehouse</th><th>SKU</th><th>Item</th><th className="text-end">On Hand</th><th className="text-end">Reorder At</th><th className="text-end">Avg Cost</th><th className="text-end">Value</th><th></th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className="text-center py-6">Loading...</td></tr>}
            {(data || []).map(s => {
              const low = Number(s.quantity) <= Number(s.Item?.reorder_level || 0) && Number(s.Item?.reorder_level) > 0;
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td>{s.Warehouse?.name}</td>
                  <td className="font-mono text-xs">{s.Item?.sku}</td>
                  <td>{s.Item?.name}<div className="text-xs text-gray-500" dir="rtl">{s.Item?.name_ar}</div></td>
                  <td className={`text-end font-mono ${low ? 'text-rose-600 font-semibold' : ''}`}>
                    {low && <AlertTriangle size={12} className="inline -mt-0.5 me-1"/>}
                    {Number(s.quantity).toLocaleString()}
                  </td>
                  <td className="text-end font-mono text-xs text-gray-500">{Number(s.Item?.reorder_level) || '-'}</td>
                  <td className="text-end font-mono">{fmtMoney(s.avg_cost)}</td>
                  <td className="text-end font-mono font-semibold">{fmtMoney(Number(s.quantity) * Number(s.avg_cost))}</td>
                  <td className="text-end">
                    <Link to={`/inventory/transfer?item_id=${s.item_id}&from=${s.warehouse_id}`} className="text-brand-600 hover:underline text-xs">Transfer →</Link>
                  </td>
                </tr>
              );
            })}
            {!isLoading && !data?.length && <tr><td colSpan={8} className="text-center py-8 text-gray-500">No stock yet — record a stock movement to start.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
