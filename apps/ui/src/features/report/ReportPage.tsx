import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Star, Minus, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { useReport } from './useReport';
import { DistributionBar } from './DistributionBar';
import { formatTime, formatCurrency } from '@/features/orders/order-utils';

const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 days', days: 7 },
] as const;

function toDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function renderStars(rating: number | null) {
  if (rating === null) return <Minus className="h-3.5 w-3.5 text-txt-muted" />;
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-txt-faint'}`}
    />
  ));
}

const ETU_LABELS: Record<string, string> = {
  YES_COMPLETELY: 'Yes completely',
  MOSTLY: 'Mostly',
  NOT_REALLY: 'Not really',
};

const WUA_LABELS: Record<string, string> = {
  YES: 'Yes',
  MAYBE: 'Maybe',
  NO: 'No',
};

const SCROLL_KEY = 'report-scroll-y';

export function ReportPage() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [preset, setPreset] = useState(0);
  const restoredRef = useRef(false);

  // Restore scroll position when returning from response detail
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      window.scrollTo({ top: parseInt(saved), behavior: 'instant' });
    }
  }, []);

  // Save scroll position when leaving for a response detail
  const navigateToDetail = (orderId: string) => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    navigate(`/report/response/${orderId}`);
  };

  const today = toDateStr(0);
  const dateFrom = preset === 0 ? today : preset === 1 ? toDateStr(1) : toDateStr(7);
  const dateTo = preset === 1 ? toDateStr(1) : today;

  const { data, isLoading } = useReport(dateFrom, dateTo);
  const summary = data?.summary;
  const responses = data?.responses || [];

  const handleExport = () => {
    const url = `/api/survey/export?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const blobUrl = URL.createObjectURL(xhr.response as Blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `survey-export-${dateFrom}-to-${dateTo}.csv`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    };
    xhr.send();
  };

  return (
    <div className="min-h-screen bg-surface-page pb-20">
      <AppHeader
        subtitle="Report"
        right={
          <button
            onClick={handleExport}
            className="p-2 rounded-lg text-txt-muted hover:text-txt-primary transition-colors"
            title="Export CSV"
          >
            <Download className="h-4 w-4" />
          </button>
        }
      />

      <main className="px-4 py-4 space-y-4">
        <div className="flex gap-2">
          {DATE_PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPreset(i)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                preset !== i ? 'bg-surface-card text-txt-secondary border border-line' : ''
              }`}
              style={preset === i ? { backgroundColor: 'var(--graivy-btn-bg)', color: 'var(--graivy-btn-text)' } : undefined}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface-card rounded-xl border border-line animate-pulse" />
            ))}
          </div>
        )}

        {summary && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-card rounded-xl border border-line p-4">
                <p className="text-xs text-txt-muted font-medium mb-1">Responses</p>
                <p className="text-2xl font-bold text-txt-primary">
                  {summary.totalResponses}
                  <span className="text-sm font-normal text-txt-muted"> / {summary.totalOrders}</span>
                </p>
                <p className="text-sm text-graivy-green font-medium">{Math.round(summary.responseRate * 100)}%</p>
              </div>
              <div className="bg-surface-card rounded-xl border border-line p-4">
                <p className="text-xs text-txt-muted font-medium mb-1">Completed</p>
                <p className="text-2xl font-bold text-txt-primary">{summary.totalCompleted}</p>
                <p className="text-sm text-emerald-500 font-medium">{Math.round(summary.completionRate * 100)}%</p>
              </div>
              <div className="bg-surface-card rounded-xl border border-line p-4">
                <p className="text-xs text-txt-muted font-medium mb-1">Skipped</p>
                <p className="text-2xl font-bold text-txt-primary">{summary.totalSkipped}</p>
                <p className="text-sm text-amber-500 font-medium">
                  {summary.totalOrders > 0 ? Math.round((summary.totalSkipped / summary.totalOrders) * 100) : 0}%
                </p>
              </div>
            </div>

            {summary.totalCompleted > 0 && (
              <>
                <div className="bg-surface-card rounded-xl border border-line p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-txt-primary">Satisfaction Rating</p>
                    <div className="text-right">
                      <p className="font-bold text-txt-primary">
                        {summary.avgSatisfaction?.toFixed(1) || '—'} / 5 avg
                      </p>
                      <div className="flex gap-0.5 mt-0.5 justify-end">
                        {renderStars(Math.round(summary.avgSatisfaction || 0))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {([5, 4, 3, 2, 1] as const).map((rating) => {
                      const count = summary.satisfactionDistribution[rating] ?? 0;
                      const total = summary.totalCompleted;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const color = rating >= 4 ? 'bg-emerald-500' : rating === 3 ? 'bg-amber-400' : 'bg-red-400';
                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <div className="flex gap-0.5 w-20 shrink-0">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-txt-faint'}`} />
                            ))}
                          </div>
                          <div className="flex-1 h-4 bg-surface-input rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-medium text-txt-secondary w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-surface-card rounded-xl border border-line p-4 space-y-5">
                  <DistributionBar
                    title="Easy to understand?"
                    items={[
                      { label: 'Yes completely', value: summary.easyToUnderstand.YES_COMPLETELY, color: 'bg-emerald-500' },
                      { label: 'Mostly', value: summary.easyToUnderstand.MOSTLY, color: 'bg-amber-400' },
                      { label: 'Not really', value: summary.easyToUnderstand.NOT_REALLY, color: 'bg-red-400' },
                    ]}
                  />
                  <DistributionBar
                    title="Would use again?"
                    items={[
                      { label: 'Yes', value: summary.wouldUseAgain.YES, color: 'bg-emerald-500' },
                      { label: 'Maybe', value: summary.wouldUseAgain.MAYBE, color: 'bg-amber-400' },
                      { label: 'No', value: summary.wouldUseAgain.NO, color: 'bg-red-400' },
                    ]}
                  />
                </div>
              </>
            )}
          </>
        )}

        {responses.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-txt-secondary mb-2">
              Individual Responses ({responses.length})
            </h3>
            <div className="space-y-2">
              {responses.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigateToDetail(r.orderId)}
                  className="w-full bg-surface-card rounded-xl border border-line p-3 text-left
                             hover:border-txt-muted active:scale-[0.99] transition-all"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-txt-primary text-sm">
                      {r.orderNumber || '—'} &middot; {formatTime(r.orderTime)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-txt-secondary">{formatCurrency(r.orderTotal)}</span>
                      {r.status === 'SKIPPED' && (
                        <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">Skipped</span>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 text-txt-faint" />
                    </div>
                  </div>
                  {r.status === 'COMPLETED' && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-0.5">{renderStars(r.satisfactionRating)}</span>
                      <span className="text-txt-secondary">{ETU_LABELS[r.easyToUnderstand || ''] || r.easyToUnderstand}</span>
                      <span className="text-txt-secondary">{WUA_LABELS[r.wouldUseAgain || ''] || r.wouldUseAgain}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isLoading && responses.length === 0 && (
          <div className="text-center py-12 text-txt-muted">
            No survey responses for this period
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}