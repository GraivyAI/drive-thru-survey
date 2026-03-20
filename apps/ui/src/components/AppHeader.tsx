import { GuestMarkLogo } from './GuestMarkLogo';
import { ByGraivyLogo } from './ByGraivyLogo';

interface AppHeaderProps {
  right?: React.ReactNode;
}

export function AppHeader({ right }: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl border-b border-line pt-[env(safe-area-inset-top,0px)]"
      style={{ backgroundColor: 'var(--bg-header)' }}
    >
      <div className="flex min-h-12 items-center justify-between gap-3 px-5 py-2">
        <div className="flex min-w-0 items-end gap-2 leading-none shrink-0">
          <GuestMarkLogo className="h-4 w-auto max-w-[min(96px,38vw)] shrink-0" />
          <ByGraivyLogo className="h-[0.525rem] w-auto max-w-[min(41px,20.4vw)] shrink-0" />
        </div>
        {right ? <div className="flex items-center gap-0.5 shrink-0">{right}</div> : null}
      </div>
    </header>
  );
}
