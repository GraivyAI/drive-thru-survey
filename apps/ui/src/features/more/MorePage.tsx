import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLocationDetails, type LocationDetails } from '@/features/more/useLocationDetails';

function formatStoreAddress(d: LocationDetails): string {
  const line1 = [d.address, d.address2].filter(Boolean).join(', ');
  return [line1, `${d.city}, ${d.state} ${d.postalCode}`].filter(Boolean).join('\n');
}

export function MorePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const location = useAuthStore((s) => s.location);
  const lane = useAuthStore((s) => s.lane);
  const theme = useThemeStore((s) => s.theme);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const {
    data: storeDetails,
    isPending: storeDetailsLoading,
    isError: storeDetailsError,
  } = useLocationDetails(location?.id);

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

      <main className="space-y-3 px-4 py-3">
        {location ? (
          <div
            className="rounded-2xl border border-line px-4 py-3.5"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                <MapPin className="h-4 w-4 text-graivy-green" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-txt-muted">
                  Location
                </p>
                <p className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-txt-primary">
                  {storeDetails?.name ?? location.name}
                </p>
                {storeDetails && !storeDetails.isActive ? (
                  <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-500">
                    This store is marked inactive in the system.
                  </p>
                ) : null}
                {(storeDetails?.code ?? location.code) ? (
                  <p className="mt-1.5 text-[11px] text-txt-muted">
                    Store code{' '}
                    <span className="font-medium text-txt-secondary">
                      {storeDetails?.code ?? location.code}
                    </span>
                  </p>
                ) : null}
                {lane ? (
                  <p className="mt-0.5 text-[11px] text-txt-muted">
                    Lane{' '}
                    <span className="font-medium text-txt-secondary">{lane.shortCode}</span>
                    {lane.name ? (
                      <span className="text-txt-faint"> · {lane.name}</span>
                    ) : null}
                  </p>
                ) : null}
                {storeDetailsLoading ? (
                  <p className="mt-2 text-[11px] text-txt-faint">Loading store details…</p>
                ) : null}
                {storeDetailsError ? (
                  <p className="mt-2 text-[11px] text-txt-muted">Couldn’t load full store details.</p>
                ) : null}
                {storeDetails ? (
                  <div className="mt-2 space-y-2 border-t border-line pt-2">
                    {storeDetails.description ? (
                      <p className="text-[12px] leading-snug text-txt-secondary">{storeDetails.description}</p>
                    ) : null}
                    <p className="whitespace-pre-line text-[12px] leading-snug text-txt-secondary">
                      {formatStoreAddress(storeDetails)}
                    </p>
                    <div className="flex flex-col gap-1 text-[11px] text-txt-muted">
                      {storeDetails.phone ? (
                        <a
                          href={`tel:${storeDetails.phone.replace(/\s/g, '')}`}
                          className="font-medium text-graivy-green hover:underline"
                        >
                          {storeDetails.phone}
                        </a>
                      ) : null}
                      {storeDetails.email ? (
                        <a
                          href={`mailto:${storeDetails.email}`}
                          className="break-all font-medium text-graivy-green hover:underline"
                        >
                          {storeDetails.email}
                        </a>
                      ) : null}
                      <p>
                        Timezone{' '}
                        <span className="font-medium text-txt-secondary">{storeDetails.timezone}</span>
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        <div
          className="overflow-hidden rounded-2xl border border-line"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-txt-primary">Appearance</p>
              <p className="text-[11px] text-txt-muted mt-0.5">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-txt-primary">Log out</p>
              <p className="text-[11px] text-txt-muted mt-0.5">End this session</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="rounded-lg p-2 text-txt-muted transition-colors hover:text-red-500"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
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
