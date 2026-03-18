import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string | null;
  onChange: (v: string) => void;
}

export function OptionGroup({ options, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'w-full py-3.5 px-4 rounded-xl text-left font-medium transition-all border-2',
              selected
                ? 'border-transparent text-white'
                : 'bg-surface-card text-txt-secondary border-line active:scale-[0.98]',
            )}
            style={selected ? {
              backgroundColor: '#0DBE00',
              borderColor: '#0DBE00',
              color: '#ffffff',
            } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
