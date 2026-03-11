import { useMutation, useQueryClient } from '@tanstack/react-query';

import { exportUserBackup, restoreUserBackup } from '@/services/backup';

export const useExportBackup = () =>
  useMutation({
    mutationFn: exportUserBackup,
  });

export const useRestoreBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: unknown) => restoreUserBackup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['latest-prices'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-detail'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
