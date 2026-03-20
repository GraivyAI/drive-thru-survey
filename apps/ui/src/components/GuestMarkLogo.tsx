import { useThemeStore } from '@/stores/themeStore';

interface GuestMarkLogoProps {
  className?: string;
}

const LIGHT_SRC = '/branding/GuestMark-logo-RGB-light.svg';
const DARK_SRC = '/branding/GuestMark-logo-RGB-dark.svg';

export function GuestMarkLogo({ className = 'h-10 w-auto max-w-full' }: GuestMarkLogoProps) {
  const theme = useThemeStore((s) => s.theme);
  const src = theme === 'dark' ? DARK_SRC : LIGHT_SRC;

  return (
    <img
      src={src}
      alt="GuestMark"
      className={className}
      style={{ display: 'block' }}
      decoding="async"
    />
  );
}
