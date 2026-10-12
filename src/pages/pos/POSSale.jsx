import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Trash2, Plus, Minus, X, CreditCard, Banknote, FileText, User as UserIcon, ArrowLeft, Power } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

function placeholderFor(name = '') {
  const s = name.toLowerCase();
  if (s.includes('sofa') || s.includes('leather'))   return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=70';
  if (s.includes('bed'))                              return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=70';
  if (s.includes('dining') || s.includes('marble'))   return 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=300&q=70';
  if (s.includes('office') || s.includes('desk'))     return 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=70';
  if (s.includes('garden') || s.includes('lounge'))   return 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=300&q=70';
  if (s.includes('kid') || s.includes('bunk'))        return 'https://images.unsplash.com/photo-1577124574462-9c25470d20dd?auto=format&fit=crop&w=300&q=70';
  return 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=300&q=70';
}

export default function POSSale() {
  const { shiftId } = useParams();
  const nav = useNavigate();
  const [basket, setBasket] = useState([]);          // {item_id, name, sku, unit_price, quantity, discount, unit_cost, on_hand}
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [showPay, setShowPay] = useState(false);

  const { data: shift } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: () => api.get(`/api/pos/shifts/${shiftId}`).then(r => r.data),
  });

  const { data: items, refetch: refetchItems } = useQuery({
    queryKey: ['pos-items', shift?.Register?.warehouse_id, search],
    queryFn: () => api.get('/api/pos/items', { params: { warehouse_id: shift?.Register?.warehouse_id, q: search } }).then(r => r.data),
    enabled: !!shift?.Register?.warehouse_id,
  });

  const subtotal = basket.reduce((s, l) => s + (Number(l.unit_price) * Number(l.quantity) - Number(l.discount || 0)), 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  function addItem(it) {
    if (Number(it.on_hand) <= 0) return toast.error(`${it.name}: out of stock`);
    setBasket(b => {
      const existing = b.find(l => l.item_id === it.id);
      if (existing) {
        if (existing.quantity + 1 > Number(it.on_hand)) { toast.error(`${it.name}: only ${it.on_hand} in stock`); return b; }
        return b.map(l => l.item_id === it.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...b, { item_id: it.id, name: it.name, sku: it.sku, unit_price: Number(it.sale_price || 0), quantity: 1, discount: 0, unit_cost: Number(it.avg_cost || 0), on_hand: Number(it.on_hand) }];
    });
  }
  function updateQty(idx, qty) {
    setBasket(b => b.map((l, i) => i === idx ? { ...l, quantity: Math.max(0, Number(qty) || 0) } : l).filter(l => l.quantity > 0));
  }
  function updatePrice(idx, price) {
    setBasket(b => b.map((l, i) => i === idx ? { ...l, unit_price: Number(price) || 0 } : l));
  }
  function removeLine(idx) { setBasket(b => b.filter((_, i) => i !== idx)); }

  if (!shift) return <div className="text-center py-12 text-gray-500">Loading shift...</div>;
  if (shift.status !== 'open') return (
    <div className="text-center py-12">
      <p className="text-gray-500">This shift is no longer open.</p>
      <Link to="/pos" className="btn-primary mt-4 inline-flex">Back to POS</Link>
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-3 -m-6">
      {/* LEFT — product grid */}
      <div className="flex-1 flex flex-col bg-gray-50 p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Link to="/pos" className="btn-secondary !px-2"><ArrowLeft size={16}/></Link>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by SKU, barcode or name..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none"
            />
          </div>
          <div className="text-xs text-gray-500 hidden md:block">
            <div className="font-medium">{shift.shift_no}</div>
            <div>{shift.Register?.name}</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-2">
          {(items || []).map(it => (
            <button
              key={it.id}
              onClick={() => addItem(it)}
              disabled={Number(it.on_hand) <= 0}
              className="bg-white rounded-lg border border-gray-200 hover:border-accent-500 hover:shadow-md transition text-left overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="aspect-square bg-gray-100 overflow-hidden">
                <img src={it.image_url || placeholderFor(it.name)} alt={it.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <div className="font-medium text-xs line-clamp-1">{it.name}</div>
                <div className="text-[10px] text-gray-500 font-mono">{it.sku}</div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="font-bold text-brand-700 text-sm">{fmtMoney(it.sale_price || 0)}</div>
                  <div className={`text-[10px] ${Number(it.on_hand) <= 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {Number(it.on_hand) <= 0 ? 'out' : `${it.on_hand}`}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {!items?.length && <div className="col-span-4 text-center text-gray-400 py-10">No items</div>}
        </div>
      </div>

      {/* RIGHT — basket */}
      <div className="w-full lg:w-[420px] flex flex-col bg-white border-l border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="font-semibold">Basket</div>
          <button onClick={() => setBasket([])} className="text-xs text-red-600 hover:text-red-700">Clear</button>
        </div>

        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
          <UserIcon size={14} className="text-gray-400" />
          <input
            placeholder="Walk-in Customer"
            className="flex-1 text-sm bg-transparent outline-none border-0"
            value={customer?.name || ''}
            onChange={e => setCustomer(e.target.value ? { id: null, name: e.target.value } : null)}
          />
        </div>

        <div className="flex-1 overflow-auto">
          {basket.length === 0 && <div className="text-center text-gray-400 py-10 text-sm">No items yet — tap products on the left</div>}
          {basket.map((l, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium line-clamp-1">{l.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{l.sku}</div>
                </div>
                <button onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-600"><X size={14}/></button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center border border-gray-200 rounded">
                  <button onClick={() => updateQty(i, l.quantity - 1)} className="p-1 hover:bg-gray-100"><Minus size={12}/></button>
                  <input
                    type="number" step="0.5" min="0"
                    value={l.quantity}
                    onChange={e => updateQty(i, e.target.value)}
                    className="w-14 text-center text-sm font-mono outline-none border-0 py-1"
                  />
                  <button onClick={() => updateQty(i, l.quantity + 1)} className="p-1 hover:bg-gray-100"><Plus size={12}/></button>
                </div>
                <span className="text-xs text-gray-400">×</span>
                <input
                  type="number" step="0.001"
                  value={l.unit_price}
                  onChange={e => updatePrice(i, e.target.value)}
                  className="w-20 text-end text-sm font-mono outline-none border border-gray-200 rounded px-2 py-1"
                />
                <div className="ms-auto text-sm font-mono font-semibold">{fmtMoney(l.unit_price * l.quantity - (l.discount || 0))}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-mono">{fmtMoney(subtotal)}</span></div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-500">Discount</span>
            <input type="number" step="0.001" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-24 text-end text-sm font-mono border border-gray-200 rounded px-2 py-0.5" />
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
            <span>Total</span><span className="font-mono text-brand-700">{fmtMoney(total)}</span>
          </div>
          <button
            disabled={!basket.length || total <= 0}
            onClick={() => setShowPay(true)}
            className="btn-primary w-full text-base py-3 mt-2"
          >
            <CreditCard size={16}/> Pay {fmtMoney(total)}
          </button>
        </div>
      </div>

      {showPay && (
        <PaymentDialog
          total={total}
          basket={basket}
          discount={discount}
          customer={customer}
          shiftId={shift.id}
          onClose={() => setShowPay(false)}
          onCompleted={(saleId) => { setShowPay(false); setBasket([]); setDiscount(0); setCustomer(null); refetchItems(); nav(`/pos/sales/${saleId}`); }}
        />
      )}
    </div>
  );
}

function PaymentDialog({ total, basket, discount, customer, shiftId, onClose, onCompleted }) {
  const [payments, setPayments] = useState([{ method: 'cash', amount: total, reference: '' }]);
  const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const remaining = total - paid;
  const change = Math.max(0, paid - total);

  const placeMut = useMutation({
    mutationFn: () => api.post('/api/pos/sales', {
      shift_id: shiftId,
      customer_id: customer?.id || null,
      lines: basket.map(b => ({ item_id: b.item_id, quantity: b.quantity, unit_price: b.unit_price, discount: b.discount })),
      payments: payments.filter(p => Number(p.amount) > 0).map(p => ({ method: p.method, amount: Number(p.amount), reference: p.reference || null })),
      discount,
    }).then(r => r.data),
    onSuccess: (r) => { toast.success(`Sale ${r.sale.sale_no} completed`); onCompleted(r.sale.id); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  function setLine(i, k, v) { setPayments(ps => ps.map((p, idx) => idx === i ? { ...p, [k]: v } : p)); }
  function addLine(method) { setPayments(ps => [...ps, { method, amount: Math.max(0, total - paid), reference: '' }]); }
  function removeLine(i) { setPayments(ps => ps.filter((_, idx) => idx !== i)); }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Payment</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between text-2xl font-bold">
            <span>Total</span><span className="font-mono text-brand-700">{fmtMoney(total)}</span>
          </div>

          {payments.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={p.method} onChange={e => setLine(i, 'method', e.target.value)} className="input">
                <option value="cash">Cash</option>
                <option value="knet">KNET</option>
                <option value="card">Card</option>
                <option value="on_account">On Account</option>
              </select>
              <input type="number" step="0.001" value={p.amount} onChange={e => setLine(i, 'amount', Number(e.target.value))} className="input text-end font-mono flex-1" />
              {payments.length > 1 && <button onClick={() => removeLine(i)} className="text-red-500"><X size={16}/></button>}
            </div>
          ))}
          {payments.some(p => p.method === 'knet' || p.method === 'card') && (
            <input
              placeholder="Reference (KNET/card)"
              className="input"
              value={payments[payments.length - 1].reference || ''}
              onChange={e => setLine(payments.length - 1, 'reference', e.target.value)}
            />
          )}

          <div className="flex gap-2 flex-wrap">
            <button className="btn-secondary !py-1 text-xs" onClick={() => addLine('cash')}>+ Cash</button>
            <button className="btn-secondary !py-1 text-xs" onClick={() => addLine('knet')}>+ KNET</button>
            <button className="btn-secondary !py-1 text-xs" onClick={() => addLine('card')}>+ Card</button>
            {customer?.id && <button className="btn-secondary !py-1 text-xs" onClick={() => addLine('on_account')}>+ On Account</button>}
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Paid</span><span className="font-mono">{fmtMoney(paid)}</span></div>
            {remaining > 0 && <div className="flex justify-between text-red-600"><span>Remaining</span><span className="font-mono">{fmtMoney(remaining)}</span></div>}
            {change > 0 && <div className="flex justify-between text-green-700 font-semibold"><span>Change</span><span className="font-mono">{fmtMoney(change)}</span></div>}
          </div>

          <button
            disabled={paid < total || placeMut.isPending}
            onClick={() => placeMut.mutate()}
            className="btn-primary w-full !py-3 text-base"
          >
            Complete Sale {fmtMoney(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
