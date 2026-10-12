import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

export default function Products() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['products-admin'],
    queryFn: () => api.get('/api/ecom/products').then(r => r.data),
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.products')}</h1>
      <div className="card">
        <table className="table">
          <thead><tr><th>SKU</th><th>Name</th><th className="text-end">Price</th><th className="text-end">Stock</th><th>Published</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="text-center py-6">{t('common.loading')}</td></tr>}
            {!isLoading && (data?.data || []).map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="font-mono">{p.sku}</td>
                <td>{p.name}<span className="text-xs text-gray-400 ms-2">{p.name_ar}</span></td>
                <td className="text-end font-mono">{fmtMoney(p.price)}</td>
                <td className="text-end font-mono">{Number(p.stock_qty)}</td>
                <td>{p.is_published ? <span className="badge-green">Yes</span> : <span className="badge-gray">No</span>}</td>
              </tr>
            ))}
            {!isLoading && !(data?.data || []).length && <tr><td colSpan={5} className="text-center py-6 text-gray-500">{t('common.no_data')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
