import { formatCurrency } from '@/features/orders/order-utils';

interface OrderDetailProps {
  orderData: Record<string, unknown>;
  subtotal: string;
  tax: string;
  tip: string;
  total: string;
}

interface ItemMod {
  name?: string;
  total_price?: number;
  price?: number;
  options?: Array<{ name?: string; price?: number; totalPrice?: number }>;
}

interface OrderItem {
  name?: string;
  itemName?: string;
  quantity?: number;
  total_price?: number;
  totalPrice?: number;
  price?: number;
  item_type?: string;
  child_items?: Array<{
    name?: string;
    price_delta?: number;
    modifiers?: ItemMod[];
  }>;
  modifiers?: ItemMod[];
  specialInstructions?: string;
}

export function OrderDetail({ orderData, subtotal, tax, tip, total }: OrderDetailProps) {
  const items = (orderData?.items as OrderItem[]) || [];
  const version = orderData?.version as string | undefined;
  const payment = orderData?.paymentDetails as Record<string, string> | undefined;

  return (
    <div className="space-y-3 text-sm text-txt-primary">
      {items.map((item, i) => (
        <div key={i} className="border-b border-line pb-2 last:border-0">
          <div className="flex justify-between font-medium text-txt-primary">
            <span>
              {(item.quantity || 1) > 1 ? `${item.quantity}x ` : ''}
              {item.name || item.itemName || 'Item'}
            </span>
            <span>{formatCurrency(item.total_price ?? item.totalPrice ?? item.price ?? 0)}</span>
          </div>

          {version === 'v1' && item.item_type === 'combo' && item.child_items?.map((child, ci) => (
            <div key={ci} className="ml-4 text-txt-secondary">
              <span>{child.name}</span>
              {child.modifiers?.map((mod, mi) => (
                <div key={mi} className="ml-3 text-txt-muted text-xs">+ {mod.name}</div>
              ))}
            </div>
          ))}

          {item.modifiers?.map((mod, mi) => {
            if ((mod as ItemMod).options) {
              return (mod as ItemMod).options!.map((opt, oi) => (
                <div key={`${mi}-${oi}`} className="ml-4 text-txt-muted text-xs">+ {opt.name}</div>
              ));
            }
            return (
              <div key={mi} className="ml-4 text-txt-muted text-xs">+ {mod.name}</div>
            );
          })}

          {item.specialInstructions && (
            <div className="ml-4 text-xs text-amber-600 italic">"{item.specialInstructions}"</div>
          )}
        </div>
      ))}

      <div className="border-t border-line pt-2 space-y-1">
        <div className="flex justify-between text-txt-secondary">
          <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-txt-secondary">
          <span>Tax</span><span>{formatCurrency(tax)}</span>
        </div>
        {parseFloat(tip) > 0 && (
          <div className="flex justify-between text-txt-secondary">
            <span>Tip</span><span>{formatCurrency(tip)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-txt-primary">
          <span>Total</span><span>{formatCurrency(total)}</span>
        </div>
      </div>

      {payment?.cardBrand && (
        <div className="text-xs text-txt-muted">
          {payment.cardBrand} ****{payment.cardLast4}
          {payment.entryMethod && ` · ${payment.entryMethod}`}
        </div>
      )}
    </div>
  );
}
