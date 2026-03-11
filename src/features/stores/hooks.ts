import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteStore, listStoreLatestPrices, listStores, upsertStore } from '@/services/stores';
import type { Store } from '@/types/db';

export const useStores = () => useQuery({ queryKey: ['stores'], queryFn: listStores });

export const useStoreLatestPrices = (storeId: string) =>
  useQuery({
    queryKey: ['store-latest-prices', storeId],
    queryFn: () => listStoreLatestPrices(storeId),
    enabled: Boolean(storeId),
  });

export const useSaveStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Store> & { name: string }) => upsertStore(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] }),
  });
};

export const useDeleteStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storeId: string) => deleteStore(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['store-latest-prices'] });
      queryClient.invalidateQueries({ queryKey: ['latest-prices'] });
    },
  });
};
