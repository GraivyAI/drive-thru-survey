import { GuestMarkLogo } from './GuestMarkLogo';

interface AppHeaderProps {
  right?: React.ReactNode;
}

export function AppHeader({ right }: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl border-b border-line"
      style={{ backgroundColor: 'var(--bg-header)' }}
    >
      <div className="flex min-h-14 items-center justify-between px-5 py-3 gap-3">
        <GuestMarkLogo className="h-4 w-auto max-w-[min(104px,40vw)] shrink-0" />
        {right ? <div className="flex items-center gap-0.5 shrink-0">{right}</div> : null}
      </div>
    </header>
  );
}
