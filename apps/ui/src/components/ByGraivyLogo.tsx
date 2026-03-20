import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';
import byGraivyLight from '@/assets/branding/by-graivy-logo-RGB-light.svg';
import byGraivyDark from '@/assets/branding/by-graivy-logo-RGB-dark.svg';

interface ByGraivyLogoProps {
  className?: string;
}

export function ByGraivyLogo({ className = 'h-5 w-auto max-w-full' }: ByGraivyLogoProps) {
  const theme = useThemeStore((s) => s.theme);
  const src = theme === 'dark' ? byGraivyDark : byGraivyLight;

  return (
    <img
      src={src}
      alt="By Graivy"
      className={cn('block', className)}
      role="img"
      decoding="async"
    />
  );
}
