import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
import { BottomNav } from '@/components/BottomNav';

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
  const queryClient = useQueryClient();

  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [easyToUnderstand, setEasyToUnderstand] = useState<string | null>(null);
  const [wouldUseAgain, setWouldUseAgain] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const q2SectionRef = useRef<HTMLDivElement>(null);
  const q3SectionRef = useRef<HTMLDivElement>(null);
  const submitSectionRef = useRef<HTMLDivElement>(null);

  const scrollSectionIntoView = (el: HTMLElement | null) => {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSatisfactionChange = (n: number) => {
    setSatisfaction(n);
    requestAnimationFrame(() => scrollSectionIntoView(q2SectionRef.current));
  };

  const handleEasyToUnderstandChange = (v: string) => {
    setEasyToUnderstand(v);
    requestAnimationFrame(() => scrollSectionIntoView(q3SectionRef.current));
  };

  const handleWouldUseAgainChange = (v: string) => {
    setWouldUseAgain(v);
    requestAnimationFrame(() => scrollSectionIntoView(submitSectionRef.current));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [orderId]);

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

  const refreshAndNavigate = async (message: string) => {
    toast.success(message);
    await queryClient.refetchQueries({ queryKey: ['orders'], type: 'all' });
    navigate('/orders', { replace: true });
  };

  const handleSubmit = async () => {
    if (!canSubmit || !orderId) return;

    try {
      await submitMutation.mutateAsync({
        orderId,
        satisfactionRating: satisfaction,
        easyToUnderstand,
        wouldUseAgain,
      });
      await refreshAndNavigate(isEditing ? 'Survey updated' : 'Survey saved');
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
      await refreshAndNavigate('Order skipped');
    } catch {
      toast.error("Couldn't skip — try again");
    }
  };

  const handleUnskip = async () => {
    if (!orderId) return;

    try {
      await unskipMutation.mutateAsync(orderId);
      await refreshAndNavigate('Order un-skipped');
    } catch {
      toast.error("Couldn't un-skip — try again");
    }
  };

  const confirmSkip = async () => {
    if (!orderId) return;
    
    try {
      await skipMutation.mutateAsync(orderId);
      await refreshAndNavigate('Order skipped');
    } catch {
      toast.error("Couldn't skip — try again");
    }
  };

  const isLoading = orderLoading || existingLoading;

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface-page pb-20">
        <div className="flex min-h-[50dvh] items-center justify-center">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2"
            style={{ borderColor: 'var(--text-faint)', borderTopColor: 'var(--text-primary)' }}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-dvh bg-surface-page pb-20">
        <div className="flex min-h-[50dvh] items-center justify-center px-6">
          <p className="text-center text-sm text-txt-secondary">Order not found</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const orderNumber = order.orderData?.orderNumber || order.id?.slice(0, 8);

  return (
    <div className="min-h-dvh bg-surface-page pb-20">
      <header
        className="sticky top-0 z-40 border-b border-line backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]"
        style={{ backgroundColor: 'var(--bg-header)' }}
      >
        <div className="flex items-center gap-3 px-5 py-3">
          <button type="button" onClick={() => navigate('/orders')} className="p-1 text-txt-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-txt-primary tracking-tight">{orderNumber}</span>
          {isEditing && (
            <span
              className={`ml-auto text-[10px] font-semibold uppercase tracking-wider ${
                isSkipped ? 'text-amber-500' : 'text-txt-muted'
              }`}
            >
              {isSkipped ? 'Skipped' : 'Editing'}
            </span>
          )}
        </div>
      </header>

      <main className="space-y-6 px-5 py-4 pb-8">
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
              <SatisfactionRating value={satisfaction} onChange={handleSatisfactionChange} />
              <div className="flex justify-between mt-1.5 text-[10px] text-txt-muted px-1 tracking-wide uppercase">
                <span>Poor</span><span>Excellent</span>
              </div>
            </div>

            <div ref={q2SectionRef} className="scroll-mt-28">
              <h3 className="font-semibold text-txt-primary text-[15px] mb-3 tracking-tight">
                Was the order taker easy to understand?
              </h3>
              <OptionGroup
                options={Q2_OPTIONS}
                value={easyToUnderstand}
                onChange={handleEasyToUnderstandChange}
              />
            </div>

            <div ref={q3SectionRef} className="scroll-mt-28">
              <h3 className="font-semibold text-txt-primary text-[15px] mb-3 tracking-tight">
                Would you use this experience again?
              </h3>
              <OptionGroup
                options={Q3_OPTIONS}
                value={wouldUseAgain}
                onChange={handleWouldUseAgainChange}
              />
            </div>

            <div ref={submitSectionRef} className="scroll-mt-28">
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
            </div>
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

      <BottomNav />

      {showSkipConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6 animate-in fade-in duration-150"
          onClick={() => setShowSkipConfirm(false)}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[300px] rounded-2xl border border-line p-6 text-center shadow-2xl
                       animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 ease-out"
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