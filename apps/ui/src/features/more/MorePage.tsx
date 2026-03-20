import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

export function MorePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const locationName = useAuthStore((s) => s.location?.name);
  const theme = useThemeStore((s) => s.theme);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-surface-page pb-20">
      <AppHeader />

      <main className="px-4 py-3 space-y-3">
        <div className="-mt-1 space-y-1">
          <p className="text-[11px] font-semibold text-txt-muted uppercase tracking-[0.2em]">
            More
          </p>
          {locationName ? (
            <p className="text-[12px] text-txt-secondary font-medium truncate">{locationName}</p>
          ) : null}
        </div>
        <div
          className="rounded-2xl border border-line overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-line">
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-txt-primary">Appearance</p>
              <p className="text-[11px] text-txt-muted mt-0.5">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line"
              style={{ backgroundColor: 'var(--bg-input)' }}
            >
              <LogOut className="h-4 w-4 text-red-500" />
            </span>
            <span>
              <span className="block text-sm font-medium text-txt-primary">Log out</span>
              <span className="block text-[11px] text-txt-muted mt-0.5">End this session</span>
            </span>
          </button>
        </div>
      </main>

      <BottomNav />

      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
