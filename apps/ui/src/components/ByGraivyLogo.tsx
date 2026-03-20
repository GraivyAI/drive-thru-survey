import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';
import byGraivyLight from '@/assets/branding/by-graivy-logo-RGB-light.svg?raw';
import byGraivyDark from '@/assets/branding/by-graivy-logo-RGB-dark.svg?raw';

interface ByGraivyLogoProps {
  className?: string;
}

function stripXmlProlog(s: string) {
  return s.replace(/<\?xml[\s\S]*?\?>\s*/i, '').trim();
}

export function ByGraivyLogo({ className = 'h-5 w-auto max-w-full' }: ByGraivyLogoProps) {
  const theme = useThemeStore((s) => s.theme);
  const svg = stripXmlProlog(theme === 'dark' ? byGraivyDark : byGraivyLight);

  return (
    <div
      className={cn(
        'inline-flex max-w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-h-full [&>svg]:[shape-rendering:geometricPrecision]',
        className,
      )}
      style={{ lineHeight: 0 }}
      role="img"
      aria-label="By Graivy"
      // Static SVG from the repo; not user-controlled HTML.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
