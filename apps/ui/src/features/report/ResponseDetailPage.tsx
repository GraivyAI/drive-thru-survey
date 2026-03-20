import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Minus } from 'lucide-react';
import { useOrderDetail } from '@/features/survey/useOrderDetail';
import { useExistingResponse } from '@/features/survey/useExistingResponse';
import { OrderDetail } from '@/features/survey/OrderDetail';
import { formatTime, formatCurrency } from '@/features/orders/order-utils';

const ETU_LABELS: Record<string, string> = {
  YES_COMPLETELY: 'Yes, completely',
  MOSTLY: 'Mostly',
  NOT_REALLY: 'Not really',
};

const WUA_LABELS: Record<string, string> = {
  YES: 'Yes',
  MAYBE: 'Maybe',
  NO: 'No',
};

const ETU_COLOR: Record<string, string> = {
  YES_COMPLETELY: 'text-emerald-500 bg-emerald-500/10',
  MOSTLY: 'text-amber-500 bg-amber-500/10',
  NOT_REALLY: 'text-red-500 bg-red-500/10',
};

const WUA_COLOR: Record<string, string> = {
  YES: 'text-emerald-500 bg-emerald-500/10',
  MAYBE: 'text-amber-500 bg-amber-500/10',
  NO: 'text-red-500 bg-red-500/10',
};

export function ResponseDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading: orderLoading } = useOrderDetail(orderId!);
  const { data: response, isLoading: responseLoading } = useExistingResponse(orderId!);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isLoading = orderLoading || responseLoading;

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface-page flex items-center justify-center">
        <div className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--text-faint)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  if (!order || !response) {
    return (
      <div className="min-h-dvh bg-surface-page flex items-center justify-center">
        <p className="text-txt-secondary text-sm">Response not found</p>
      </div>
    );
  }

  const orderNumber = order.orderData?.orderNumber || order.id?.slice(0, 8);
  const isSkipped = response.status === 'SKIPPED';

  return (
    <div className="min-h-dvh bg-surface-page pb-10">
      <header
        className="sticky top-0 z-40 border-b border-line backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]"
        style={{ backgroundColor: 'var(--bg-header)' }}
      >
        <div className="flex items-center gap-3 px-5 py-3">
          <button type="button" onClick={() => navigate('/report')} className="p-1 text-txt-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-txt-primary tracking-tight">{orderNumber}</span>
          <span
            className={`ml-auto text-[10px] font-semibold uppercase tracking-wider ${
              isSkipped ? 'text-amber-500' : 'text-emerald-500'
            }`}
          >
            {isSkipped ? 'Skipped' : 'Completed'}
          </span>
        </div>
      </header>

      <main className="px-5 py-4 space-y-4">
        {/* Order summary */}
        <div className="bg-surface-card rounded-2xl border border-line p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-txt-muted">{formatTime(order.createdAt)}</span>
            <span className="font-semibold text-txt-primary tabular-nums">{formatCurrency(order.total)}</span>
          </div>
          <OrderDetail
            orderData={order.orderData}
            subtotal={order.subtotal}
            tax={order.tax}
            tip={order.tip}
            total={order.total}
          />
        </div>

        {/* Survey answers */}
        <div className="bg-surface-card rounded-2xl border border-line p-4">
          <p className="text-xs font-semibold text-txt-muted uppercase tracking-wider mb-4">Survey Response</p>

          {isSkipped ? (
            <p className="text-sm text-amber-500 font-medium">Survey was skipped for this order</p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-txt-muted mb-2">How satisfied with the ordering experience?</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) =>
                      response.satisfaction_rating !== null ? (
                        <Star key={i} className={`h-5 w-5 ${
                          i < (response.satisfaction_rating ?? 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-txt-faint'
                        }`} />
                      ) : (
                        <Minus key={i} className="h-4 w-4 text-txt-muted" />
                      )
                    )}
                  </div>
                  {response.satisfaction_rating !== null && (
                    <span className="text-sm font-semibold text-txt-primary">
                      {response.satisfaction_rating} / 5
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-txt-muted mb-2">Was the order taker easy to understand?</p>
                <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${
                  ETU_COLOR[response.easy_to_understand ?? ''] ?? 'text-txt-secondary bg-surface-input'
                }`}>
                  {ETU_LABELS[response.easy_to_understand ?? ''] ?? response.easy_to_understand ?? '—'}
                </span>
              </div>

              <div>
                <p className="text-xs text-txt-muted mb-2">Would you use this experience again?</p>
                <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${
                  WUA_COLOR[response.would_use_again ?? ''] ?? 'text-txt-secondary bg-surface-input'
                }`}>
                  {WUA_LABELS[response.would_use_again ?? ''] ?? response.would_use_again ?? '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
