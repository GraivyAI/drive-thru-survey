export function extractItemNames(orderData: Record<string, unknown>): string[] {
  const items = orderData?.items as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const qty = (item.quantity as number) || 1;
    const name = (item.name as string) || (item.itemName as string) || 'Item';
    return qty > 1 ? `${qty}x ${name}` : name;
  });
}

export function formatItemPreview(orderData: Record<string, unknown>, max = 3): string {
  const names = extractItemNames(orderData);
  if (names.length === 0) return 'No items';
  const shown = names.slice(0, max);
  const remaining = names.length - max;
  const preview = shown.join(', ');
  return remaining > 0 ? `${preview}, +${remaining} more` : preview;
}

export function formatTime(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `$${num.toFixed(2)}`;
}

export function posStatusLabel(status: string): string {
  switch (status) {
    case 'SUBMITTED': return 'Submitted';
    case 'REJECTED': return 'Rejected';
    case 'PENDING_RETRY': return 'Pending Retry';
    default: return status;
  }
}

export function posStatusColor(status: string): string {
  switch (status) {
    case 'SUBMITTED': return 'bg-emerald-100 text-emerald-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    case 'PENDING_RETRY': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}
