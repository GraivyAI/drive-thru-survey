import { cn } from '@/lib/utils';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
}

export function SatisfactionRating({ value, onChange }: Props) {
  return (
    <div className="flex justify-between gap-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'flex-1 h-14 rounded-xl text-lg font-bold transition-all border-2',
              selected
                ? 'scale-105 border-transparent text-white'
                : 'bg-surface-card text-txt-secondary border-line active:scale-95',
            )}
            style={selected ? {
              backgroundColor: '#0DBE00',
              borderColor: '#0DBE00',
              color: '#ffffff',
            } : undefined}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
