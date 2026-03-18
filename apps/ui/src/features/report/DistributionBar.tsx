import { cn } from '@/lib/utils';

interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface Props {
  title: string;
  items: BarItem[];
}

export function DistributionBar({ title, items }: Props) {
  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <div>
      <h4 className="text-sm font-medium text-txt-secondary mb-2">{title}</h4>
      <div className="space-y-1.5">
        {items.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs text-txt-secondary w-28 truncate">{item.label}</span>
              <div className="flex-1 h-5 bg-surface-input rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', item.color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-txt-secondary w-10 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
