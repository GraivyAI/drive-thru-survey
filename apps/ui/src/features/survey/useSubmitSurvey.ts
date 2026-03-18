import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SubmitParams {
  orderId: string;
  satisfactionRating: number;
  easyToUnderstand: string;
  wouldUseAgain: string;
}

export function useSubmitSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitParams) => {
      const { data } = await api.post('/survey', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
