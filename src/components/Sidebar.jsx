import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, FileText, Scale, Users, Package, ShoppingCart,
  Boxes, Receipt, ListTree, Building2, Settings, Calculator, Wallet,
  FileSignature, Calendar, Briefcase, Store, CreditCard, Shield,
  User as UserIcon, HelpCircle, LogOut, ChevronRight, ArrowRightLeft,
  ArrowUpDown, Warehouse as WarehouseIcon, Tags, Building, ChevronUp,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../lib/auth';

function NavItem({ to, icon: Icon, children, badge, exact = false }) {
  return (
    <NavLink to={to} end={exact}
      className={({ isActive }) => clsx('nav-item', isActive && 'nav-item-active')}>
      {Icon && <Icon size={18} className="shrink-0" />}
      <span className="flex-1">{children}</span>
      {badge != null && (
        <span className="bg-orange-500 text-white text-[10px] font-semibold rounded-full px-1.5 min-w-[20px] h-5 grid place-items-center">{badge}</span>
      )}
    </NavLink>
  );
}

// Collapsible section — chevron flips, state remembered in localStorage,
// auto-opens if any of its child routes is active so you don't lose context after a refresh.
function Section({ id, title, children, defaultOpen = true, hasActive = false }) {
  const key = `mekky.sidebar.section.${id}`;
  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) return saved === '1';
    return defaultOpen;
  });

  // If a child route is active, force the section open
  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

  const toggle = () => {
    setOpen(o => {
      const next = !o;
      localStorage.setItem(key, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 mt-5 mb-2 text-[10px] font-semibold tracking-[0.18em] text-gray-400 uppercase hover:text-gray-600 transition"
      >
        <span>{title}</span>
        <ChevronUp
          size={14}
          className={clsx('transition-transform duration-200', !open && 'rotate-180')}
        />
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

export default function Sidebar({ open }) {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Helper: does any subpath in this list match the current route?
  const matches = (prefixes) => prefixes.some(p => pathname.startsWith(p));

  return (
    <aside className={clsx(
      'shrink-0 bg-white border-e border-gray-100 flex flex-col transition-all duration-200',
      open ? 'w-72' : 'w-0 overflow-hidden'
    )}>
      {/* Logo */}
      <div className="h-20 flex items-center px-5 border-b border-gray-100">
        <img src="/mekky-logo.svg" alt="MEKKY" className="h-12 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <NavItem to="/" icon={LayoutDashboard} exact>{t('nav.dashboard')}</NavItem>
        <NavItem to="/companies" icon={Building}>{t('nav.company')}</NavItem>
        <NavItem to="/branches"  icon={Building2}>{t('nav.branches')}</NavItem>

        <Section id="finance" title={t('nav.finance')} hasActive={matches(['/finance'])}>
          <NavItem to="/finance/accounts"          icon={ListTree}>{t('nav.chart_of_accounts')}</NavItem>
          <NavItem to="/finance/vouchers"          icon={Receipt}>{t('nav.vouchers')}</NavItem>
          <NavItem to="/finance/trial-balance"     icon={Scale}>{t('nav.trial_balance')}</NavItem>
          <NavItem to="/finance/general-ledger"    icon={FileText}>{t('nav.general_ledger')}</NavItem>
          <NavItem to="/finance/income-statement"  icon={FileText}>{t('nav.income_statement')}</NavItem>
          <NavItem to="/finance/balance-sheet"     icon={Scale}>{t('nav.balance_sheet')}</NavItem>
        </Section>

        <Section id="hr" title={t('nav.human_resources')} hasActive={matches(['/hr'])}>
          <NavItem to="/hr/employees"           icon={Users}>{t('nav.employees')}</NavItem>
          <NavItem to="/hr/salary-components"   icon={Wallet}>{t('nav.salary_components')}</NavItem>
          <NavItem to="/hr/payroll"             icon={Calculator}>{t('nav.payroll')}</NavItem>
          <NavItem to="/hr/leaves"              icon={Calendar}>{t('nav.leave_requests')}</NavItem>
          <NavItem to="/hr/requests"            icon={FileSignature}>{t('nav.employee_requests')}</NavItem>
          <NavItem to="/hr/termination"         icon={FileText}>{t('nav.termination')}</NavItem>
        </Section>

        <Section id="inventory" title={t('nav.inventory')} hasActive={matches(['/inventory'])}>
          <NavItem to="/inventory/items"       icon={Package}>{t('nav.items')}</NavItem>
          <NavItem to="/inventory/stock"       icon={Boxes}>{t('nav.stock_balances')}</NavItem>
          <NavItem to="/inventory/movements"   icon={ArrowUpDown}>{t('nav.stock_movements')}</NavItem>
          <NavItem to="/inventory/transfer"    icon={ArrowRightLeft}>{t('nav.stock_transfer')}</NavItem>
          <NavItem to="/inventory/count"       icon={Calculator}>{t('nav.stock_count')}</NavItem>
          <NavItem to="/inventory/categories"  icon={Tags}>{t('nav.categories')}</NavItem>
          <NavItem to="/inventory/warehouses"  icon={WarehouseIcon}>{t('nav.warehouses')}</NavItem>
        </Section>

        <Section id="pos" title={t('nav.pos')} hasActive={matches(['/pos'])}>
          <NavItem to="/pos"           icon={CreditCard}>{t('nav.pos_terminal')}</NavItem>
          <NavItem to="/pos/registers" icon={Store}>{t('nav.registers')}</NavItem>
        </Section>

        <Section id="ecom" title={t('nav.ecommerce')} hasActive={matches(['/ecom'])}>
          <NavItem to="/ecom/products" icon={Package}>{t('nav.products')}</NavItem>
          <NavItem to="/ecom/orders"   icon={ShoppingCart}>{t('nav.orders')}</NavItem>
        </Section>

        <Section id="system" title={t('nav.system')} hasActive={matches(['/system'])}>
          <NavItem to="/system/users"    icon={Users}>{t('nav.users')}</NavItem>
          <NavItem to="/system/roles"    icon={Shield}>{t('nav.roles_permissions')}</NavItem>
        </Section>
      </nav>

      {/* Footer — profile card */}
      <div className="border-t border-gray-100 p-3">
        <NavLink to="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center font-semibold shadow-sm">
            {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.full_name || 'User'}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
          <ChevronRight size={16} className="text-gray-400 rtl:rotate-180" />
        </NavLink>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="mt-1 nav-item w-full !text-rose-600 hover:bg-rose-50"
        >
          <LogOut size={16}/> {t('nav.sign_out')}
        </button>
      </div>
    </aside>
  );
}
