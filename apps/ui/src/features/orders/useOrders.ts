import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import { api } from '@/lib/api';

export interface OrderRow {
  id: string;
  order_number: string | null;
  status: string;
  posStatus: string;
  subtotal: string;
  tax: string;
  tip: string;
  total: string;
  source: string;
  createdAt: string;
  orderData: Record<string, unknown>;
  surveyed: boolean;
  surveyStatus: string | null;
}

export function useOrders(date?: string) {
  const prevOrdersRef = useRef<OrderRow[]>([]);
  
  const query = useQuery<OrderRow[]>({
    queryKey: ['orders', date],
    queryFn: async () => {
      const params = date ? { date } : {};
      const { data } = await api.get('/orders', { params });
      return data;
    },
    refetchInterval: 30_000,
  });

  const newOrderIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (query.data && prevOrdersRef.current.length > 0) {
      const prevIds = new Set(prevOrdersRef.current.map(o => o.id));
      const currentNew = query.data.filter(o => !prevIds.has(o.id));
      
      if (currentNew.length > 0) {
        currentNew.forEach(o => newOrderIds.current.add(o.id));
        setTimeout(() => {
          currentNew.forEach(o => newOrderIds.current.delete(o.id));
        }, 2000);
      }
    }
    if (query.data) {
      prevOrdersRef.current = query.data;
    }
  }, [query.data]);

  return {
    ...query,
    newOrderIds: newOrderIds.current,
  };
}
