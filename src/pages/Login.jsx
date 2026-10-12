import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth';

// Furniture interior background — swap to your own product photo any time by
// replacing this URL or by dropping `apps/admin/public/login-bg.jpg` and changing the src.
const HERO_IMAGE = 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1600&q=80';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const isAuthed = useAuthStore(s => !!s.accessToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email: email.trim(), password });
      setAuth(data);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.invalid'));
    } finally {
      setLoading(false);
    }
  };

  const toggleLng = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('lng', next);
    document.dir = next === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT: hero image (hidden on small screens) */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-[#333b83]/20" />
      </div>

      {/* RIGHT: form panel */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="flex justify-end p-4">
          <button
            onClick={toggleLng}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            {i18n.language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-6">
              <img src="/mekky-logo.svg" alt="Mekky International" className="h-28 w-auto" />
            </div>

            <h1 className="text-2xl font-semibold text-center text-[#333b83] mb-10">
              {t('auth.welcome_back') || 'Welcome Back'}
            </h1>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.email') || 'Email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.email') || 'Email'}
                  className="w-full rounded-full border border-gray-200 px-5 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#2e9dd7] focus:ring-2 focus:ring-[#2e9dd7]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.password') || 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('auth.password') || 'Password'}
                    className="w-full rounded-full border border-gray-200 px-5 py-3 pe-12 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#2e9dd7] focus:ring-2 focus:ring-[#2e9dd7]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(s => !s)}
                    className="absolute inset-y-0 end-4 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#2e9dd7] hover:bg-[#1f86bc] text-white font-medium py-3 transition-colors disabled:opacity-60"
              >
                {loading ? (t('common.loading') || 'Signing in…') : (t('auth.sign_in') || 'Login')}
              </button>
            </form>
          </div>
        </div>

        <div className="pb-8 pt-4 text-center text-xs text-gray-500">
          Powered by{' '}
          <a
            href="https://teknulugy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#333b83] hover:text-[#2e9dd7] hover:underline"
          >
            Teknulugy
          </a>
        </div>
      </div>
    </div>
  );
}
