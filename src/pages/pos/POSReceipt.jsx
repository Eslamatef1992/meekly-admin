import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer, Ban } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

export default function POSReceipt() {
  const { id } = useParams();
  const { data: s, refetch } = useQuery({
    queryKey: ['pos-sale', id],
    queryFn: () => api.get(`/api/pos/sales/${id}`).then(r => r.data),
  });

  if (!s) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const voidSale = async () => {
    if (!confirm('Void this sale? Stock will be returned and JV reversed.')) return;
    try { await api.post(`/api/pos/sales/${id}/void`); refetch(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 print:hidden">
        <Link to="/pos" className="btn-secondary !px-2"><ArrowLeft size={16}/></Link>
        <h1 className="text-xl font-semibold">Receipt {s.sale_no}</h1>
        <div className="ms-auto flex gap-2">
          <button className="btn-secondary" onClick={() => window.print()}><Printer size={14}/> Print</button>
          {s.status === 'completed' && <button className="btn-danger" onClick={voidSale}><Ban size={14}/> Void</button>}
          {s.status === 'voided' && <span className="badge-red px-3 py-1">VOIDED</span>}
        </div>
      </div>

      <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg p-6 print:border-0 print:shadow-none font-mono text-sm">
        <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
          <img src="/mekky-logo.svg" alt="MEKKY" className="h-14 w-auto mx-auto mb-2" />
          <div className="font-bold text-base">Mekky International</div>
          <div className="text-xs text-gray-500">Salmiya, Hawalli — Kuwait</div>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span>Sale</span><span>{s.sale_no}</span></div>
          <div className="flex justify-between"><span>Date</span><span>{new Date(s.sale_date).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Cashier</span><span>{s.cashier?.full_name}</span></div>
          <div className="flex justify-between"><span>Customer</span><span>{s.customer_name || 'Walk-in'}</span></div>
        </div>

        <div className="border-t border-dashed border-gray-300 mt-3 pt-3">
          {s.lines?.map(l => (
            <div key={l.id} className="mb-2">
              <div className="flex justify-between"><span className="truncate">{l.name}</span></div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{l.quantity} × {Number(l.unit_price).toFixed(3)}</span>
                <span className="font-semibold text-gray-900">{Number(l.line_total).toFixed(3)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-300 mt-3 pt-3 space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{Number(s.subtotal).toFixed(3)}</span></div>
          {Number(s.discount) > 0 && <div className="flex justify-between"><span>Discount</span><span>-{Number(s.discount).toFixed(3)}</span></div>}
          <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-1"><span>TOTAL</span><span>{Number(s.total).toFixed(3)} KWD</span></div>
        </div>

        <div className="border-t border-dashed border-gray-300 mt-3 pt-3 space-y-1 text-xs">
          {s.payments?.map(p => (
            <div key={p.id} className="flex justify-between">
              <span className="uppercase">{p.method}{p.reference ? ` ${p.reference}` : ''}</span>
              <span>{Number(p.amount).toFixed(3)}</span>
            </div>
          ))}
          {Number(s.change_due) > 0 && <div className="flex justify-between font-bold"><span>CHANGE</span><span>{Number(s.change_due).toFixed(3)}</span></div>}
        </div>

        <div className="text-center text-xs mt-4 text-gray-500 border-t border-dashed border-gray-300 pt-3">
          Thank you for shopping with Mekky!<br/>
          شكراً لتسوقكم من مكي
        </div>
      </div>
    </div>
  );
}
