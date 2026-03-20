import { useEffect } from 'react';
import { RefreshCw, Inbox } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { useAuthStore } from '@/stores/authStore';
import { useOrders } from './useOrders';
import { OrderCard } from './OrderCard';

export function OrdersPage() {
  const locationName = useAuthStore((s) => s.location?.name);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const { data: orders, isLoading, isError, refetch, isFetching, dataUpdatedAt, newOrderIds } = useOrders();

  const surveyedCount = orders?.filter((o) => o.surveyed).length ?? 0;
  const totalCount = orders?.length ?? 0;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-surface-page pb-20 overflow-x-hidden">
      <AppHeader
        right={
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-2 rounded-lg text-txt-muted hover:text-txt-primary transition-colors">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        }
      />
      <main className="px-4 py-3 space-y-2">
        <div className="flex flex-col gap-1 pb-2 -mt-1 border-b border-line mb-1">
          {locationName ? (
            <p className="text-[13px] font-semibold text-txt-primary tracking-tight truncate">
              {locationName}
            </p>
          ) : null}
          <p className="text-[11px] text-txt-muted tracking-wide">
            {today}
            {isLoading && <span className="text-txt-faint"> · Loading…</span>}
            {!isLoading && !isError && (
              <>
                <span className="text-txt-faint mx-1.5">·</span>
                <span className="text-txt-secondary font-medium">
                  {surveyedCount} of {totalCount} surveyed
                </span>
              </>
            )}
          </p>
          {!isLoading && !isError && dataUpdatedAt ? (
            <p className="text-[10px] text-txt-muted tabular-nums tracking-wide">
              Last updated{' '}
              {new Date(dataUpdatedAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </p>
          ) : null}
        </div>
        {isLoading && [1, 2, 3].map((i) => (
          <div key={i} className="h-[88px] bg-surface-card rounded-2xl border border-line animate-pulse" />
        ))}
        {isError && (
          <div className="text-center py-16">
            <p className="text-txt-secondary text-sm mb-4">Couldn't load orders</p>
            <button onClick={() => refetch()}
              className="px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--graivy-btn-bg)', color: 'var(--graivy-btn-text)' }}>
              Retry
            </button>
          </div>
        )}
        {!isLoading && !isError && orders?.length === 0 && (
          <div className="text-center py-20">
            <Inbox className="h-10 w-10 text-txt-faint mx-auto mb-4" />
            <p className="text-txt-secondary text-sm font-medium">No orders yet today</p>
            <p className="text-xs text-txt-muted mt-1">Orders appear here automatically</p>
          </div>
        )}
        {orders?.map((order) => (
          <OrderCard key={order.id} order={order} isNew={newOrderIds.has(order.id)} />
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
