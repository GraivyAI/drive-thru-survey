import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { GraivyLogo } from './GraivyLogo';
import { ThemeToggle } from './ThemeToggle';

interface AppHeaderProps {
  subtitle?: string;
  right?: React.ReactNode;
  lastUpdated?: Date | null;
}

export function AppHeader({ subtitle, right, lastUpdated }: AppHeaderProps) {
  const location = useAuthStore((s) => s.location);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    : null;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-line"
      style={{ backgroundColor: 'var(--bg-header)' }}>
      <div className="flex items-center justify-between px-5 py-3">
        <GraivyLogo className="h-6 w-auto" />
        <div className="flex items-center gap-0.5">
          {right}
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-txt-muted hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="px-5 pb-3 flex items-end justify-between">
        <div>
          <h1 className="font-semibold text-txt-primary text-[15px] tracking-tight">
            {location?.name || 'Survey'}
          </h1>
          {subtitle && <p className="text-[11px] text-txt-muted mt-0.5 tracking-wide uppercase">{subtitle}</p>}
        </div>
        {updatedStr && (
          <span className="text-[10px] text-txt-muted tabular-nums tracking-wide">
            {updatedStr}
          </span>
        )}
      </div>
    </header>
  );
}
