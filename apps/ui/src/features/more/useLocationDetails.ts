import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LocationDetails {
  id: string;
  name: string;
  code: string;
  description: string | null;
  address: string;
  address2: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  timezone: string;
  utcOffset: number;
}

export function useLocationDetails(locationId: string | undefined) {
  return useQuery({
    queryKey: ['location-details', locationId],
    queryFn: async () => {
      const { data } = await api.get<LocationDetails>('/auth/location');
      return data;
    },
    enabled: Boolean(locationId),
    staleTime: 60_000,
  });
}
