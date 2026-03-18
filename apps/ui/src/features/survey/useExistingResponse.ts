import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ExistingResponse {
  id: string;
  order_id: string;
  satisfaction_rating: number | null;
  easy_to_understand: string | null;
  would_use_again: string | null;
  status: string;
  created_at: string;
}

export function useExistingResponse(orderId: string) {
  return useQuery<ExistingResponse | null>({
    queryKey: ['survey-response', orderId],
    queryFn: async () => {
      const { data } = await api.get(`/survey/${orderId}`);
      return data || null;
    },
    enabled: !!orderId,
  });
}
