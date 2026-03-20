import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { OrdersPage } from '@/features/orders/OrdersPage';
import { SurveyPage } from '@/features/survey/SurveyPage';
import { ReportPage } from '@/features/report/ReportPage';
import { ResponseDetailPage } from '@/features/report/ResponseDetailPage';
import { MorePage } from '@/features/more/MorePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className="animate-in fade-in slide-in-from-bottom-3 duration-200 ease-out"
    >
      <Routes location={location}>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId/survey"
          element={
            <ProtectedRoute>
              <SurveyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/response/:orderId"
          element={
            <ProtectedRoute>
              <ResponseDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/more"
          element={
            <ProtectedRoute>
              <MorePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="bottom-center" richColors offset={80} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
