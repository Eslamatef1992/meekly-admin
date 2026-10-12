import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scroll the page (and the main scroll container) back to the top
// whenever the route changes. Without this, React Router preserves
// the previous scroll position and pages can open half-way down.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Browser window scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // The Layout uses <main className="overflow-x-auto"> which may have its own scroll
    document.querySelectorAll('main').forEach(el => el.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  }, [pathname]);

  return null;
}
