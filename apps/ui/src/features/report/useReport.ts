import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ReportSummary {
  totalOrders: number;
  totalResponses: number;
  totalCompleted: number;
  totalSkipped: number;
  responseRate: number;
  completionRate: number;
  avgSatisfaction: number;
  satisfactionDistribution: Record<string, number>;
  easyToUnderstand: Record<string, number>;
  wouldUseAgain: Record<string, number>;
}

export interface ReportResponse {
  id: string;
  orderId: string;
  orderNumber: string | null;
  orderTotal: string;
  orderTime: string;
  satisfactionRating: number | null;
  easyToUnderstand: string | null;
  wouldUseAgain: string | null;
  status: string;
  createdAt: string;
}

export interface ReportData {
  summary: ReportSummary;
  responses: ReportResponse[];
}

export function useReport(dateFrom: string, dateTo: string) {
  return useQuery<ReportData>({
    queryKey: ['report', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get('/survey/report', {
        params: { dateFrom, dateTo },
      });
      return data;
    },
  });
}
