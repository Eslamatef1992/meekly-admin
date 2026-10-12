import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Pencil, X, Power, Search, Package, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

function ItemFormModal({ open, onClose, initial, onSubmit, categories, uoms }) {
  const [form, setForm] = useState(initial || {});
  useEffect(() => { if (open) setForm(initial || {}); }, [open, initial]);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const missing = [];
    if (!form.sku)  missing.push('SKU');
    if (!form.name) missing.push('Name');
    if (missing.length) { toast.error('Missing: ' + missing.join(', ')); return; }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="card w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="card-header sticky top-0 bg-white z-10">
          <h3 className="font-semibold">{initial?.id ? 'Edit Item' : 'Add Item'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18}/></button>
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-3 overflow-y-auto">
          <div><label className="label">SKU *</label><input className="input font-mono" value={form.sku || ''} onChange={e => set('sku', e.target.value)} disabled={!!initial?.id} placeholder="FURN-SOFA-001" /></div>
          <div><label className="label">Barcode</label><input className="input font-mono" value={form.barcode || ''} onChange={e => set('barcode', e.target.value)} placeholder="EAN/UPC for POS scanner" /></div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_active !== 0} onChange={e => set('is_active', e.target.checked ? 1 : 0)} /><span className="text-sm">Active</span></label>
          </div>
          <div className="md:col-span-3"><label className="label">Name (English) *</label><input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div className="md:col-span-3"><label className="label">الاسم (بالعربية)</label><input className="input" dir="rtl" value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} /></div>
          <div><label className="label">Category</label>
            <select className="input" value={form.category_id || ''} onChange={e => set('category_id', e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Unit of Measure</label>
            <select className="input" value={form.uom_id || ''} onChange={e => set('uom_id', e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {(uoms || []).map(u => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
            </select>
          </div>
          <div><label className="label">Image URL</label><input className="input" value={form.image_url || ''} onChange={e => set('image_url', e.target.value)} placeholder="https://..." /></div>

          <div><label className="label">Cost Price (KWD)</label><input type="number" step="0.001" className="input text-end font-mono" value={form.cost_price || 0} onChange={e => set('cost_price', Number(e.target.value))} /></div>
          <div><label className="label">Sale Price (KWD)</label><input type="number" step="0.001" className="input text-end font-mono" value={form.sale_price || 0} onChange={e => set('sale_price', Number(e.target.value))} /></div>
          <div><label className="label">Reorder Level</label><input type="number" step="0.001" className="input text-end font-mono" value={form.reorder_level || 0} onChange={e => set('reorder_level', Number(e.target.value))} /></div>

          <div><label className="label">Min Stock</label><input type="number" step="0.001" className="input text-end font-mono" value={form.min_stock || 0} onChange={e => set('min_stock', Number(e.target.value))} /></div>
          <div><label className="label">Max Stock</label><input type="number" step="0.001" className="input text-end font-mono" value={form.max_stock || 0} onChange={e => set('max_stock', Number(e.target.value))} /></div>
          <div><label className="label">Weight (kg)</label><input type="number" step="0.001" className="input text-end font-mono" value={form.weight_kg || ''} onChange={e => set('weight_kg', e.target.value ? Number(e.target.value) : null)} /></div>

          <div className="md:col-span-3"><label className="label">Dimensions</label><input className="input" value={form.dimensions || ''} onChange={e => set('dimensions', e.target.value)} placeholder="e.g. 120 × 60 × 75 cm" /></div>

          <div className="md:col-span-3 grid grid-cols-2 gap-3">
            <label className="inline-flex items-center gap-2 p-3 bg-gray-50 rounded-xl"><input type="checkbox" checked={form.is_sellable !== 0} onChange={e => set('is_sellable', e.target.checked ? 1 : 0)} /><span className="text-sm">Sellable (POS &amp; e-com)</span></label>
            <label className="inline-flex items-center gap-2 p-3 bg-gray-50 rounded-xl"><input type="checkbox" checked={form.is_purchasable !== 0} onChange={e => set('is_purchasable', e.target.checked ? 1 : 0)} /><span className="text-sm">Purchasable (PO)</span></label>
          </div>

          <div className="md:col-span-3"><label className="label">Description (English)</label><textarea className="input" rows="2" value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
          <div className="md:col-span-3"><label className="label">الوصف (بالعربية)</label><textarea className="input" dir="rtl" rows="2" value={form.description_ar || ''} onChange={e => set('description_ar', e.target.value)} /></div>
        </div>
        <div className="card-header sticky bottom-0 bg-white !justify-end gap-2 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={validate}>Save Item</button>
        </div>
      </div>
    </div>
  );
}

export default function Items() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false });
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('1');

  const { data, isLoading } = useQuery({
    queryKey: ['items', q, categoryFilter, activeFilter],
    queryFn: () => api.get('/api/inventory/items', { params: { q, category_id: categoryFilter, active: activeFilter } }).then(r => r.data),
  });
  const { data: categories } = useQuery({ queryKey: ['item-categories'], queryFn: () => api.get('/api/inventory/items/_/categories').then(r => r.data) });
  const { data: uoms } = useQuery({ queryKey: ['uoms'], queryFn: () => api.get('/api/inventory/items/_/uoms').then(r => r.data) });

  const saveMut = useMutation({
    mutationFn: (p) => p.id ? api.put(`/api/inventory/items/${p.id}`, p).then(r => r.data) : api.post('/api/inventory/items', p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['items'] }); toast.success('Saved'); setModal({ open: false }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const toggleMut = useMutation({
    mutationFn: (it) => api.put(`/api/inventory/items/${it.id}`, { is_active: it.is_active ? 0 : 1 }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['items'] }); toast.success('Updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const openCreate = () => {
    const next = 'ITM-' + String((data?.data?.length || 0) + 1).padStart(4, '0');
    setModal({ open: true, initial: {
      sku: next, is_active: 1, is_sellable: 1, is_purchasable: 1,
      cost_price: 0, sale_price: 0, reorder_level: 0, min_stock: 0, max_stock: 0,
    } });
  };

  const rows = data?.data || data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Items</h1>
        <button className="btn-primary" onClick={openCreate}><Plus size={16}/> Add Item</button>
      </div>

      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search SKU, barcode, name..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="input max-w-[200px]" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input max-w-[150px]" value={activeFilter} onChange={e => setActiveFilter(e.target.value)}>
            <option value="">All</option>
            <option value="1">Active only</option>
            <option value="0">Inactive only</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>SKU / Barcode</th>
              <th>Name</th>
              <th>Category</th>
              <th>UOM</th>
              <th className="text-end">Cost</th>
              <th className="text-end">Sale</th>
              <th className="text-end">Reorder</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>}
            {rows.map(it => (
              <tr key={it.id} className="hover:bg-gray-50">
                <td>
                  {it.image_url
                    ? <img src={it.image_url} alt="" className="w-10 h-10 object-cover rounded-lg" />
                    : <div className="w-10 h-10 rounded-lg bg-gray-100 grid place-items-center text-gray-400"><Package size={16}/></div>}
                </td>
                <td>
                  <div className="font-mono text-xs">{it.sku}</div>
                  {it.barcode && <div className="font-mono text-[10px] text-gray-400">{it.barcode}</div>}
                </td>
                <td>
                  <div className="font-medium">{it.name}</div>
                  {it.name_ar && <div className="text-xs text-gray-500" dir="rtl">{it.name_ar}</div>}
                </td>
                <td className="text-xs">{it.ItemCategory?.name || '—'}</td>
                <td className="text-xs">{it.Uom?.code || '—'}</td>
                <td className="text-end font-mono">{fmtMoney(it.cost_price)}</td>
                <td className="text-end font-mono">{fmtMoney(it.sale_price)}</td>
                <td className="text-end font-mono text-xs text-gray-500">{Number(it.reorder_level) || '-'}</td>
                <td>
                  {it.is_active
                    ? <span className="badge-green">active</span>
                    : <span className="badge-gray">inactive</span>}
                </td>
                <td className="text-end">
                  <div className="inline-flex gap-1">
                    <button className="p-1 text-gray-500 hover:text-brand-600" onClick={() => setModal({ open: true, initial: { ...it } })}><Pencil size={14}/></button>
                    <button className="p-1 text-gray-500 hover:text-red-600" onClick={() => toggleMut.mutate(it)} title="Toggle active"><Power size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !rows.length && <tr><td colSpan={10} className="text-center py-8 text-gray-500">No items yet — click "Add Item" to start.</td></tr>}
          </tbody>
        </table>
      </div>

      <ItemFormModal open={modal.open} initial={modal.initial} categories={categories} uoms={uoms}
        onClose={() => setModal({ open: false })} onSubmit={(p) => saveMut.mutate(p)} />
    </div>
  );
}
