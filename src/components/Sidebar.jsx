import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, BookOpen, FileText, Scale, Users, Package, ShoppingCart,
  Boxes, Receipt, ListTree, Building2, Settings, Calculator, Wallet,
  FileSignature, Calendar, Briefcase, Store, CreditCard, Shield,
  User as UserIcon, HelpCircle, LogOut, ChevronRight, ArrowRightLeft,
  ArrowUpDown, Warehouse as WarehouseIcon, Tags, Building, ChevronUp,
  Upload, Wallet as WalletIcon, Banknote, Monitor, Globe, Cog,
  Search, PanelsTopLeft, ChevronsDownUp, ChevronsUpDown, Dot,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../lib/auth';

// Each module gets a subtle accent color used for the left indicator bar
// on the active route and for the dot next to the section header.
const MODULE_ACCENTS = {
  core:      'bg-sky-500',
  finance:   'bg-emerald-500',
  hr:        'bg-violet-500',
  inventory: 'bg-amber-500',
  pos:       'bg-rose-500',
  ecom:      'bg-pink-500',
  system:    'bg-slate-500',
};

function NavItem({ to, icon: Icon, children, badge, exact = false, accent = 'bg-brand-500', hidden, query }) {
  // Hide items that don't match the quick-search query
  if (hidden) return null;
  if (query) {
    const label = String(children ?? '').toLowerCase();
    if (!label.includes(query.toLowerCase())) return null;
  }
  return (
    <NavLink to={to} end={exact}
      className={({ isActive }) => clsx(
        'group relative flex items-center gap-3 ps-4 pe-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-brand-900 text-white shadow-md shadow-brand-900/20'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}>
      {({ isActive }) => (
        <>
          {/* Left accent bar — only on active */}
          <span
            className={clsx(
              'absolute start-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-e-full transition-all',
              isActive ? `${accent} opacity-100` : 'opacity-0'
            )}
          />
          {Icon && (
            <Icon
              size={17}
              className={clsx(
                'shrink-0 transition-transform duration-150',
                isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-900',
                'group-hover:scale-110'
              )}
            />
          )}
          <span className="flex-1 truncate">{children}</span>
          {badge != null && badge !== 0 && (
            <span className={clsx(
              'text-[10px] font-semibold rounded-full px-1.5 min-w-[20px] h-5 grid place-items-center',
              isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
            )}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// Collapsible section header — small icon + title + chevron
function Section({ id, title, icon: Icon, accent = 'bg-brand-500', children, defaultOpen = true, hasActive = false, forceOpen }) {
  const key = `mekky.sidebar.section.${id}`;
  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) return saved === '1';
    return defaultOpen;
  });

  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);
  useEffect(() => { if (forceOpen === true) setOpen(true); if (forceOpen === false) setOpen(false); }, [forceOpen]);

  const toggle = () => {
    setOpen(o => {
      const next = !o;
      localStorage.setItem(key, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div className="mt-4 first:mt-2">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-gray-400 uppercase hover:text-gray-700 transition group"
      >
        <span className={clsx('h-1.5 w-1.5 rounded-full', accent, 'opacity-80 group-hover:opacity-100')} />
        {Icon && <Icon size={12} className="opacity-70 group-hover:opacity-100" />}
        <span className="flex-1 text-start">{title}</span>
        <ChevronUp
          size={13}
          className={clsx('transition-transform duration-200 opacity-60 group-hover:opacity-100',
            !open && 'rotate-180')}
        />
      </button>
      <div className={clsx(
        'grid transition-all duration-200 ease-out',
        open ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0',
      )}>
        <div className="overflow-hidden">
          <div className="space-y-0.5 py-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open }) {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const matches = (prefixes) => prefixes.some(p => pathname.startsWith(p));

  // Quick search — filters NavItem children by their text label
  const [query, setQuery] = useState('');
  // Expand/collapse all
  const [forceAll, setForceAll] = useState(null); // true=all open, false=all closed, null=user state
  useEffect(() => {
    if (query) setForceAll(true); // auto-expand all while searching
    else setForceAll(null);
  }, [query]);

  // Derive role chip for the profile card
  const primaryRole = useMemo(() => {
    const roles = user?.roles || [];
    if (roles.includes('super_admin')) return t('role.super_admin') || 'Super Admin';
    return roles[0] || t('role.user') || 'User';
  }, [user, t]);

  return (
    <aside className={clsx(
      'shrink-0 bg-white border-e border-gray-100 flex flex-col transition-all duration-200',
      open ? 'w-72' : 'w-0 overflow-hidden'
    )}>
      {/* Logo */}
      <div className="h-20 flex items-center px-5 border-b border-gray-100">
        <img src="/mekky-logo.svg" alt="MEKKY" className="h-12 w-auto" />
      </div>

      {/* Quick search + expand/collapse toolbar */}
      <div className="px-3 pt-3 pb-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-2.5 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search') || 'Search…'}
            className="w-full h-8 ps-7 pe-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute top-1/2 -translate-y-1/2 end-2 text-gray-400 hover:text-gray-700 text-xs"
              title="Clear"
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={() => setForceAll(forceAll === true ? false : true)}
          className="h-8 w-8 grid place-items-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
          title={forceAll === true ? 'Collapse all' : 'Expand all'}
        >
          {forceAll === true ? <ChevronsDownUp size={14}/> : <ChevronsUpDown size={14}/>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 scrollbar-thin">
        {/* Top-level pinned items (always visible, no section wrapper) */}
        <div className="space-y-0.5 mt-1">
          <NavItem to="/" icon={LayoutDashboard} exact accent={MODULE_ACCENTS.core} query={query}>{t('nav.dashboard')}</NavItem>
          <NavItem to="/companies" icon={Building}   accent={MODULE_ACCENTS.core} query={query}>{t('nav.company')}</NavItem>
          <NavItem to="/branches"  icon={Building2}  accent={MODULE_ACCENTS.core} query={query}>{t('nav.branches')}</NavItem>
        </div>

        <Section id="finance"   title={t('nav.finance')}         icon={WalletIcon}  accent={MODULE_ACCENTS.finance}   hasActive={matches(['/finance'])}  forceOpen={forceAll}>
          <NavItem to="/finance/accounts"          icon={ListTree}  accent={MODULE_ACCENTS.finance} query={query}>{t('nav.chart_of_accounts')}</NavItem>
          <NavItem to="/finance/vouchers"          icon={Receipt}   accent={MODULE_ACCENTS.finance} query={query}>{t('nav.vouchers')}</NavItem>
          <NavItem to="/finance/trial-balance"     icon={Scale}     accent={MODULE_ACCENTS.finance} query={query}>{t('nav.trial_balance')}</NavItem>
          <NavItem to="/finance/general-ledger"    icon={BookOpen}  accent={MODULE_ACCENTS.finance} query={query}>{t('nav.general_ledger')}</NavItem>
          <NavItem to="/finance/income-statement"  icon={FileText}  accent={MODULE_ACCENTS.finance} query={query}>{t('nav.income_statement')}</NavItem>
          <NavItem to="/finance/balance-sheet"     icon={Scale}     accent={MODULE_ACCENTS.finance} query={query}>{t('nav.balance_sheet')}</NavItem>
          <NavItem to="/finance/uploads"           icon={Upload}    accent={MODULE_ACCENTS.finance} query={query}>{t('nav.financial_uploads')}</NavItem>
        </Section>

        <Section id="hr"        title={t('nav.human_resources')} icon={Briefcase}   accent={MODULE_ACCENTS.hr}        hasActive={matches(['/hr'])}       forceOpen={forceAll}>
          <NavItem to="/hr/employees"           icon={Users}         accent={MODULE_ACCENTS.hr} query={query}>{t('nav.employees')}</NavItem>
          <NavItem to="/hr/salary-components"   icon={Wallet}        accent={MODULE_ACCENTS.hr} query={query}>{t('nav.salary_components')}</NavItem>
          <NavItem to="/hr/payroll"             icon={Calculator}    accent={MODULE_ACCENTS.hr} query={query}>{t('nav.payroll')}</NavItem>
          <NavItem to="/hr/leaves"              icon={Calendar}      accent={MODULE_ACCENTS.hr} query={query}>{t('nav.leave_requests')}</NavItem>
          <NavItem to="/hr/requests"            icon={FileSignature} accent={MODULE_ACCENTS.hr} query={query}>{t('nav.employee_requests')}</NavItem>
          <NavItem to="/hr/termination"         icon={FileText}      accent={MODULE_ACCENTS.hr} query={query}>{t('nav.termination')}</NavItem>
        </Section>

        <Section id="inventory" title={t('nav.inventory')}       icon={Boxes}       accent={MODULE_ACCENTS.inventory} hasActive={matches(['/inventory'])} forceOpen={forceAll}>
          <NavItem to="/inventory/items"       icon={Package}        accent={MODULE_ACCENTS.inventory} query={query}>{t('nav.items')}</NavItem>
          <NavItem to="/inventory/stock"       icon={Boxes}          accent={MODULE_ACCENTS.inventory} query={query}>{t('nav.stock_balances')}</NavItem>
          <NavItem to="/inventory/movements"   icon={ArrowUpDown}    accent={MODULE_ACCENTS.inventory} query={query}>{t('nav.stock_movements')}</NavItem>
          <NavItem to="/inventory/transfer"    icon={ArrowRightLeft} accent={MODULE_ACCENTS.inventory} query={query}>{t('nav.stock_transfer')}</NavItem>
          <NavItem to="/inventory/count"       icon={Calculator}     accent={MODULE_ACCENTS.inventory} query={query}>{t('nav.stock_count')}</NavItem>
          <NavItem to="/inventory/categories"  icon={Tags}           accent={MODULE_ACCENTS.inventory} query={query}>{t('nav.categories')}</NavItem>
          <NavItem to="/inventory/warehouses"  icon={WarehouseIcon}  accent={MODULE_ACCENTS.inventory} query={query}>{t('nav.warehouses')}</NavItem>
        </Section>

        <Section id="pos"       title={t('nav.pos')}             icon={Monitor}     accent={MODULE_ACCENTS.pos}       hasActive={matches(['/pos'])}       forceOpen={forceAll}>
          <NavItem to="/pos"           icon={CreditCard} accent={MODULE_ACCENTS.pos} query={query}>{t('nav.pos_terminal')}</NavItem>
          <NavItem to="/pos/registers" icon={Store}      accent={MODULE_ACCENTS.pos} query={query}>{t('nav.registers')}</NavItem>
        </Section>

        <Section id="ecom"      title={t('nav.ecommerce')}       icon={Globe}       accent={MODULE_ACCENTS.ecom}      hasActive={matches(['/ecom'])}      forceOpen={forceAll}>
          <NavItem to="/ecom/products" icon={Package}      accent={MODULE_ACCENTS.ecom} query={query}>{t('nav.products')}</NavItem>
          <NavItem to="/ecom/orders"   icon={ShoppingCart} accent={MODULE_ACCENTS.ecom} query={query}>{t('nav.orders')}</NavItem>
        </Section>

        <Section id="system"    title={t('nav.system')}          icon={Cog}         accent={MODULE_ACCENTS.system}    hasActive={matches(['/system'])}    forceOpen={forceAll}>
          <NavItem to="/system/users" icon={Users}  accent={MODULE_ACCENTS.system} query={query}>{t('nav.users')}</NavItem>
          <NavItem to="/system/roles" icon={Shield} accent={MODULE_ACCENTS.system} query={query}>{t('nav.roles_permissions')}</NavItem>
        </Section>
      </nav>

      {/* Footer — profile card */}
      <div className="border-t border-gray-100 p-3">
        <NavLink to="/profile" className="group flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center font-semibold shadow-sm">
              {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" title="Online" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {user?.full_name || 'User'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 truncate">
              <span className="inline-block px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold uppercase tracking-wide">
                {primaryRole}
              </span>
              <span className="truncate">{user?.email}</span>
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-400 rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
        </NavLink>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="mt-1 w-full flex items-center gap-3 ps-4 pe-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut size={16}/> {t('nav.sign_out')}
        </button>
      </div>
    </aside>
  );
}
