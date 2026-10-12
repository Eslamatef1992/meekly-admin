import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, Users, ShoppingBag, Calendar, ArrowRight, Package, Receipt, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { fmtMoney, fmtDate } from '../lib/format';
import { useAuthStore } from '../lib/auth';

function KpiCard({ label, value, sub, icon: Icon, surface, iconBg, iconColor }) {
  return (
    <div className={`kpi ${surface}`}>
      <div className={`kpi-icon ${iconBg} ${iconColor}`}><Icon size={22} /></div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-600 font-medium">{label}</div>
        <div className="text-2xl font-bold mt-0.5 font-display text-gray-900 truncate">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function SectionCard({ title, action, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore(s => s.user);
  const isAr = i18n.language === 'ar';
  const today = new Date().toISOString().slice(0, 10);
  const ytdStart = new Date().getFullYear() + '-01-01';
  const firstName = (user?.full_name || '').split(' ')[0] || 'there';

  const { data: tb } = useQuery({
    queryKey: ['tb', ytdStart, today],
    queryFn: () => api.get('/api/finance/reports/trial-balance', { params: { from: ytdStart, to: today } }).then(r => r.data),
  });
  const { data: pl } = useQuery({
    queryKey: ['pl', ytdStart, today],
    queryFn: () => api.get('/api/finance/reports/income-statement', { params: { from: ytdStart, to: today } }).then(r => r.data),
  });
  const { data: vouchers } = useQuery({
    queryKey: ['recent-vouchers'],
    queryFn: () => api.get('/api/finance/vouchers', { params: { page_size: 6 } }).then(r => r.data),
  });
  const { data: expiring } = useQuery({
    queryKey: ['expiring-docs'],
    queryFn: () => api.get('/api/hr/employees/_/expiring-docs', { params: { days: 60 } }).then(r => r.data),
  });

  const totalDebits = tb?.totals?.debit_balance || 0;
  const netIncome = pl?.netIncome || 0;

  return (
    <div className="space-y-6">
      {/* Header card with greeting */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-8 text-white overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <p className="text-white/80 text-sm">{new Date().toLocaleDateString(t('app.name') ? undefined : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">{t('common.welcome_back')}, {firstName}!</h1>
          <p className="text-white/80 mt-2 text-sm">{t('common.today_is') === 'Today is' ? "Here's what's happening across your branches today." : 'إليك ما يحدث في فروعك اليوم.'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/finance/vouchers/new" className="bg-white text-brand-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-semibold transition">+ {t('finance.voucher.new')}</Link>
            <Link to="/pos" className="bg-white/15 hover:bg-white/25 border border-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">{t('nav.pos_terminal')}</Link>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -right-32 bottom-0 w-64 h-64 bg-accent-300/30 rounded-full blur-3xl"></div>
      </div>

      {/* KPI tiles — pastel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Trial Balance (Debits)"
          value={fmtMoney(totalDebits)}
          sub={`YTD ${ytdStart.slice(0, 4)}`}
          icon={Wallet}
          surface="bg-surface-violet"
          iconBg="bg-white/70"
          iconColor="text-brand-700"
        />
        <KpiCard
          label="Net Income YTD"
          value={fmtMoney(netIncome)}
          sub={netIncome >= 0 ? 'In the green' : 'Loss period'}
          icon={netIncome >= 0 ? TrendingUp : TrendingDown}
          surface={netIncome >= 0 ? 'bg-surface-mint' : 'bg-surface-rose'}
          iconBg="bg-white/70"
          iconColor={netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}
        />
        <KpiCard
          label="Active Employees"
          value="—"
          sub="View all in HR"
          icon={Users}
          surface="bg-surface-sky"
          iconBg="bg-white/70"
          iconColor="text-accent-700"
        />
        <KpiCard
          label="Recent Sales"
          value="—"
          sub="POS + Online"
          icon={ShoppingBag}
          surface="bg-surface-peach"
          iconBg="bg-white/70"
          iconColor="text-orange-700"
        />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: P&L breakdown */}
        <SectionCard
          title="Top Income & Expense Accounts"
          className="lg:col-span-2"
          action={<Link to="/finance/income-statement" className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1">View P&L <ArrowRight size={12}/></Link>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mb-2">Income</div>
              <div className="space-y-1.5">
                {(pl?.income || []).slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-emerald-50 transition">
                    <div className="text-sm">
                      <span className="font-mono text-xs text-gray-400 mr-2">{r.code}</span>
                      <span className="text-gray-800">{r.name}</span>
                    </div>
                    <div className="text-sm font-mono font-semibold text-emerald-700">{fmtMoney(r.amount)}</div>
                  </div>
                ))}
                {(!pl?.income || !pl.income.length) && <div className="text-sm text-gray-400 py-4 text-center">No income posted yet</div>}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-rose-700 font-semibold mb-2">Expenses</div>
              <div className="space-y-1.5">
                {(pl?.expense || []).slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-rose-50 transition">
                    <div className="text-sm">
                      <span className="font-mono text-xs text-gray-400 mr-2">{r.code}</span>
                      <span className="text-gray-800">{r.name}</span>
                    </div>
                    <div className="text-sm font-mono font-semibold text-rose-700">{fmtMoney(r.amount)}</div>
                  </div>
                ))}
                {(!pl?.expense || !pl.expense.length) && <div className="text-sm text-gray-400 py-4 text-center">No expenses posted yet</div>}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Right: quick actions */}
        <SectionCard title={t('common.quick_actions')}>
          <div className="space-y-2">
            <Link to="/finance/vouchers/new" className="flex items-center gap-3 p-3 rounded-xl bg-surface-violet hover:scale-[1.02] transition">
              <div className="w-10 h-10 rounded-xl bg-white grid place-items-center text-brand-700"><Receipt size={18}/></div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{t('finance.voucher.new')}</div>
                <div className="text-xs text-gray-600">{isAr ? 'إنشاء قيد محاسبي' : 'Create a journal entry'}</div>
              </div>
              <ArrowRight size={16} className="text-gray-400 rtl:rotate-180"/>
            </Link>
            <Link to="/pos" className="flex items-center gap-3 p-3 rounded-xl bg-surface-mint hover:scale-[1.02] transition">
              <div className="w-10 h-10 rounded-xl bg-white grid place-items-center text-emerald-700"><Wallet size={18}/></div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{t('nav.pos_terminal')}</div>
                <div className="text-xs text-gray-600">{isAr ? 'مبيعات وإيصالات الكاشير' : 'Counter sales & receipts'}</div>
              </div>
              <ArrowRight size={16} className="text-gray-400 rtl:rotate-180"/>
            </Link>
            <Link to="/hr/payroll" className="flex items-center gap-3 p-3 rounded-xl bg-surface-peach hover:scale-[1.02] transition">
              <div className="w-10 h-10 rounded-xl bg-white grid place-items-center text-orange-700"><Users size={18}/></div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{t('nav.payroll')}</div>
                <div className="text-xs text-gray-600">{isAr ? 'رواتب شهرية + قيد محاسبي' : 'Monthly salary + JV'}</div>
              </div>
              <ArrowRight size={16} className="text-gray-400 rtl:rotate-180"/>
            </Link>
            <Link to="/inventory/items" className="flex items-center gap-3 p-3 rounded-xl bg-surface-sky hover:scale-[1.02] transition">
              <div className="w-10 h-10 rounded-xl bg-white grid place-items-center text-accent-700"><Package size={18}/></div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{t('nav.inventory')}</div>
                <div className="text-xs text-gray-600">{isAr ? 'الأصناف والأرصدة' : 'Items & stock'}</div>
              </div>
              <ArrowRight size={16} className="text-gray-400 rtl:rotate-180"/>
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Expiring documents alert */}
      {expiring?.rows?.length > 0 && (
        <SectionCard
          title={`⚠️  Documents expiring in the next ${expiring.days_horizon} days (${expiring.rows.length})`}
          action={<Link to="/hr/employees" className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1">View all <ArrowRight size={12}/></Link>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiring.rows.slice(0, 9).map((d, i) => {
              const tone = d.days_left < 0 ? 'bg-rose-50 border-rose-200 text-rose-700'
                         : d.days_left <= 14 ? 'bg-rose-50 border-rose-200 text-rose-700'
                         : d.days_left <= 30 ? 'bg-amber-50 border-amber-200 text-amber-800'
                         : 'bg-yellow-50 border-yellow-200 text-yellow-800';
              const docLabel = {
                iqama: 'Iqama', passport: 'Passport', civil_id: 'Civil ID',
                driving_license: 'Driving License', car_registration: 'Car Registration', health_card: 'Health Card',
              }[d.doc_type] || d.doc_type;
              return (
                <div key={`${d.employee_id}-${d.doc_type}-${i}`} className={`rounded-2xl border p-3 ${tone}`}>
                  <div className="flex items-center gap-3">
                    {d.image_url
                      ? <img src={d.image_url} className="w-10 h-10 rounded-full object-cover"/>
                      : <div className="w-10 h-10 rounded-full bg-white/70 grid place-items-center font-semibold">{(d.full_name || '?').charAt(0)}</div>}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{d.full_name}</div>
                      <div className="text-xs opacity-80 font-mono">{d.employee_no}</div>
                    </div>
                    <AlertTriangle size={16}/>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold">{docLabel}</span>
                    <span className="font-mono">
                      {d.days_left < 0
                        ? `expired ${-d.days_left}d ago`
                        : d.days_left === 0 ? 'expires today'
                        : `in ${d.days_left}d`}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-70 mt-0.5">{d.expiry_date}</div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Recent vouchers */}
      <SectionCard
        title="Recent Vouchers"
        action={<Link to="/finance/vouchers" className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1">See all <ArrowRight size={12}/></Link>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(vouchers?.data || []).slice(0, 6).map(v => {
            const palette = v.voucher_type === 'receipt' ? 'bg-surface-mint' :
                            v.voucher_type === 'payment' ? 'bg-surface-rose' :
                            v.voucher_type === 'sales'   ? 'bg-surface-violet' :
                            v.voucher_type === 'purchase'? 'bg-surface-peach' :
                                                            'bg-surface-sky';
            return (
              <Link key={v.id} to={`/finance/vouchers/${v.id}`} className={`block rounded-2xl ${palette} p-4 hover:shadow-md transition`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-gray-600">{v.voucher_no}</span>
                  <span className={`badge ${v.status === 'posted' ? 'badge-green' : v.status === 'cancelled' ? 'badge-red' : 'badge-gray'}`}>{v.status}</span>
                </div>
                <div className="text-xs text-gray-700 capitalize font-medium">{v.voucher_type}</div>
                <div className="text-lg font-bold font-mono text-gray-900 mt-2">{fmtMoney(v.total_debit)}</div>
                <div className="text-xs text-gray-600 mt-1 truncate">{v.narration || '—'}</div>
                <div className="text-xs text-gray-500 mt-2">{fmtDate(v.voucher_date)}</div>
              </Link>
            );
          })}
          {(!vouchers?.data || !vouchers.data.length) && (
            <div className="col-span-3 text-center text-sm text-gray-400 py-8">No vouchers yet — create your first voucher to see activity here.</div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

