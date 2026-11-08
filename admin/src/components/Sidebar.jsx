import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Order/list matches the client's existing "Premium Phone" admin panel
// screenshot (build-spec.md §6) — this is the functional spec for admin,
// since the Figma file only covers the storefront (build-spec.md §3).
const MODULES = [
  { key: 'dashboard', path: '/' },
  { key: 'categories', path: '/categories' },
  { key: 'subcategories', path: '/subcategories' },
  { key: 'products', path: '/products' },
  { key: 'brands', path: '/brands' },
  { key: 'attributes', path: '/attributes' },
  { key: 'stock', path: '/stock' },
  { key: 'orders', path: '/orders' },
  { key: 'guestOrders', path: '/guest-orders' },
  { key: 'paymentLinks', path: '/payment-links' },
  { key: 'promoCodes', path: '/promo-codes' },
  { key: 'reviews', path: '/reviews' },
  { key: 'cmsPages', path: '/cms-pages' },
  { key: 'cmsBanners', path: '/cms-banners' },
  { key: 'settings', path: '/settings' },
  { key: 'roles', path: '/roles' },
  { key: 'admins', path: '/admins' },
];

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <img src="/logo-white.png" alt="" style={{ height: 32 }} />
        {t('app_name')}
      </div>
      <nav className="admin-sidebar__nav">
        {MODULES.map((m) => (
          <NavLink
            key={m.key}
            to={m.path}
            end={m.path === '/'}
            className={({ isActive }) => `admin-sidebar__link${isActive ? ' active' : ''}`}
          >
            {t(`nav.${m.key}`)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
