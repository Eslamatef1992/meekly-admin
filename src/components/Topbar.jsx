import { Menu, Globe, Bell, HelpCircle, Building2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../lib/auth';

export default function Topbar({ onMenu }) {
  const { i18n, t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const branches = useAuthStore(s => s.branches);
  const currentBranchId = useAuthStore(s => s.currentBranchId);
  const setCurrentBranchId = useAuthStore(s => s.setCurrentBranchId);

  const toggleLng = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('lng', next);
    document.dir = next === 'ar' ? 'rtl' : 'ltr';
  };

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';

  return (
    <header className="h-20 bg-white border-b border-gray-100 px-6 flex items-center gap-4 sticky top-0 z-20">
      <button onClick={onMenu} className="p-2 rounded-xl hover:bg-gray-100 lg:hidden"><Menu size={20} /></button>

      {/* Welcome */}
      <div className="hidden md:block">
        <div className="text-xs text-gray-500">{t('common.welcome_back') || 'Welcome back'},</div>
        <div className="font-semibold text-gray-900 text-base leading-tight">{firstName} 👋</div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${i18n.language === 'ar' ? 'right-4' : 'left-4'}`} />
          <input
            placeholder={i18n.language === 'ar' ? 'بحث عن سندات، موظفين، منتجات، طلبات...' : 'Search vouchers, employees, products, orders...'}
            className={`w-full py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none transition text-sm ${i18n.language === 'ar' ? 'pr-11 pl-16' : 'pl-11 pr-16'}`}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-500">⌘ K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Branch selector */}
        {branches && branches.length > 0 && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50">
            <Building2 size={14} className="text-gray-500" />
            <select
              value={currentBranchId || ''}
              onChange={e => setCurrentBranchId(Number(e.target.value))}
              className="bg-transparent text-sm outline-none border-0 cursor-pointer pr-1 font-medium"
              title="Branch"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {i18n.language === 'ar' && b.name_ar ? b.name_ar : b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button onClick={toggleLng} className="hidden sm:flex w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center text-xs font-semibold text-gray-700">
          {i18n.language === 'ar' ? 'EN' : 'ع'}
        </button>

        <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center text-gray-600 hover:text-brand-700" title="Help">
          <HelpCircle size={18} />
        </button>

        <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center text-gray-600 hover:text-brand-700 relative" title="Notifications">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="hidden lg:flex items-center gap-2 ml-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center font-semibold shadow-sm">
            {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
