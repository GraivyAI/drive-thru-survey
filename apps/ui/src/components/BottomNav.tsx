import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, BarChart3, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/orders', label: 'Orders', icon: ClipboardList },
  { path: '/report', label: 'Report', icon: BarChart3 },
  { path: '/more', label: 'More', icon: MoreHorizontal },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-line z-50"
      style={{ backgroundColor: 'var(--bg-nav)' }}>
      <div className="flex">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium tracking-wide uppercase transition-colors',
                active ? 'text-txt-primary' : 'text-txt-muted',
              )}
            >
              <tab.icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
