import { useEffect } from 'react';
import { RefreshCw, Inbox } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { useOrders } from './useOrders';
import { OrderCard } from './OrderCard';

export function OrdersPage() {
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
        subtitle={`${today} \u00B7 ${surveyedCount} of ${totalCount} surveyed`}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
        right={
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-2 rounded-lg text-txt-muted hover:text-txt-primary transition-colors">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        }
      />
      <main className="px-4 py-3 space-y-2">
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
