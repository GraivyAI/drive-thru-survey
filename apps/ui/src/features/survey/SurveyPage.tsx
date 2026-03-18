import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useOrderDetail } from './useOrderDetail';
import { useSubmitSurvey } from './useSubmitSurvey';
import { useSkipSurvey } from './useSkipSurvey';
import { useUnskipSurvey } from './useUnskipSurvey';
import { useExistingResponse } from './useExistingResponse';
import { OrderDetail } from './OrderDetail';
import { SatisfactionRating } from './SatisfactionRating';
import { OptionGroup } from './OptionGroup';
import { formatItemPreview, formatTime, formatCurrency } from '@/features/orders/order-utils';

const Q2_OPTIONS = [
  { value: 'YES_COMPLETELY', label: 'Yes, completely' },
  { value: 'MOSTLY', label: 'Mostly' },
  { value: 'NOT_REALLY', label: 'Not really' },
];

const Q3_OPTIONS = [
  { value: 'YES', label: 'Yes' },
  { value: 'MAYBE', label: 'Maybe' },
  { value: 'NO', label: 'No' },
];

export function SurveyPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading: orderLoading } = useOrderDetail(orderId!);
  const { data: existing, isLoading: existingLoading } = useExistingResponse(orderId!);
  const submitMutation = useSubmitSurvey();
  const skipMutation = useSkipSurvey();
  const unskipMutation = useUnskipSurvey();

  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [easyToUnderstand, setEasyToUnderstand] = useState<string | null>(null);
  const [wouldUseAgain, setWouldUseAgain] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  useEffect(() => {
    if (existing && !prefilled) {
      if (existing.status === 'COMPLETED') {
        setSatisfaction(existing.satisfaction_rating);
        setEasyToUnderstand(existing.easy_to_understand);
        setWouldUseAgain(existing.would_use_again);
      }
      setPrefilled(true);
    }
  }, [existing, prefilled]);

  const isEditing = !!existing;
  const isSkipped = existing?.status === 'SKIPPED';
  const canSubmit = satisfaction !== null && easyToUnderstand !== null && wouldUseAgain !== null;
  
  const isDirty = satisfaction !== null || easyToUnderstand !== null || wouldUseAgain !== null;

  const handleSubmit = async () => {
    if (!canSubmit || !orderId) return;

    try {
      await submitMutation.mutateAsync({
        orderId,
        satisfactionRating: satisfaction,
        easyToUnderstand,
        wouldUseAgain,
      });
      toast.success(isEditing ? 'Survey updated' : 'Survey saved');
      navigate('/orders', { replace: true });
    } catch {
      toast.error("Couldn't save — check your connection and try again");
    }
  };

  const handleSkip = async () => {
    if (!orderId) return;

    if (isDirty) {
      setShowSkipConfirm(true);
      return;
    }

    try {
      await skipMutation.mutateAsync(orderId);
      toast.success('Order skipped');
      navigate('/orders', { replace: true });
    } catch {
      toast.error("Couldn't skip — try again");
    }
  };

  const handleUnskip = async () => {
    if (!orderId) return;

    try {
      await unskipMutation.mutateAsync(orderId);
      toast.success('Order un-skipped');
      navigate('/orders', { replace: true });
    } catch {
      toast.error("Couldn't un-skip — try again");
    }
  };

  const confirmSkip = async () => {
    if (!orderId) return;
    
    try {
      await skipMutation.mutateAsync(orderId);
      toast.success('Order skipped');
      navigate('/orders', { replace: true });
    } catch {
      toast.error("Couldn't skip — try again");
    }
  };

  const isLoading = orderLoading || existingLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--text-faint)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <p className="text-txt-secondary text-sm">Order not found</p>
      </div>
    );
  }

  const orderNumber = order.orderData?.orderNumber || order.id?.slice(0, 8);

  return (
    <div className="min-h-screen bg-surface-page">
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-line px-5 py-3 flex items-center gap-3"
        style={{ backgroundColor: 'var(--bg-header)' }}>
        <button onClick={() => navigate('/orders')} className="p-1 text-txt-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-semibold text-txt-primary tracking-tight">{orderNumber}</span>
        {isEditing && (
          <span className={`text-[10px] font-semibold uppercase tracking-wider ml-auto ${
            isSkipped ? 'text-amber-500' : 'text-txt-muted'
          }`}>
            {isSkipped ? 'Skipped' : 'Editing'}
          </span>
        )}
      </header>

      <main className="px-5 py-4 space-y-6 pb-8">
        <div className="bg-surface-card rounded-2xl border border-line p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-txt-muted">{formatTime(order.createdAt)}</span>
            <span className="font-semibold text-txt-primary tabular-nums">{formatCurrency(order.total)}</span>
          </div>
          <p className="text-[13px] text-txt-secondary mb-2">{formatItemPreview(order.orderData)}</p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-txt-muted font-medium tracking-wide"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Hide details' : 'View full order'}
          </button>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-line">
              <OrderDetail
                orderData={order.orderData}
                subtotal={order.subtotal}
                tax={order.tax}
                tip={order.tip}
                total={order.total}
              />
            </div>
          )}
        </div>

        {!isSkipped && (
          <>
            <div>
              <h3 className="font-semibold text-txt-primary text-[15px] mb-3 tracking-tight">
                How satisfied were you with your ordering experience today?
              </h3>
              <SatisfactionRating value={satisfaction} onChange={setSatisfaction} />
              <div className="flex justify-between mt-1.5 text-[10px] text-txt-muted px-1 tracking-wide uppercase">
                <span>Poor</span><span>Excellent</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-txt-primary text-[15px] mb-3 tracking-tight">
                Was the order taker easy to understand?
              </h3>
              <OptionGroup options={Q2_OPTIONS} value={easyToUnderstand} onChange={setEasyToUnderstand} />
            </div>

            <div>
              <h3 className="font-semibold text-txt-primary text-[15px] mb-3 tracking-tight">
                Would you use this experience again?
              </h3>
              <OptionGroup options={Q3_OPTIONS} value={wouldUseAgain} onChange={setWouldUseAgain} />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitMutation.isPending}
              className="w-full py-3.5 font-medium rounded-2xl text-[15px] tracking-tight
                         disabled:opacity-30 disabled:cursor-not-allowed
                         hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ backgroundColor: 'var(--graivy-btn-bg)', color: 'var(--graivy-btn-text)' }}
            >
              {submitMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                  Saving
                </span>
              ) : isEditing ? (
                'Update Survey'
              ) : (
                'Submit Survey'
              )}
            </button>
          </>
        )}

        <button
          onClick={isSkipped ? handleUnskip : handleSkip}
          disabled={skipMutation.isPending || unskipMutation.isPending}
          className="w-full py-3 font-medium rounded-2xl text-[13px] tracking-tight border border-line text-txt-muted
                     hover:text-txt-secondary hover:border-txt-muted transition-all active:scale-[0.98]"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          {(skipMutation.isPending || unskipMutation.isPending) ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-current/20 border-t-current rounded-full animate-spin" />
              {isSkipped ? 'Un-skipping' : 'Skipping'}
            </span>
          ) : isSkipped ? (
            'Un-skip Order'
          ) : (
            'Skip Survey'
          )}
        </button>
      </main>

      {showSkipConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          onClick={() => setShowSkipConfirm(false)}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[300px] rounded-2xl border border-line p-6 text-center shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <p className="font-semibold text-txt-primary text-[15px] tracking-tight mb-1">
              Skip this order?
            </p>
            <p className="text-[13px] text-txt-secondary mb-6">
              You have answers entered. Skip anyway and lose your progress?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-line text-txt-secondary"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSkip}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-amber-600 border border-amber-200"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}