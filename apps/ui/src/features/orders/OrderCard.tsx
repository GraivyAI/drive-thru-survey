import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatItemPreview, formatTime, formatCurrency } from './order-utils';
import type { OrderRow } from './useOrders';

interface OrderCardProps {
  order: OrderRow;
  isNew?: boolean;
}

export function OrderCard({ order, isNew = false }: OrderCardProps) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const orderNumber = order.order_number || order.id.slice(0, 8);

  const handleTap = () => {
    if (order.surveyed) {
      setShowConfirm(true);
    } else {
      navigate(`/orders/${order.id}/survey`);
    }
  };

  return (
    <>
      <button
        onClick={handleTap}
        className={cn(
          'w-full text-left px-5 py-4 rounded-2xl border border-line transition-all active:scale-[0.99]',
          order.surveyed ? 'bg-surface-card opacity-50' : 'bg-surface-card',
          isNew && 'animate-[slideInFromTop_0.6s_ease-out]',
        )}
      >
        <div className="flex items-baseline justify-between mb-0.5">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-txt-primary tracking-tight">{orderNumber}</span>
            <span className="text-xs text-txt-muted">{formatTime(order.createdAt)}</span>
            {isNew && (
              <span className="inline-block w-1.5 h-1.5 bg-graivy-green rounded-full animate-pulse" />
            )}
          </div>
          <span className="font-semibold text-txt-primary tabular-nums">{formatCurrency(order.total)}</span>
        </div>

        <p className="text-[13px] text-txt-secondary mb-2.5 truncate">
          {formatItemPreview(order.orderData)}
        </p>

      {order.surveyed && (
        <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
          order.surveyStatus === 'SKIPPED' ? 'text-amber-500' : 'text-emerald-500'
        }`}>
          <CheckCircle2 className="h-3 w-3" />
          {order.surveyStatus === 'SKIPPED' ? 'Skipped' : 'Done'}
        </span>
      )}
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          onClick={() => setShowConfirm(false)}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[300px] rounded-2xl border border-line p-6 text-center shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <p className="font-semibold text-txt-primary text-[15px] tracking-tight mb-1">
              Edit response?
            </p>
            <p className="text-[13px] text-txt-secondary mb-6">
              This order already has a survey response. Do you want to edit it?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-line text-txt-secondary"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => navigate(`/orders/${order.id}/survey`)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                style={{ backgroundColor: 'var(--graivy-btn-bg)', color: 'var(--graivy-btn-text)' }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}