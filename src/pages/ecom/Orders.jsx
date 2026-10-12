import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { fmtMoney, fmtDate } from '../../lib/format';

export default function Orders() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/api/ecom/orders').then(r => r.data),
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.orders')}</h1>
      <div className="card">
        <table className="table">
          <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th className="text-end">Total</th><th>Status</th><th>Payment</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center py-6">{t('common.loading')}</td></tr>}
            {!isLoading && (data?.data || []).map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="font-mono">{o.order_no}</td>
                <td>{o.customer_name}<div className="text-xs text-gray-500">{o.customer_email}</div></td>
                <td>{fmtDate(o.placed_at)}</td>
                <td className="text-end font-mono">{fmtMoney(o.total, o.currency_code)}</td>
                <td><span className="badge-blue">{o.status}</span></td>
                <td><span className="badge-gray">{o.payment_status}</span></td>
              </tr>
            ))}
            {!isLoading && !(data?.data || []).length && <tr><td colSpan={6} className="text-center py-6 text-gray-500">{t('common.no_data')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
